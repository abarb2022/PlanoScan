# PlanoScan Scoring System

A comprehensive reference for developers and administrators working with the AI-powered planogram compliance scoring pipeline.

---

## 1. Overview

PlanoScan lets retail managers define what a correctly stocked shelf should look like (a planogram), assign those planograms to stores, and then have field reps photograph each shelf during their visits. Once a photo is uploaded, an AI model compares the photo against the expected planogram layout and returns a 0-100 compliance score along with a structured breakdown of any violations.

The goal is to remove manual review from routine compliance checks while flagging genuinely problematic submissions for a human manager to inspect.

---

## 2. Product Catalog

Before a planogram can be scored accurately, the products that appear in it must be registered in the system.

### What a product record contains

- **Name** — human-readable product name, e.g. "Coca-Cola 500ml"
- **SKU** — optional stock-keeping unit code used by the retailer's own systems
- **Description** — optional free-text notes
- **Reference Image** — a clean photo of the product facing forward (the canonical look the AI uses as ground truth)
- **Company** — the company that owns the product (ADMIN assigns explicitly; managers inherit their own company)

### Why reference images matter

The scoring prompt sends both the submission photo and the reference images of every product listed in the planogram layout. Without a reference image, the AI must rely on textual descriptions alone, which significantly reduces position and brand-accuracy scores. Uploading a clear, well-lit reference photo for every product is the single most effective way to improve scoring quality.

Reference images are resized to a maximum of 1024 pixels on the longest side before being sent to the API (see section 9).

---

## 3. Planogram Management

A planogram describes the expected shelf layout for a specific product mix.

### Upload flow

1. Manager uploads a planogram file (PDF, image, or structured JSON).
2. A parsing step extracts the layout into a normalised `layoutSpec` JSON object.
3. The planogram is stored and can then be assigned to one or more stores.

### layoutSpec structure

`layoutSpec` is stored as a `JSONB` column on the `Planogram` entity. Its schema is flexible but the scorer expects the following shape:

```json
{
  "shelves": [
    {
      "shelfNumber": 1,
      "sections": [
        {
          "sectionId": "A1",
          "expectedProduct": "Coca-Cola 500ml",
          "expectedSku": "CC-500-RD",
          "facings": 4,
          "rowsDeep": 2
        },
        {
          "sectionId": "A2",
          "expectedProduct": "Pepsi 500ml",
          "expectedSku": "PP-500-BL",
          "facings": 4,
          "rowsDeep": 2
        }
      ]
    },
    {
      "shelfNumber": 2,
      "sections": [
        {
          "sectionId": "B1",
          "expectedProduct": "Sprite 500ml",
          "expectedSku": "SP-500-GR",
          "facings": 3,
          "rowsDeep": 1
        }
      ]
    }
  ]
}
```

Key fields:

| Field | Type | Description |
|-------|------|-------------|
| `shelfNumber` | integer | Top shelf = 1, increases downward |
| `sectionId` | string | Unique identifier within the planogram |
| `expectedProduct` | string | Product name, must match a Product record |
| `expectedSku` | string | Optional SKU cross-reference |
| `facings` | integer | Number of product faces visible from the front |
| `rowsDeep` | integer | Depth of stock behind the front facing |

### PlanogramAssignment

A `PlanogramAssignment` links a planogram to a store for a date range. When a rep submits a photo for a store, the scorer fetches the active assignment to know which planogram (and thus which `layoutSpec`) to evaluate against.

---

## 4. Submission and Scoring Pipeline

```
REP uploads photo
        |
        v
  Submission created
  status = PENDING
        |
        v
  Scheduler picks up
  (every 30 seconds,
   batch of unclaimed rows)
        |
        v
  status = PROCESSING
        |
        v
  Gemini API called
  with photo + layoutSpec
  + product reference images
        |
     success?
    /        \
  yes         no (retry < 3)
   |               |
   v               v
 score         wait and retry
 saved
   |
   v
 overall < 90
 OR any HIGH violation?
    /        \
  yes         no
   |           |
   v           v
flagged=true  flagged=false
status=SCORED status=SCORED
```

### Submission states

| State | Meaning |
|-------|---------|
| `PENDING` | Uploaded, not yet picked up by the scheduler |
| `PROCESSING` | Locked by a scheduler worker, AI call in progress |
| `SCORED` | Scoring complete; `flagged` indicates review needed |
| `SCORING_FAILED` | All retries exhausted (see section 10) |

---

## 5. AI Integration

### Model

The system uses **Gemini Flash 2.5** via the Google Generative AI REST API. This model supports multimodal input (text + images) and returns structured JSON responses.

### Strategy pattern

The AI client is abstracted behind an `AiScoringClient` interface:

```java
public interface AiScoringClient {
    ScoreResult score(ScoringRequest request);
}
```

`GeminiScoringClient` is the production implementation. To swap to a different provider (e.g. GPT-4o, Claude, a local model served via Ollama):

1. Implement `AiScoringClient`.
2. Register it as a Spring `@Component`.
3. Remove or conditionally disable `GeminiScoringClient` (use `@ConditionalOnProperty` if both need to coexist).
4. No changes to the scoring pipeline are required — the interface contract is all that matters.

### What the scoring prompt does

The prompt instructs the model to:

1. Examine the submission photo and identify each visible product by brand, label, and colour.
2. Map identified products to the expected positions in the `layoutSpec`.
3. For each section in the layout, judge whether the correct product is present, whether the facing count matches, and whether the shelf is fully stocked.
4. Return a JSON response matching the `ScoreResult` schema (see section 6).

The prompt is deterministic — temperature is set to 0 to reduce scoring variance between identical inputs.

---

## 6. Score Structure

The full score result is stored in the `Submission.scoreDetail` column as JSON.

### Overall score

A single integer from 0 to 100 representing the overall planogram compliance for the submission.

### Sub-scores

Four sub-scores, each 0-100, that feed into the overall score:

| Sub-score | Measures |
|-----------|---------|
| `brandAccuracy` | Correct brand in each shelf section |
| `quantityAccuracy` | Correct number of facings per section |
| `positionAccuracy` | Products placed in the correct shelf position |
| `stockFullness` | Shelves adequately stocked (no visible gaps) |

The overall score is a weighted average of the four sub-scores. Current weights are equal (25% each) and are configurable (see section 12).

### Violations

Each violation represents a specific deviation from the planogram:

```json
{
  "severity": "HIGH",
  "shelf": 1,
  "section": "A1",
  "expected": "Coca-Cola 500ml",
  "found": "Pepsi 500ml",
  "issue": "Wrong brand placed in section A1"
}
```

Severity levels:

| Severity | Meaning |
|----------|---------|
| `HIGH` | Wrong product or completely empty section — immediate action needed |
| `MEDIUM` | Correct product but wrong quantity or partially empty |
| `LOW` | Minor positioning deviation, cosmetic issue |

---

## 7. Flagging Rules

A submission is automatically flagged for manager review if either condition is true:

- The overall score is below the configured threshold (default: 90)
- The violation list contains at least one `HIGH` severity violation

Flagged submissions appear in the Manager Reviews tab and remain there until a manager takes action.

---

## 8. Manager Review Flow

When a manager reviews a flagged submission they choose one of two actions:

### ACKNOWLEDGE

The manager confirms the AI finding is correct. The violation is recorded as confirmed.

```
POST /api/manager/submissions/{id}/review
{ "action": "ACKNOWLEDGE" }
```

### DISPUTE

The manager believes the AI made an error. They may supply a corrected score and must supply notes explaining why.

```
POST /api/manager/submissions/{id}/review
{
  "action": "DISPUTE",
  "correctedScore": 95,
  "notes": "Products were correctly placed. Image angle was misleading."
}
```

When a DISPUTE is submitted:

1. A `Feedback` record is created linked to the submission.
2. `Feedback.usedForTraining` is set to `true`.
3. The corrected score replaces the AI score on the submission.
4. The submission is removed from the flagged queue.

The Feedback table accumulates examples of AI errors paired with the correct answer — the raw material for future fine-tuning (see section 11).

---

## 9. Image Efficiency

### Submission photo resizing

Before the submission photo is sent to the Gemini API, it is resized so that the longest dimension does not exceed 1024 pixels. This reduces API cost and latency without meaningfully affecting scoring accuracy for typical shelf photos.

### Product reference image caching

Reference images for products are fetched from storage once and cached in memory for the duration of a scoring job. If the same product appears in multiple sections of a planogram, the image bytes are only downloaded once per scoring call.

---

## 10. Error Handling

### Retry logic

If the Gemini API call fails (network error, 5xx response, malformed JSON), the scoring job is retried automatically. The scheduler tracks the attempt count on each submission:

- Attempts 1-3: retried with exponential back-off (5s, 25s, 125s)
- After 3 failed attempts: `status` is set to `SCORING_FAILED`

`SCORING_FAILED` submissions appear in the admin error queue. They are not flagged for manager review — the failure indicates a technical problem, not a compliance issue.

### Concurrency

The scheduler uses a `SELECT ... FOR UPDATE SKIP LOCKED` pattern to claim submissions. Multiple scheduler instances can run simultaneously without processing the same submission twice.

---

## 11. Future: Fine-tuning

The `Feedback` table is designed to accumulate training examples for future model fine-tuning.

### Current state

Every DISPUTE review creates a record with:
- The submission photo
- The planogram `layoutSpec`
- The AI's incorrect score and violations
- The manager's corrected score and notes
- `usedForTraining = true`

### Fine-tuning path

Once 200 or more DISPUTE records have been collected, the dataset is large enough to attempt supervised fine-tuning of a local multimodal model. Candidate models include:

- **LLaVA** (Large Language and Vision Assistant) — open weights, runs on a single A100 GPU
- **Phi-3-Vision** — smaller footprint, suitable for inference on CPU-only hardware

The fine-tuned model would be served locally (e.g. via Ollama) and registered as an alternative `AiScoringClient` implementation. Because the strategy pattern is already in place, switching from Gemini to a local model requires only a configuration change — no pipeline changes.

A monitoring job should track DISPUTE rate over time. A sustained DISPUTE rate above 15% indicates the model needs retraining. A rate below 5% suggests the model is performing well and fine-tuning can be deferred.

---

## 12. Configuration

The following properties must be set (typically in `application.properties` or via environment variables):

```properties
# Google Gemini API key — required for AI scoring
gemini.api.key=AIza...

# Score below which a submission is flagged for review (0-100)
# Default: 90
scoring.flag-threshold=90

# Maximum image dimension (pixels) before resizing for API call
# Default: 1024
scoring.image-max-size=1024

# Scheduler interval for picking up PENDING submissions (milliseconds)
# Default: 30000 (30 seconds)
scoring.scheduler-interval-ms=30000

# Maximum retry attempts before marking SCORING_FAILED
# Default: 3
scoring.max-retries=3
```

---

## 13. How to Use as a Developer

Follow these steps to run the full pipeline end-to-end in a local environment.

### Step 1: Add a product

1. Log in as a MANAGER (or ADMIN).
2. Navigate to the **Products** tab.
3. Click **Add Product**.
4. Fill in the name and optionally the SKU.
5. Upload a clear reference photo of the product facing forward.
6. Save.

### Step 2: Upload a planogram

Use the planogram upload endpoint (or the Planogram tab when built):

```
POST /api/manager/planograms
Content-Type: multipart/form-data

file=<planogram file>
name=Soft Drinks Aisle 1
```

After upload, verify that the `layoutSpec` was parsed correctly by fetching:

```
GET /api/manager/planograms/{id}
```

Check that each `expectedProduct` in the layout matches the name of a product you created in step 1.

### Step 3: Assign the planogram to a store

```
POST /api/manager/planogram-assignments
Content-Type: application/json

{
  "planogramId": "<planogram-id>",
  "storeId": "<store-id>",
  "startDate": "2026-07-01",
  "endDate": "2026-12-31"
}
```

### Step 4: Submit a photo as a REP

Log in as a REP assigned to the store, or use the API directly:

```
POST /api/rep/submissions
Content-Type: multipart/form-data

storeId=<store-id>
photo=<photo file>
```

The response includes the new submission ID and `status: "PENDING"`.

### Step 5: Trigger scoring (development)

In production, the scheduler runs every 30 seconds. In development you can invoke it directly:

```
POST /api/admin/scoring/trigger
```

Or simply wait for the scheduler to pick it up.

### Step 6: Check the result

```
GET /api/manager/submissions/{id}
```

The response includes:
- `status` — should be `SCORED`
- `overallScore` — the compliance score
- `flagged` — true if below threshold or HIGH violation present
- `scoreDetail` — full sub-scores, violations, confidence, and AI notes

### Step 7: Review flagged submissions

If the submission was flagged, it appears in the **Reviews** tab in the UI. Choose **Confirm Issue** to acknowledge the finding or **Dismiss — AI Error** to dispute it and provide a corrected score.
