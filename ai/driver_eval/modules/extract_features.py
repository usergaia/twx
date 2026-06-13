ROUTES = {
    "routeA": {"traffic_level": "high"},
    "routeB": {"traffic_level": "medium"},
    "routeC": {"traffic_level": "low"},
}


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
