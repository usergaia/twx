from datetime import datetime

from .extract_features import extract_features


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
