#!/usr/bin/env python3
"""Example sender for the Raspberry Pi side.

Sends a JSON payload to the deployed Next.js app's /api/data endpoint
every few seconds. Replace the `read_sensor()` body with your actual
sensor/hardware reading logic.

Install dependency:
    pip install requests

Run:
    SERVER_URL="https://your-app.vercel.app/api/data" \
    API_KEY="your-shared-secret" \
    python3 send_data.py
"""

import os
import time
import requests

SERVER_URL = os.environ.get("SERVER_URL", "http://localhost:3000/api/data")
API_KEY = os.environ.get("API_KEY", "")
SEND_INTERVAL_SECONDS = 3


def read_sensor():
    """Replace this with real sensor reads."""
    return {
        "temperature_c": 21.5,
        "humidity_pct": 44,
    }


def main():
    headers = {"Content-Type": "application/json"}
    if API_KEY:
        headers["x-api-key"] = API_KEY

    while True:
        payload = read_sensor()
        try:
            resp = requests.post(SERVER_URL, json=payload, headers=headers, timeout=10)
            print(f"Sent {payload} -> {resp.status_code} {resp.text}")
        except requests.RequestException as exc:
            print(f"Failed to send data: {exc}")

        time.sleep(SEND_INTERVAL_SECONDS)


if __name__ == "__main__":
    main()
