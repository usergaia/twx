"""HTTP boundary to the local Ollama server. The only module here that touches
the network. Import-safe: env is read at import but no request is made until
chat_completion() is called.

Ollama stays bound to localhost (never exposed publicly). FastAPI calls it
server-side; the browser never reaches it directly.
"""

import os

import httpx

# Configurable so the model can be swapped (e.g. qwen2.5) with no code change.
# In Docker, point OLLAMA_URL at the host (http://host.docker.internal:11434).
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1")

# First call after `ollama serve` loads the model into RAM and can be slow.
REQUEST_TIMEOUT = float(os.getenv("OLLAMA_TIMEOUT", "120"))


class OllamaUnavailable(RuntimeError):
    """Raised when the Ollama server can't be reached or errors out."""


def chat_completion(messages: list[dict], tools: list[dict]) -> dict:
    """Call Ollama's /api/chat with function-calling tools. Returns the parsed
    JSON response. Raises OllamaUnavailable on connection/timeout/HTTP errors."""
    payload = {
        "model": OLLAMA_MODEL,
        "messages": messages,
        "tools": tools,
        "stream": False,
    }
    try:
        resp = httpx.post(
            f"{OLLAMA_URL}/api/chat", json=payload, timeout=REQUEST_TIMEOUT
        )
        resp.raise_for_status()
        return resp.json()
    except httpx.HTTPStatusError as e:
        # Most often: model not pulled (404). Surface the body for diagnosis.
        raise OllamaUnavailable(
            f"Ollama returned {e.response.status_code} for model "
            f"'{OLLAMA_MODEL}': {e.response.text}. Is the model pulled "
            f"(`ollama pull {OLLAMA_MODEL}`)?"
        ) from e
    except (httpx.ConnectError, httpx.TimeoutException) as e:
        raise OllamaUnavailable(
            f"Could not reach Ollama at {OLLAMA_URL}. Is `ollama serve` "
            f"running and the model '{OLLAMA_MODEL}' pulled? ({e})"
        ) from e
