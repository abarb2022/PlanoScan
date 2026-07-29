# Deploying PlanoScan (free, no domain needed)

A beginner-friendly checklist to get this app live on the web this week, for free.

**The shape of it:** your GitHub repo (`abarb2022/PlanoScan`) connects to two hosting platforms.
Every `git push` to `main` auto-redeploys both — no manual redeploy steps, ever.

- **Backend** (Spring Boot + Postgres) → **Render** → `https://<something>.onrender.com`
- **Frontend** (React/Vite) → **Vercel** → `https://<something>.vercel.app`
- **Photos** → **Cloudinary** (free image hosting, so photos survive backend redeploys)

Dashboard button names below may drift slightly over time — the *steps* and *env var names* are what matter.

---

## 0. Before you start: generate two secrets

You'll need a random JWT signing secret and a real admin password (don't use the repo's dev defaults in production). Anything long and random works. Easiest one-liner in PowerShell:

```powershell
-join ((48..57)+(65..90)+(97..122)|Get-Random -Count 40|%{[char]$_})
```

Run it twice — once for `JWT_SECRET`, once for `ADMIN_PASSWORD`. Save both somewhere (a notes app is fine) — you'll paste them into Render shortly.

---

## 1. Cloudinary (photo storage) — ~2 minutes

1. Go to cloudinary.com → sign up free (no card required).
2. On your Cloudinary dashboard home page, find the **"API Environment variable"** box — it's a single line like:
   ```
   CLOUDINARY_URL=cloudinary://123456789:AbC-dEf...@your-cloud-name
   ```
3. Copy that whole value (just the part after `CLOUDINARY_URL=`). You'll paste it into Render as `CLOUDINARY_URL`.

---

## 2. Gemini (AI photo scoring) — ~2 minutes — **don't skip this one**

Without a real key here, submissions never get AI-scored — no star ratings anywhere, and your Manager Dashboard's "Graded" and "Avg score" numbers will just sit blank for the whole presentation. This is the one that's easy to mistake for optional because the app still *runs* without it — it just silently stops scoring anything.

1. Go to aistudio.google.com → sign in with a Google account → **Get API key** → **Create API key**. Free tier, no card required.
2. Copy the key. You'll paste it into Render as `GEMINI_API_KEY`.

---

## 3. SendGrid (emailing new managers/reps their password) — ~5-10 minutes — **also required**

When an admin/manager creates a new manager or rep account, the app emails them a temporary password — and if that email fails to send for *any* reason, the whole "create manager/rep" action fails and nothing gets saved. So this isn't optional either, even though it's the most annoying one to set up.

1. Go to sendgrid.com → sign up free (100 emails/day free, forever).
2. **Sender verification** (SendGrid won't send from an address it hasn't verified as belonging to you): Settings → Sender Authentication → **Verify a Single Sender**. Use an email address you actually control — a personal Gmail is fine. You'll get a confirmation email; click the link in it.
3. **Settings → API Keys → Create API Key** (Full Access is simplest). Copy it immediately — SendGrid only shows it once.

You'll set two env vars on Render from this:
- `SENDGRID_API_KEY` — the key from step 3.
- `SENDGRID_FROM_EMAIL` — the exact email address you verified in step 2 (must match exactly, or sends still fail even with a valid key).

---

## 4. Render — Postgres database — ~3 minutes

1. Go to render.com → sign up free, connect your GitHub account.
2. **New → PostgreSQL**. Any name/region, free plan.
3. Once it's created, open it and find the connection details: **Hostname**, **Port**, **Database**, **Username**, **Password** (Render shows these individually, plus a combined URL — you want the *individual* fields).
4. Build your JDBC URL from those pieces:
   ```
   jdbc:postgresql://<Hostname>:<Port>/<Database>
   ```
   Keep Username and Password separate — you'll set all three as separate env vars in the next step.

---

## 5. Render — backend web service — ~5 minutes

1. **New → Web Service** → connect the `abarb2022/PlanoScan` repo.
2. Settings:
   - **Root Directory**: `planoScan`
   - **Runtime**: Docker (Render should auto-detect the `Dockerfile` at `planoScan/Dockerfile`)
   - **Instance Type**: Free
3. **Environment variables** — add all of these:

   | Key | Value |
   |---|---|
   | `DB_URL` | the `jdbc:postgresql://...` URL you built in step 4 |
   | `DB_USERNAME` | from step 4 |
   | `DB_PASSWORD` | from step 4 |
   | `JWT_SECRET` | the random string you generated in step 0 |
   | `ADMIN_EMAIL` | whatever email you want to log in with as admin |
   | `ADMIN_PASSWORD` | the random string you generated in step 0 |
   | `ADMIN_NAME` | your name (or anything) |
   | `PHOTO_STORAGE` | `cloudinary` |
   | `CLOUDINARY_URL` | from step 1 |
   | `GEMINI_API_KEY` | from step 2 — **required**, not optional, see above |
   | `SENDGRID_API_KEY` | from step 3 — **required**, not optional, see above |
   | `SENDGRID_FROM_EMAIL` | the exact address you verified in step 3 |
   | `CORS_ALLOWED_ORIGINS` | leave blank for now — you'll come back and set this in step 7 |

4. **Create Web Service**. First build takes a few minutes (it's compiling the whole app with Gradle inside Docker) — watch the logs for `Started DemoApplication`.
5. Once live, copy its URL, something like `https://planoscan-backend.onrender.com`.

**Free-tier notes**:
- This service sleeps after 15 minutes with no traffic. Cold-start wake-up has been observed taking **up to ~4-5 minutes**, not the ~30-50s originally guessed — open the URL yourself **10+ minutes** before your presentation to warm it up, and don't panic if it looks stuck for a while.
- The free plan hard-caps the container at 512MB RAM. The `Dockerfile` already sets JVM flags tuned and load-tested to stay well under that (see the comment in the Dockerfile for details) — you don't need to do anything for this, just don't remove those flags from the `ENTRYPOINT` line if you're editing the Dockerfile.

---

## 6. Vercel — frontend — ~3 minutes

1. Go to vercel.com → sign up free, connect GitHub.
2. **Add New → Project** → import the same `abarb2022/PlanoScan` repo.
3. Settings:
   - **Root Directory**: `client`
   - **Framework Preset**: Vite (should auto-detect)
4. **Environment Variables** → add:

   | Key | Value |
   |---|---|
   | `VITE_API_BASE_URL` | your Render backend URL from step 5.5 (no trailing slash) |

5. **Deploy**. Once done, copy the URL, something like `https://planoscan.vercel.app`.

---

## 7. Close the loop: tell the backend about the frontend's URL

1. Back in Render → your web service → **Environment**.
2. Set `CORS_ALLOWED_ORIGINS` to your Vercel URL from step 6.5 (e.g. `https://planoscan.vercel.app`).
3. Save — Render automatically redeploys the backend with the new value.

---

## 8. Test it

1. Open your Vercel URL.
2. Log in with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` you set in step 5.
3. Click through Stores, Dashboard, Visit Plan.
4. **Create a manager** — confirm it succeeds (proves `SENDGRID_API_KEY`/`SENDGRID_FROM_EMAIL` are wired correctly) and check the verified inbox for the temp-password email.
5. As a rep, upload a test photo — confirm it appears (proves Cloudinary is wired correctly) and check your Cloudinary dashboard's Media Library to see it landed there.
6. **Give it a minute or two, then check the Dashboard tab** — the photo should move from "Submitted" to "Graded" once Gemini finishes scoring it (proves `GEMINI_API_KEY` is wired correctly). If it never leaves "Submitted," recheck the key.
7. Open the browser dev tools console — there should be no CORS errors.

---

## Updating it later

```
git push origin main
```

That's it. Render rebuilds the backend, Vercel rebuilds the frontend, both automatically — usually live again within a few minutes.

## If something's red

- **Render build fails**: click into the failed deploy's logs — Gradle's error will be near the bottom.
- **Frontend loads but API calls fail / CORS error in console**: double check `CORS_ALLOWED_ORIGINS` on Render exactly matches your Vercel URL (including `https://`, no trailing slash), and `VITE_API_BASE_URL` on Vercel exactly matches your Render URL.
- **Login fails**: confirm `ADMIN_EMAIL`/`ADMIN_PASSWORD` on Render match what you're typing in.
- **Photo upload fails**: double check `CLOUDINARY_URL` was pasted in full (it's one long string starting with `cloudinary://`).
- **Photos upload fine but never get a score/star rating**: `GEMINI_API_KEY` is missing or wrong. Check it's set on Render, then check Render's logs for `GeminiAiClient` errors.
- **Creating a manager/rep fails with an error toast**: almost certainly `SENDGRID_API_KEY`/`SENDGRID_FROM_EMAIL`. Check Render's logs for a line starting `SendGrid returned status ...` — it'll tell you the exact reason (invalid key vs. unverified sender vs. something else). Note the whole create action fails and nothing gets saved if the email fails, by design.
- **A request just hangs forever / spins with no error**: this can mean the backend process hit an internal memory error mid-request (e.g. `OutOfMemoryError`) and died without ever sending a response — check Render's logs around that time for `OutOfMemoryError` or an "Instance failed: ... Ran out of memory" banner. If you see that despite the Dockerfile's memory flags, tell me — it means the app's actual memory needs grew (new dependencies, more data) and the flags need retuning, not that something is wrong with your setup.
- **`Instance failed: ... Ran out of memory (used over 512MB)`**: the JVM flags in the `Dockerfile`'s `ENTRYPOINT` are the fix for this — make sure you haven't reverted or edited that line.
