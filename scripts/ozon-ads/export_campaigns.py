"""Экспорт рекламных кампаний Ozon Performance API: список кампаний + статистика за период.

Это ОТДЕЛЬНЫЙ API от Seller API (другие ключи, другая авторизация — OAuth2
client_credentials). Получить Client-Id/Client-Secret: performance.ozon.ru →
Настройки → API-доступ → создать. Записать в OZON_PERF_CLIENT_ID / OZON_PERF_CLIENT_SECRET.

Запуск:
    OZON_PERF_CLIENT_ID / OZON_PERF_CLIENT_SECRET — как выше (переменные окружения или .env)
    STATS_YEAR / STATS_MONTH — период для статистики (по умолчанию — предыдущий месяц)

    python export_campaigns.py

Результат — campaigns.csv (список кампаний) рядом со скриптом. Статистика по кампаниям
запрашивается асинхронно (Ozon формирует отчёт в фоне) — скрипт ждёт его готовности и,
если получает CSV, сохраняет как campaign_stats.csv; если формат отличается от ожидаемого,
сохраняет сырой ответ как campaign_stats.raw и печатает его Content-Type в лог — так я смогу
разобрать формат по логу запуска и поправить разбор в следующей версии, не трогая ваш кабинет.
"""

from __future__ import annotations

import csv
import json
import os
import sys
import time
from datetime import date
from pathlib import Path

from _common import call, call_json, require_credentials


def default_period() -> tuple[int, int]:
    today = date.today()
    year, month = today.year, today.month - 1
    if month == 0:
        year, month = year - 1, 12
    return year, month


def date_range(year: int, month: int) -> tuple[str, str]:
    import calendar

    last_day = calendar.monthrange(year, month)[1]
    return f"{year:04d}-{month:02d}-01", f"{year:04d}-{month:02d}-{last_day:02d}"


def get_campaigns() -> list[dict]:
    data = call_json("GET", "/api/client/campaign")
    return data.get("list", [])


def request_stats_report(campaign_ids: list[str], date_from: str, date_to: str) -> str:
    data = call_json(
        "POST",
        "/api/client/statistics/json",
        json={"campaigns": campaign_ids, "dateFrom": date_from, "dateTo": date_to, "groupBy": "DATE"},
    )
    uuid = data.get("UUID") or data.get("uuid")
    if not uuid:
        raise RuntimeError(f"Не получили UUID отчёта: {data}")
    return uuid


def wait_for_report(uuid: str, timeout_s: int = 90):
    deadline = time.time() + timeout_s
    while time.time() < deadline:
        resp = call("GET", f"/api/client/statistics/{uuid}")
        try:
            status = resp.json()
        except ValueError:
            return resp  # уже похоже на файл, а не статус
        state = status.get("state", "")
        print(f"  статус отчёта: {state}", file=sys.stderr)
        if state == "OK":
            return call("GET", f"/api/client/statistics/report?UUID={uuid}")
        if state == "FAILED":
            raise RuntimeError(f"Отчёт не сформировался: {status}")
        time.sleep(5)
    raise RuntimeError("Не дождались готовности отчёта за отведённое время")


def main() -> None:
    require_credentials()

    print("Получаю список кампаний…", file=sys.stderr)
    campaigns = get_campaigns()
    campaigns_path = Path(__file__).parent / "campaigns.csv"
    with campaigns_path.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f, delimiter=";")
        writer.writerow(["id", "title", "state", "advObjectType", "budget", "dailyBudget", "fromDate", "toDate"])
        for c in campaigns:
            writer.writerow(
                [
                    c.get("id", ""),
                    c.get("title", ""),
                    c.get("state", ""),
                    c.get("advObjectType", ""),
                    c.get("budget", ""),
                    c.get("dailyBudget", ""),
                    c.get("fromDate", ""),
                    c.get("toDate", ""),
                ]
            )
    print(f"Готово: {campaigns_path}", file=sys.stderr)

    by_state: dict[str, int] = {}
    for c in campaigns:
        by_state[c.get("state", "?")] = by_state.get(c.get("state", "?"), 0) + 1
    print("\n=== Сводка по кампаниям ===", file=sys.stderr)
    print(f"Всего кампаний: {len(campaigns)}", file=sys.stderr)
    for state, count in by_state.items():
        print(f"  {state}: {count}", file=sys.stderr)

    if not campaigns:
        print("Кампаний нет — статистику не запрашиваю.", file=sys.stderr)
        return

    default_year, default_month = default_period()
    year = int(os.environ.get("STATS_YEAR", default_year))
    month = int(os.environ.get("STATS_MONTH", default_month))
    date_from, date_to = date_range(year, month)
    print(f"\nЗапрашиваю статистику за {date_from} — {date_to}…", file=sys.stderr)

    campaign_ids = [str(c["id"]) for c in campaigns]
    try:
        uuid = request_stats_report(campaign_ids, date_from, date_to)
        print(f"  UUID отчёта: {uuid}", file=sys.stderr)
        resp = wait_for_report(uuid)
        content_type = resp.headers.get("Content-Type", "")
        print(f"  получен ответ, Content-Type: {content_type}, размер: {len(resp.content)} байт", file=sys.stderr)
        if "csv" in content_type or "text" in content_type:
            out_path = Path(__file__).parent / "campaign_stats.csv"
            out_path.write_bytes(resp.content)
        else:
            out_path = Path(__file__).parent / "campaign_stats.raw"
            out_path.write_bytes(resp.content)
        print(f"Готово: {out_path}", file=sys.stderr)
    except RuntimeError as e:
        print(f"  статистику получить не удалось: {e}", file=sys.stderr)


if __name__ == "__main__":
    main()
