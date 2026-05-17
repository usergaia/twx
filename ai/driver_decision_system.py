import json
import os
from datetime import datetime

ROUTES = {
    "routeA": {"traffic_level": "high"},
    "routeB": {"traffic_level": "medium"},
    "routeC": {"traffic_level": "low"},
}

DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "db")
DRIVERS_PATH = os.path.join(DB_DIR, "drivers.json")
RESULTS_PATH = os.path.join(DB_DIR, "results.json")


# Feature Extraction
def extract_features(driver):
    speed = driver["speed"]
    route = driver.get("route", "")
    weather = driver.get("weather", "clear")
    fatigue = driver.get("fatigue", 0)
    traffic_level = ROUTES.get(route, {}).get("traffic_level", "low")

    if speed > 90:
        speed_status = "high_risk"
    elif speed > 70:
        speed_status = "overspeed"
    elif speed == 0:
        speed_status = "idle"
    else:
        speed_status = "normal"

    return {
        # speed
        "is_high_risk": speed_status == "high_risk",
        "is_overspeed": speed_status == "overspeed",
        "is_idle": speed_status == "idle",

        # fuel & temperature
        "low_fuel": driver.get("fuel", 100) < 20,
        "high_temp": driver.get("temperature", 0) > 90,

        # route/traffic level
        "high_traffic": traffic_level == "high",

        # weather
        "raining": weather == "rain",
        "foggy": weather == "fog",

        # fatigue
        "is_fatigued": fatigue > 70,
    }


# Decision Engine
def evaluate_driver(driver):
    features = extract_features(driver)
    alerts = []
    score = 100

    # speed
    if features["is_overspeed"]:
        alerts.append("Overspeed detected")
        score -= 20
    if features["is_high_risk"]:
        alerts.append("High-risk driving")
        score -= 15
    if features["is_idle"]:
        alerts.append("Vehicle idle")
        score -= 5

    # fuel and temperature
    if features["low_fuel"]:
        alerts.append("Low fuel")
        score -= 10
    if features["high_temp"]:
        alerts.append("Engine overheating")
        score -= 20

    # route
    if features["high_traffic"]:
        alerts.append("High traffic zone")
        score -= 10

    # weather
    if features["raining"]:
        alerts.append("Wet road conditions")
        score -= 10
    if features["foggy"]:
        alerts.append("Low visibility")
        score -= 10

    # fatigue
    if features["is_fatigued"]:
        alerts.append("Driver fatigue detected")
        score -= 25

    score = max(0, min(100, score))

    if score >= 80:
        status = "safe"
    elif score >= 50:
        status = "caution"
    else:
        status = "danger"

    return {
        "name": driver["name"],
        "location": driver["location"],
        "alerts": alerts,
        "score": score,
        "status": status,
        "timestamp": datetime.now().isoformat()
    }

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

# for manual testing without API
def run_cli():
    try:
        with open("input.json", "r") as f:
            driver = json.load(f)
    except FileNotFoundError:
        print("input.json not found. Create an input.json with driver data.")
        return 1

    result = evaluate_driver(driver)

    raw_entry = {**driver, "timestamp": result["timestamp"]}
    append_to_json(DRIVERS_PATH, raw_entry)
    append_to_json(RESULTS_PATH, result)

    print(f"Driver: {result['name']}")
    print(f"Score:  {result['score']} ({result['status']})")
    print(f"Alerts: {result['alerts'] if result['alerts'] else 'None'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(run_cli())
