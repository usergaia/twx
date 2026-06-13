# Smart Logistics Platform

Rule-based driver behavior scoring, batch CSV evaluation, an n8n driver-evaluation webhook, and an n8n-driven email dispatch workflow.

**Which way to run?** Use **dev (host)** while coding (hot reload), or **prod (Docker Compose)** to bring the whole stack up with one command.

---

## Prerequisites

- **Docker Desktop** with Docker Compose v2 — enough on its own for the prod stack
- **Python 3.12+** with a venv in `ai/.venv/` — for running the AI service on the host (dev)
- **Node.js 20+** (Next.js 16 requires modern Node) — for running the FE on the host (dev)
- **[Ollama](https://ollama.com)** with a tool-capable model pulled — only for the Text Analyzer: `ollama pull llama3.1` (then `ollama serve`, usually auto-started). `llama2` won't work (no tool support).
- **PowerShell** (commands assume Windows; Bash equivalents noted where they differ)

---

## Port map

| Service          | Port | What runs there                    |
| ---------------- | ---- | ---------------------------------- |
| Next.js frontend | 3000 | Admin dashboard                    |
| AI / FastAPI     | 8001 | Driver evaluation + text analyzer  |
| Ollama           | 11434| Local LLM for the text analyzer    |
| n8n              | 5678 | Workflow engine + webhook receiver |
| MailHog SMTP     | 1025 | Outbound mail receiver             |
| MailHog UI       | 8025 | View intercepted emails            |

---

## Run in dev (host, hot reload)

Best for coding — edits reload instantly. One command per terminal. You usually only need the AI + FE; start n8n/MailHog only when testing those flows.

```powershell
# 1. AI service (auto-reloads on .py edits)
cd ai
.\.venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8001
```

```powershell
# 2. Frontend (hot reload)
cd fe
npm run dev
```

```powershell
# 3. n8n — only when testing webhooks/email
docker run -it --rm -p 5678:5678 -v n8n_data:/home/node/.n8n n8nio/n8n
```

```powershell
# 4. MailHog — only when testing email
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog
```

Then open <http://localhost:3000>.

First-time setup (once): `cd ai && python -m venv .venv && .\.venv\Scripts\Activate.ps1 && pip install -r requirements.txt`, and `cd fe && npm install`.

---

## Run in prod (Docker Compose)

One command builds and starts the **whole stack** (FE + AI + n8n + MailHog) on a shared network:

```powershell
docker compose up --build
```

Then open <http://localhost:3000>. First run takes a few minutes (it builds the FE + AI images); later runs are fast. Re-run with `--build` only after a code change.

Common commands:

| Command | What it does |
| ------- | ------------ |
| `docker compose up --build` | Build + start all services (logs in foreground) |
| `docker compose up -d` | Start in the background (no rebuild) |
| `docker compose ps` | Status + ports |
| `docker compose logs -f n8n` | Tail one service's logs (`fe` / `ai` / `n8n` / `mailhog`) |
| `docker compose down` | Stop + remove containers — **data survives** (n8n workflows + `db/`) |
| `docker compose down -v` | ⚠️ also wipes volumes (loses n8n workflows + owner account) |

> First run only: import + activate the n8n workflows (see [Service-by-service → n8n](#n8n)). They persist in the `n8n_data` volume afterward.

---

## Service-by-service

### AI / FastAPI

Start: `uvicorn main:app --reload --port 8001` (from `ai/` with the venv active). Entry is `ai/main.py` (app + CORS + a router per system). `--reload` picks up `.py` edits; CSV edits in `ai/driver_eval/data/drivers.csv` apply on the next request.

Test: Swagger UI at <http://localhost:8001/docs>; health `curl http://localhost:8001/health` → `{"status":"ok"}`.

| Method | Path                      | Purpose                                                 |
| ------ | ------------------------- | ------------------------------------------------------- |
| `GET`  | `/health`                 | Health check                                            |
| `POST` | `/evaluate`               | Score a single driver                                   |
| `POST` | `/drivers/batch`          | Multipart CSV upload (overwrites `ai/driver_eval/data/drivers.csv`) |
| `GET`  | `/drivers/batch`          | Return the current CSV as JSON rows                     |
| `POST` | `/drivers/batch/evaluate` | Score every row in the current CSV                      |
| `POST` | `/analyze`                | Classify a free-text driver log via the LLM (needs Ollama) |
| `POST` | `/report`                 | Narrate a driver_eval result into a written incident report (needs Ollama) |

**Text Analyzer** needs Ollama running with a tool-capable model: `ollama pull llama3.1` then `ollama serve`. FastAPI calls Ollama server-side via function calling. Two endpoints: `/analyze` classifies a free-text log → `{risk_level, explanation, risk_factors, …}`; `/report` narrates a `driver_eval` result → `{summary, recommendations, …}` (it references the rules-engine verdict, doesn't re-score). The **Generate incident report** button on `/drivers/evaluate` chains rules→LLM: evaluate a driver, then have the LLM write up the findings. Swap the model with `OLLAMA_MODEL=qwen2.5`; point at a remote host with `OLLAMA_URL`. If Ollama is down or the model isn't pulled, both endpoints return a clear **503** (not a crash).

### Frontend (Next.js)

Start: `npm run dev` (from `fe/`). Sidebar: **Dashboard**, **Email Test**, **Driver Evaluation**, **Batch Evaluation**, **Text Analyzer**. Dev-console scope — for testing the backend by hand, not the production end-user UI.

Lint before committing: `cd fe && npm run lint`.

### n8n

Under Docker Compose, n8n is already running — skip the standalone `docker run` in the dev section.

**First-time workflow import** (once — persists in the `n8n_data` volume):

1. Open <http://localhost:5678>, create the owner account.
2. **Create Workflow → ⋮ → Import from File**.
3. Import [n8n/driver-eval-wh.json](n8n/driver-eval-wh.json) and **Activate**/**Publish** it (top-right).
4. Import [n8n/email-wh.json](n8n/email-wh.json), set its SMTP credential (see MailHog), and activate it.

| Workflow | Production URL | Does |
| -------- | -------------- | ---- |
| Driver evaluation | `POST http://localhost:5678/webhook/driver-eval` | Forwards a driver payload to the AI's `/evaluate`, formats and returns it |
| Email dispatch | `POST http://localhost:5678/webhook/form-submit` | Validates a form and sends an email via MailHog |

### MailHog

Under Docker Compose, MailHog is already running. View caught mail at <http://localhost:8025>.

**SMTP credential in n8n:** host **`mailhog`**, port **`1025`**, no auth, no TLS. (`mailhog` is the in-network hostname; `localhost` won't resolve from inside the n8n container. If MailHog runs standalone but n8n in compose, use `host.docker.internal`.)

---

## How to test each feature

### 1. Single driver evaluation

**Frontend:** open <http://localhost:3000/drivers/evaluate>, fill the form, click **Evaluate driver** → the result panel shows score/status/alerts. Persisted to `db/results.json` + `db/drivers.json`.

**curl:**

```bash
curl -X POST http://localhost:8001/evaluate \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","location":"HQ","speed":95,"weather":"rain","fuel":15,"temperature":95}'
```

Expected: a `danger`-status result with alerts for high-risk driving, wet conditions, low fuel, and engine overheating.

### 2. Batch driver evaluation (CSV upload)

**Frontend:** open <http://localhost:3000/drivers/batch>. The **Current dataset** card shows the committed sample at [ai/driver_eval/data/drivers.csv](ai/driver_eval/data/drivers.csv). Upload a `.csv`, then click **Evaluate dataset**.

**CSV format:** required `name`, `location`, `speed`; optional `route`, `weather`, `fuel`, `temperature`, `fatigue`.

```csv
name,location,speed,route,weather,fuel,temperature,fatigue
Alice,HQ,55,routeC,clear,85,72,10
Bob,Warehouse,82,routeA,clear,40,78,30
```

**Negative tests:** a CSV missing `location` → `400 "missing required column(s): location"`; `weather=snowy` → `400` with the row index + Pydantic detail.

### 3. Email dispatch (n8n workflow)

**Frontend:** open <http://localhost:3000/email-test>, fill the form, submit → the email appears at <http://localhost:8025>.

**curl** (skips the FE proxy at `/api/n8n/email`):

```bash
curl -X POST http://localhost:5678/webhook/form-submit \
  -H "Content-Type: application/json" \
  -d '{"name":"Edgar","email":"edgar@example.com","order":"Logistics Delivery"}'
```

Expected: `{"status":"success","message":"Form submitted"}`. An empty `email` returns `{"status":"error","message":"Form empty"}` and skips the send. A `404 "webhook not registered"` means the workflow isn't imported/activated yet.

### 4. Driver evaluation via the n8n webhook

The Week 6 deliverable (Webhook → HTTP Request → AI → format → respond). Requires the AI service + n8n running and `driver-eval-wh.json` imported **and activated**.

```bash
curl -X POST http://localhost:5678/webhook/driver-eval \
  -H "Content-Type: application/json" \
  -d '{"name":"Juan","location":"Manila","speed":95,"weather":"rain","fatigue":80}'
```

Expected:

```json
[{"status":"success","driver":"Juan","score":50,"risk_status":"caution","alerts":["High-risk driving","Wet road conditions","Driver fatigue detected"]}]
```

A clean driver (`"speed":40,"weather":"clear","fatigue":0`) returns `score 100, risk_status "safe", alerts []`. The dashboard does **not** use this webhook — it calls `/evaluate` directly; the webhook is the automation/integration entry point.

---

## Troubleshooting

**`uvicorn` "address already in use" on 8001**
Another uvicorn is still running. Find the PID with `Get-NetTCPConnection -LocalPort 8001` (PowerShell) or `netstat -ano | findstr 8001` (cmd), then `taskkill /PID <pid> /F`.

**FE shows 422 on `POST /evaluate`**
Pydantic rejected the request body. Open the DevTools Network tab and read the `detail` array — it names the missing/invalid field. Most common cause: `speed` sent as a string instead of a number.

**FE shows 500 on `POST /drivers/batch/evaluate`**
The stored CSV at `ai/driver_eval/data/drivers.csv` is corrupt (likely manually edited). Re-upload a known-good CSV via the Upload card.

**Frontend nav link 404s**
Check the dev server is on port 3000 and the page exists under `fe/src/app/`. If you renamed a route, update the `href` in [fe/src/components/layout/nav-items.ts](fe/src/components/layout/nav-items.ts).

**Pandas / multipart errors when starting uvicorn**
Old `requirements.txt`. From `ai/` with the venv active: `pip install -r requirements.txt`.

**Next.js stale type errors after renaming a route**
`rm -rf fe/.next` and restart `npm run dev`.

**n8n webhook returns `404 "not registered"`**
The workflow isn't activated. Open it in the n8n UI and Activate/Publish it.
