# Smart Logistics Platform

Rule-based driver behavior scoring, batch CSV evaluation, and an n8n-driven email dispatch workflow. This README focuses on **how to run and test the features that exist today**.

---

## Prerequisites

- **Python 3.12+** with a venv in `ai/.venv/`
- **Node.js 20+** (Next.js 16 requires modern Node)
- **Docker Desktop** (for n8n + MailHog)
- **PowerShell** (commands below assume Windows; Bash equivalents are noted where they differ)

---

## Port map

| Service          | Port | What runs there                    |
| ---------------- | ---- | ---------------------------------- |
| Next.js frontend | 3000 | Admin dashboard                    |
| AI / FastAPI     | 8001 | Driver evaluation service          |
| n8n              | 5678 | Workflow engine + webhook receiver |
| MailHog SMTP     | 1025 | Outbound mail receiver             |
| MailHog UI       | 8025 | View intercepted emails            |

---

## Quick start (all four services)

Open four terminals and run one command in each:

```powershell
# 1. AI service
cd ai
.\.venv\Scripts\Activate.ps1
uvicorn api.main:app --reload --port 8001
```

```powershell
# 2. Frontend
cd fe
npm install   # first time only
npm run dev
```

```powershell
# 3. n8n
docker run -it --rm -p 5678:5678 -v n8n_data:/home/node/.n8n n8nio/n8n
```

```powershell
# 4. MailHog
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog
```

Then open <http://localhost:3000> for the dashboard.

---

## Service-by-service

### AI / FastAPI

**Start:**

```powershell
cd ai
.\.venv\Scripts\Activate.ps1
uvicorn api.main:app --reload --port 8001
```

First-time setup (only once):

```powershell
cd ai
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

`--reload` watches Python files — edits to `ai/api/main.py` or `ai/driver_decision_system.py` are picked up automatically. CSV edits in `ai/data/drivers.csv` are picked up on the next request (no restart needed).

**Test:**

- Swagger UI: <http://localhost:8001/docs> — try any endpoint with "Try it out"
- Health: `curl http://localhost:8001/health` → `{"status":"ok"}`

**Endpoints:**

| Method | Path                      | Purpose                                                 |
| ------ | ------------------------- | ------------------------------------------------------- |
| `GET`  | `/health`                 | Health check                                            |
| `POST` | `/evaluate`               | Score a single driver                                   |
| `POST` | `/drivers/batch`          | Multipart CSV upload (overwrites `ai/data/drivers.csv`) |
| `GET`  | `/drivers/batch`          | Return the current CSV as JSON rows                     |
| `POST` | `/drivers/batch/evaluate` | Score every row in the current CSV                      |

### Frontend (Next.js)

**Start:**

```powershell
cd fe
npm run dev
```

First-time setup:

```powershell
cd fe
npm install
```

**Test:**

- Open <http://localhost:3000>
- Sidebar links: **Dashboard**, **Email Test**, **Driver Evaluation**, **Batch Evaluation**

The dashboard is dev-console scope — it exists for testing the backend features by hand. It's not the production end-user UI (that's planned as a separate parallel build).

**Lint (before committing):**

```powershell
cd fe
npm run lint
```

### n8n

**Start:**

```powershell
docker run -it --rm -p 5678:5678 -v n8n_data:/home/node/.n8n n8nio/n8n
```

**First-time workflow import:**

1. Open <http://localhost:5678>
2. Create an account (n8n local).
3. Click **Workflows → Import from File**.
4. Import [n8n/email-wh.json](n8n/email-wh.json). Activate it.
5. (Optional) Import [n8n/wh-draft.json](n8n/wh-draft.json) if you're iterating on a draft.

Once active, n8n exposes a webhook at `POST http://localhost:5678/webhook/form-submit`.

### MailHog

**Start:**

```powershell
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog
```

**Test:**

- UI: <http://localhost:8025> — every email the n8n workflow sends lands here.

---

## How to test each feature

### 1. Single driver evaluation

Goal: score one driver against the rule engine and see the result.

**Via the frontend:**

1. Start the AI service and the frontend (see above).
2. Open <http://localhost:3000/drivers/evaluate>.
3. Fill in the form (defaults are pre-populated: Alice, HQ, 60 km/h, routeA, clear, fuel 80, temp 70).
4. Click **Evaluate driver**.
5. The result panel on the right shows score, status, and triggered alerts. A toast confirms success.
6. Persisted records: see `db/results.json` and `db/drivers.json`.

**Via curl:**

```powershell
curl -X POST http://localhost:8001/evaluate `
  -H "Content-Type: application/json" `
  -d '{"name":"Alice","location":"HQ","speed":95,"weather":"rain","fuel":15,"temperature":95}'
```

Bash equivalent:

```bash
curl -X POST http://localhost:8001/evaluate \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","location":"HQ","speed":95,"weather":"rain","fuel":15,"temperature":95}'
```

Expected: a `danger`-status result with alerts for high-risk driving, wet conditions, low fuel, and engine overheating.

### 2. Batch driver evaluation (CSV upload)

Goal: upload a fleet snapshot CSV and score every row in one pass.

**Via the frontend:**

1. Start the AI service and the frontend.
2. Open <http://localhost:3000/drivers/batch>.
3. The **Current dataset** card already shows the committed sample at [ai/data/drivers.csv](ai/data/drivers.csv) (5 rows: Alice, Bob, Carlos, Diana, Ethan).
4. To upload your own CSV: click the file picker, choose a `.csv`, click **Upload**. The dataset refreshes.
5. Click **Evaluate dataset**. Result cards render one per driver; `db/drivers.json` and `db/results.json` grow by N entries.

**CSV format:** columns must mirror the `DriverInput` model. Required: `name`, `location`, `speed`. Optional (defaults applied if missing): `route`, `weather`, `fuel`, `temperature`, `fatigue`.

```csv
name,location,speed,route,weather,fuel,temperature,fatigue
Alice,HQ,55,routeC,clear,85,72,10
Bob,Warehouse,82,routeA,clear,40,78,30
```

**Via Swagger:**

1. Open <http://localhost:8001/docs>.
2. Expand `POST /drivers/batch`, click **Try it out**, attach the CSV, **Execute**.
3. Expand `POST /drivers/batch/evaluate`, click **Try it out**, **Execute**.

**Negative tests** (to confirm validation):

- Upload a CSV missing the `location` column → expect `400 "missing required column(s): location"`.
- Upload a CSV with `weather=snowy` (not in `clear|rain|fog`) → expect `400` with the row index + Pydantic detail.

### 3. Email dispatch (n8n workflow)

Goal: trigger the n8n workflow, validate input, dispatch an email, see it land in MailHog.

**Via the frontend:**

1. Start n8n, MailHog, and the frontend.
2. Open <http://localhost:3000/email-test>.
3. Fill the form (name, email, order).
4. Submit. A toast confirms success.
5. Open <http://localhost:8025> — the email should appear there.

**Via curl** (skips the FE proxy at `/api/n8n/email`):

```bash
curl -X POST http://localhost:5678/webhook/form-submit \
  -H "Content-Type: application/json" \
  -d '{"name":"Edgar","email":"edgar@example.com","order":"Logistics Delivery"}'
```

Expected: `{"status":"success","message":"Form submitted"}`. Submitting with an empty `email` field returns `{"status":"error","message":"Form empty"}` and skips the email send.

---

## Stopping services

- **Terminal-run** (AI, FE, n8n with `-it`): `Ctrl+C` in each terminal.
- **Docker detached** (MailHog with `-d`): `docker ps` to find the container, then `docker stop <id>`.
- **Cleanup containers**: `docker rm <id>` after stop.

---

## Troubleshooting

**`uvicorn` "address already in use" on 8001**
Another uvicorn is still running. Find the PID with `Get-NetTCPConnection -LocalPort 8001` (PowerShell) or `netstat -ano | findstr 8001` (cmd), then `taskkill /PID <pid> /F`.

**FE shows 422 on `POST /evaluate`**
Pydantic rejected the request body. Open the DevTools Network tab and read the `detail` array in the response — it names the missing/invalid field. Most common cause: `speed` sent as a string instead of a number.

**FE shows 500 on `POST /drivers/batch/evaluate`**
The stored CSV at `ai/data/drivers.csv` is corrupt (likely manually edited into a bad state). Re-upload a known-good CSV via the Upload card — once accepted, the file is back in a validated state.

**Frontend nav link 404s**
Check that the dev server is running on port 3000 and the page exists under `fe/src/app/`. If you renamed a route, also update the `href` in [fe/src/components/layout/nav-items.ts](fe/src/components/layout/nav-items.ts).

**Pandas / multipart errors when starting uvicorn**
You're on an older `requirements.txt`. From `ai/` with the venv active: `pip install -r requirements.txt`.

**Next.js stale type errors after renaming a route**
`rm -rf fe/.next` and restart `npm run dev` — the `.next/types/validator.ts` cache regenerates from the current `app/` tree.
