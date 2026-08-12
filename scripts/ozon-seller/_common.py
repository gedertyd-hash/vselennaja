"""Общая обвязка для скриптов экспорта Ozon Seller API: авторизация, HTTP-вызовы с повтором при лимите запросов."""

from __future__ import annotations

import os
import sys
import time
from pathlib import Path

import requests

try:
    from dotenv import load_dotenv

    load_dotenv(Path(__file__).parent / ".env")
except ImportError:
    pass

API_BASE = "https://api-seller.ozon.ru"
CLIENT_ID = os.environ.get("OZON_CLIENT_ID", "")
API_KEY = os.environ.get("OZON_API_KEY", "")

session = requests.Session()
session.headers.update(
    {
        "Client-Id": CLIENT_ID,
        "Api-Key": API_KEY,
        "Content-Type": "application/json",
    }
)


def require_credentials() -> None:
    if not CLIENT_ID or not API_KEY:
        sys.exit("Не заданы OZON_CLIENT_ID / OZON_API_KEY (переменные окружения или .env)")


def call(path: str, payload: dict) -> dict:
    url = f"{API_BASE}{path}"
    for attempt in range(5):
        resp = session.post(url, json=payload, timeout=30)
        if resp.status_code == 429:
            wait = 2**attempt
            print(f"  лимит запросов, жду {wait} c…", file=sys.stderr)
            time.sleep(wait)
            continue
        if resp.status_code >= 400:
            raise RuntimeError(f"{path} -> {resp.status_code}: {resp.text[:500]}")
        return resp.json()
    raise RuntimeError(f"{path}: не удалось получить ответ после повторов")


def chunks(seq: list, size: int):
    for i in range(0, len(seq), size):
        yield seq[i : i + size]
