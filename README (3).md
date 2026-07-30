# PlanoScan

PlanoScan is an AI-powered retail execution platform that automates planogram compliance checks. Field reps photograph store shelves during their visits, and an AI vision model automatically scores each photo against the planogram - flagging violations for a manager to review instead of requiring someone to manually inspect every photo from every store.

---

## Table of Contents

- [The Problem](#the-problem)
- [Who It's For](#who-its-for)
- [Core Concepts](#core-concepts)
- [Features](#features)
- [How Scoring Works](#how-scoring-works)
- [User Roles & Permissions](#user-roles--permissions)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started (Local Development)](#getting-started-local-development)
- [API Overview](#api-overview)
- [Future Work](#future-work)

---

## The Problem

Retail brands and distributors pay for shelf space and negotiate exactly how their products should be displayed - which products, how many facings, in what position, on which shelf. In practice, verifying that stores actually follow this layout is done by field reps who visit stores, take photos, and send them up the chain for a manager to see. This doesn't scale: managers end up skimming hundreds of photos per week with no consistent standard, compliance issues get caught late (or never), and there's no structured historical record of how a store or rep is performing over time.

PlanoScan replaces the manual seeing step with an AI scoring pipeline, while keeping a human manager in the loop to confirm or dispute anything the AI flags.

## Who It's For

- **Admins / multi-company operators** - e.g. a retail brand, distributor, or an agency managing several client brands - who need to enforce planogram agreements across many stores, and manage multiple companies (each with its own products, planograms, stores, and staff) from a single platform.
- **Field sales/ managers** who assign stores and planograms to reps, monitor compliance across their territory, and review flagged issues.
- **Field reps** who visit stores on a schedule and need a simple, mobile-friendly way to capture and submit compliance photos.

## Core Concepts

| Concept | Description                                                                                                                      |
|---|----------------------------------------------------------------------------------------------------------------------------------|
| **Company** | A tenant in the system. Each company has its own managers, reps, stores, products, and planograms.                               |
| **Product** | A catalog entry for something that appears on a shelf (name, SKU, description, reference photo).                                 |
| **Planogram** | The expected shelf layout for a set of products - shelves, sections, expected product per section and facing count.              |
| **Store** | A physical retail location, with a geographic location  that products/planograms are assigned to.                                |
| **Planogram Assignment** | Links a planogram to a store for an active date range - this is what a submission is actually scored against.                    |
| **Store Assignment / Visit Plan** | Defines which rep is responsible for which store, and on which days - this drives the rep's daily/weekly visit schedule.         |
| **Submission** | A photo a rep uploads for a store visit, which goes through the scoring pipeline.                                                |
| **Score / Violation** | The AI's structured verdict on a submission: an overall score, four sub-scores, and a list of specific violations with severity. |
| **Flagged Review** | A submission that scored below threshold or has a high-severity violation, surfaced to managers for a human decision.            |
| **Feedback** | A manager's correction to an AI score (via dispute), preserved as future fine-tuning data.                                       |

## Features

**For Reps**
- Mobile-friendly camera capture flow with on-device blur detection, so a shaky/out-of-focus photo can be retaken before it's ever uploaded.
- HEIC → JPEG conversion in the browser (for iPhone photos) before upload.
- "Today's assignments" view of which stores to visit, a calendar view of the full visit plan, and a history of past submissions.
- Live push notifications  over WebSocket, without needing to refresh.

**For Managers**
- Dashboard with rep-level and company-level compliance stats (submitted vs. graded, average scores, per-week breakdowns).
- Visit plan builder: assign reps to stores on a recurring schedule via assignment rules.
- Product catalog management with reference images used as ground truth for AI scoring.
- Planogram builder/upload with shelf/section layout definition, and assignment of planograms to stores with date ranges.
- Interactive map-based store location picker when creating/editing a store.
- Flagged Reviews queue: see every AI-flagged submission, drill into the photo and violation breakdown, and either **acknowledge** the finding or **dispute** it with a corrected score and notes.
- Full submissions history across the company, filterable and viewable with photo + score detail.

**For Admins**
- Manage multiple companies (multi-tenant), each with isolated managers, reps, stores, and catalogs.
- Create/manage manager accounts; new managers and reps are emailed a temporary password automatically.
- Company switcher in the header to inspect any company's data.

**Platform-wide**
- JWT-based authentication with role-based access control (`ADMIN`, `MANAGER`, `REP`).
- Forced password change on first login for accounts created by an admin/manager.
- Real-time in-app notifications via WebSocket/STOMP.
- Pluggable photo storage - local disk for development, Cloudinary for production - selected purely by configuration.
- Automatic background scoring via a polling scheduler with retry/back-off and a dead-letter (`SCORING_FAILED`) state, so a flaky AI call never blocks the pipeline.

## How Scoring Works

1. A rep uploads a shelf photo for a store visit. The submission is created with status `PENDING`.
3. The claimed submission moves to `PROCESSING`. The photo is resized (max 1024px on the longest side) and sent to **Gemini 2.5 Flash** along with the store's active planogram and the reference images of every expected product.
4. The AI identifies products in the photo by brand/label/color, maps them onto the expected shelf sections, and returns a structured result: an **overall score (0–100)**, four **sub-scores** (brand accuracy, quantity accuracy, position accuracy, stock fullness), and a list of **violations** (`HIGH` / `MEDIUM` / `LOW` severity).
5. The submission is marked `SCORED`. It's automatically **flagged for review** if the overall score is below the configured threshold (default 90) or if any `HIGH`-severity violation is present.
6. If the Gemini call fails, it's retried up to 3 times with exponential back-off (5s → 25s → 125s) before the submission is marked `SCORING_FAILED` and surfaced separately from compliance-flagged submissions (this is a technical failure, not a compliance issue).
7. Flagged submissions land in the manager's **Reviews** queue, where the manager either:
   - **Acknowledges** the finding (confirms the AI was right), or
   - **Disputes** it, supplying a corrected score and a reason. This creates a `Feedback` record (score + photo + layout + correction) intended as training data for future model fine-tuning, and replaces the AI's score with the manager's corrected one.

See [`SCORING_SYSTEM.md`](SCORING_SYSTEM.md) for the full technical reference on the scoring pipeline, including the `layoutSpec` JSON schema, state diagram, and configuration properties.

## User Roles & Permissions

| Role | Can do |
|---|---|
| **ADMIN** | Manage companies, create managers, view any company's data via a company switcher, plus everything a manager can do. |
| **MANAGER** | Manage their company's stores, reps, products, planograms, planogram assignments, and visit plans; view the dashboard; review flagged submissions. |
| **REP** | View assigned stores and visit schedule, capture/upload compliance photos, view their own submission history. |

Access control is enforced both in the UI (tab visibility) and on the backend (Spring Security + JWT, method-level authorization).

## Architecture

```
┌────────────────────┐        HTTPS / REST + WebSocket        ┌──────────────────────────┐
│   React Frontend    │ ─────────────────────────────────────▶ │   Spring Boot Backend    │
│  (Vite + TS, SPA)   │ ◀───────────────────────────────────── │     (Java 17, REST)      │
└────────────────────┘                                         └──────────────────────────┘
                                                                        │        │
                                                        ┌───────────────┘        └───────────────┐
                                                        ▼                                          ▼
                                              ┌──────────────────┐                     ┌────────────────────┐
                                              │   PostgreSQL     │                     │   Gemini 2.5 Flash  │
                                              │ (Liquibase-managed│                    │   (AI scoring)      │
                                              │   schema)         │                    └────────────────────┘
                                              └──────────────────┘
                                                        ▲
                                    ┌───────────────────┼───────────────────┐
                                    ▼                                       ▼
                          ┌──────────────────┐                  ┌────────────────────┐
                          │ Local disk /      │                 │  SendGrid            │
                          │ Cloudinary        │                 │  (transactional      │
                          │ (photo storage)    │                 │  emails: temp        │
                          └──────────────────┘                  │  passwords)          │
                                                                 └────────────────────┘
```

- **Frontend** is a single-page React app that talks to the backend over a REST API, plus a WebSocket for live notifications.
- **Backend** is a layered Spring Boot app: `controller` → `service` → `repository` (JPA), with DTOs for request/response boundaries and a dedicated `ai` package abstracting the scoring provider behind an interface.
- **Database schema** is version-controlled with Liquibase changelogs, applied automatically on boot.
- **AI scoring** is isolated behind an `AiScoringClient` interface, so the Gemini implementation can be swapped for another provider (or a fine-tuned local model) without touching the scoring pipeline.
- **Photo storage** is likewise abstracted behind a `PhotoStorage` interface with `Local` and `Cloudinary` implementations, chosen at runtime via a config flag - local disk for development, Cloudinary in production so photos survive redeploys of an ephemeral container.

## Tech Stack

**Backend**
- Java 17, Spring Boot 3.5
- Spring Web, Spring Security (JWT-based, stateless), Spring Data JPA, Spring WebSocket
- PostgreSQL, Liquibase (schema migrations)
- Google Gemini API (`gemini-flash-latest`) for multimodal AI scoring
- Cloudinary (image hosting) and SendGrid (transactional email) integrations
- Lombok, Thumbnailator (image resizing)
- Gradle build, Spotless (Google Java Format) for code style

**Frontend**
- React 19 + TypeScript, built with Vite
- Leaflet / react-leaflet for the interactive store map picker
- `@stomp/stompjs` for real-time WebSocket notifications
- `heic2any` for client-side HEIC → JPEG conversion (iPhone photo support)

**Infrastructure**
- Dockerized backend (multi-stage build, JVM tuned to run inside a 512MB container)
- Designed for a free-tier deployment: Render (backend + Postgres), Vercel (frontend), Cloudinary (photos)

## Project Structure

```
PlanoScan/
├── client/                        # React + TypeScript frontend (Vite)
│   └── src/
│       ├── components/            # Feature-organized UI (auth, store, planogram, product,
│       │                          #   rep, manager, company, dashboard, review, submission, ...)
│       ├── services/               # API client + per-resource service modules
│       ├── hooks/                  # useAuth, useEscapeKey
│       ├── mappers/, types/, utils/
│       └── App.tsx                 # Role-aware tab routing shell
│
├── planoScan/                     # Spring Boot backend
│   ├── service/src/main/java/com/example/demo/
│   │   ├── controller/             # REST endpoints (auth, manager, rep, admin, products, ...)
│   │   ├── service/                 # Business logic (scoring, submissions, assignments, email, ...)
│   │   ├── entity/                  # JPA entities (User, Company, Store, Product, Planogram, Submission, Score, Feedback, ...)
│   │   ├── repository/              # Spring Data repositories
│   │   ├── dto/                     # Request/response DTOs, grouped by feature
│   │   ├── ai/                      # AiScoringClient interface + Gemini implementation
│   │   ├── security/                # JWT filter, auth entry point, access-denied handler
│   │   ├── config/                  # Security, CORS, WebSocket config
│   │   └── scheduling/              # Background scoring scheduler
│   ├── service/src/main/resources/
│   │   ├── application.properties   # Config (env-var driven, sane local defaults)
│   │   └── db/changelog/            # Liquibase migration changelogs
│   ├── build.gradle
│   └── Dockerfile
│
├── DEPLOY.md                      # Free-tier deployment walkthrough (Render + Vercel + Cloudinary)
└── SCORING_SYSTEM.md              # Deep-dive reference on the AI scoring pipeline
```

## Getting Started (Local Development)

### Prerequisites
- Java 17
- Node.js (18+) and npm
- PostgreSQL running locally
- A Google Gemini API key (free tier available at [aistudio.google.com](https://aistudio.google.com)) - required for real AI scoring; the app runs without one but submissions won't get scored.

### 1. Database

Create a local Postgres database (the default config points at `jdbc:postgresql://localhost:5432/postgres`). Liquibase will create/update the schema automatically on first boot - no manual SQL needed.

### 2. Backend

```bash
cd planoScan
./gradlew bootRun
```

The API starts on `http://localhost:8082`. To use real AI scoring, email sending, or cloud photo storage locally, set the relevant environment variables before starting or add them to a local, git-ignored `application-local.properties` file.

### 3. Frontend

```bash
cd client
npm install
npm run dev
```

The app starts on `http://localhost:5173` and talks to the backend at `http://localhost:8082` by default.

### 4. Log in

Open `http://localhost:5173` and log in with the seeded admin credentials. From there you can create companies, managers, and reps, add products, build planograms, add stores, and start submitting/scoring photos.

## API Overview

The backend exposes a REST API under role-scoped prefixes, e.g.:

- `POST /planoscan/auth/login`, `POST /planoscan/auth/register` - authentication
- `/api/manager/**` - company/store/product/planogram/rep/planogram-assignment management, dashboard, reviews (MANAGER/ADMIN)
- `/api/rep/**` - a rep's assignments and submissions (REP)
- `/api/admin/**` - company and manager administration, manual scoring trigger (ADMIN)
- `/ws` - WebSocket endpoint (STOMP) for real-time notifications

See [`SCORING_SYSTEM.md`](SCORING_SYSTEM.md) for a concrete end-to-end walkthrough of the product → planogram → assignment → submission → scoring → review flow via the API.

## Future Work

we plan to continue with Gemini Flash, a capable, free-tier general-purpose model,  while using the system's existing manager feedback mechanism (the `Feedback` table, populated via disputes) to accumulate a growing set of reviewed, potentially corrected scoring cases from real usage. Only once a meaningful volume of such reviewed cases has been collected - on the order of roughly 200 - would fine-tuning a smaller, open, self-hostable vision-language model (e.g. LLaVA, Phi-3-Vision, served locally via Ollama) be revisited. The explicit intent is to avoid investing in GPU infrastructure before there is enough real data to justify it, letting the choice of whether and how to bring scoring in-house be driven by accumulated evidence rather than made speculatively upfront. Because the AI client is already abstracted behind the `AiScoringClient` interface, that swap would require no changes to the scoring pipeline itself.
