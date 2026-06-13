# FastAPI AI service (one app, one router per system under ai/<system>/).
# Build context is the REPO ROOT (see docker-compose.yml) so we can copy both
# ai/ and the sibling db/ — driver_eval/modules/storage.py computes DB_DIR as
# repo-root/db, so they must land as siblings under /app.
FROM python:3.12-slim

WORKDIR /app

COPY ai/requirements.txt ./ai/requirements.txt
RUN pip install --no-cache-dir -r ai/requirements.txt

COPY ai/ ./ai/
COPY db/ ./db/

WORKDIR /app/ai
EXPOSE 8001
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
