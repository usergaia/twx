import json
import os
from pathlib import Path

# Repo-root db/ — shared flat-file persistence, anchored from a stable point so
# it resolves correctly both locally and in Docker regardless of where this
# module sits. ai/driver_eval/modules/storage.py -> parents[3] == repo root.
DB_DIR = Path(__file__).resolve().parents[3] / "db"
DRIVERS_PATH = str(DB_DIR / "drivers.json")
RESULTS_PATH = str(DB_DIR / "results.json")


# temporary (to be replaced by database in future)
def append_to_json(filepath, entry):
    os.makedirs(os.path.dirname(filepath) or ".", exist_ok=True)
    try:
        with open(filepath, "r") as f:
            data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        data = []
    data.append(entry)
    with open(filepath, "w") as f:
        json.dump(data, f, indent=4)
