"""Общая обвязка для скриптов Ozon Performance API (реклама) — отдельная авторизация
(OAuth2 client_credentials), отдельный хост от Seller API."""

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

API_BASE = "https://performance.ozon.ru"
CLIENT_ID = os.environ.get("OZON_PERF_CLIENT_ID", "")
CLIENT_SECRET = os.environ.get("OZON_PERF_CLIENT_SECRET", "")

_token: str | None = None


def require_credentials() -> None:
    if not CLIENT_ID or not CLIENT_SECRET:
        sys.exit("Не заданы OZON_PERF_CLIENT_ID / OZON_PERF_CLIENT_SECRET (переменные окружения или .env)")


def _get_token() -> str:
    global _token
    if _token:
        return _token
    resp = requests.post(
        f"{API_BASE}/api/client/token",
        json={"client_id": CLIENT_ID, "client_secret": CLIENT_SECRET, "grant_type": "client_credentials"},
        timeout=30,
    )
    if resp.status_code >= 400:
        raise RuntimeError(f"/api/client/token -> {resp.status_code}: {resp.text[:500]}")
    _token = resp.json()["access_token"]
    return _token


def call(method: str, path: str, **kwargs) -> requests.Response:
    """Низкоуровневый вызов Performance API с Bearer-токеном и повтором при лимите запросов.
    Возвращает requests.Response (не .json()), т.к. некоторые методы отдают не-JSON (файлы отчётов)."""
    url = f"{API_BASE}{path}"
    for attempt in range(5):
        headers = kwargs.pop("headers", {})
        headers["Authorization"] = f"Bearer {_get_token()}"
        resp = requests.request(method, url, headers=headers, timeout=30, **kwargs)
        if resp.status_code == 429:
            wait = 2**attempt
            print(f"  лимит запросов, жду {wait} c…", file=sys.stderr)
            time.sleep(wait)
            continue
        if resp.status_code >= 400:
            raise RuntimeError(f"{path} -> {resp.status_code}: {resp.text[:500]}")
        return resp
    raise RuntimeError(f"{path}: не удалось получить ответ после повторов")


def call_json(method: str, path: str, **kwargs) -> dict:
    return call(method, path, **kwargs).json()
