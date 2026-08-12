"""Аналитика по кабинету Ozon за месяц: трафик/конверсия по SKU и отчёт о реализации
(факт продаж, комиссии, логистика) — сырьё для юнит-экономики и выводов.

Запуск:
    OZON_CLIENT_ID / OZON_API_KEY — как в export_products.py
    ANALYTICS_YEAR / ANALYTICS_MONTH — год и месяц отчёта (по умолчанию — предыдущий
    календарный месяц); для июля 2026 это ANALYTICS_YEAR=2026 ANALYTICS_MONTH=7

    python export_analytics.py

Результат — analytics_traffic.csv (просмотры/добавления в корзину/конверсия/заказы
по SKU) и analytics_realization.json (сырой отчёт о реализации — там вложенная
структура, разбирать построчно смысла нет, но по нему считаются фактическая выручка,
удержанные комиссии и логистика) рядом со скриптом.

Метод /v1/analytics/data по некоторым метрикам и глубине истории ограничен
тарифом продавца (Premium/Premium Plus) — если часть метрик возвращается пустой
или запрос падает с ошибкой доступа, это тарифное ограничение, а не баг скрипта.
"""

from __future__ import annotations

import calendar
import csv
import json
import os
import sys
from datetime import date
from pathlib import Path

from _common import call, require_credentials

METRICS = [
    "revenue",
    "ordered_units",
    "hits_view",
    "hits_tocart",
    "conv_tocart",
    "returns",
    "cancellations",
]


def default_period() -> tuple[int, int]:
    today = date.today()
    year, month = today.year, today.month - 1
    if month == 0:
        year, month = year - 1, 12
    return year, month


def date_range(year: int, month: int) -> tuple[str, str]:
    last_day = calendar.monthrange(year, month)[1]
    return f"{year:04d}-{month:02d}-01", f"{year:04d}-{month:02d}-{last_day:02d}"


def get_traffic(date_from: str, date_to: str) -> list[dict]:
    rows: list[dict] = []
    offset = 0
    limit = 1000
    while True:
        data = call(
            "/v1/analytics/data",
            {
                "date_from": date_from,
                "date_to": date_to,
                "metrics": METRICS,
                "dimension": ["sku"],
                "limit": limit,
                "offset": offset,
            },
        )
        batch = data.get("result", {}).get("data", [])
        rows.extend(batch)
        if len(batch) < limit:
            break
        offset += limit
    return rows


def get_realization(year: int, month: int) -> dict:
    return call("/v1/finance/realization", {"year": year, "month": month})


def main() -> None:
    require_credentials()

    default_year, default_month = default_period()
    year = int(os.environ.get("ANALYTICS_YEAR", default_year))
    month = int(os.environ.get("ANALYTICS_MONTH", default_month))
    date_from, date_to = date_range(year, month)
    print(f"Период: {date_from} — {date_to}", file=sys.stderr)

    print("Получаю трафик и конверсию по SKU…", file=sys.stderr)
    traffic = get_traffic(date_from, date_to)
    traffic_path = Path(__file__).parent / "analytics_traffic.csv"
    with traffic_path.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f, delimiter=";")
        writer.writerow(["sku", *METRICS])
        for row in traffic:
            dims = row.get("dimensions") or []
            sku = dims[0].get("id") if dims else ""
            writer.writerow([sku, *row.get("metrics", [])])
    print(f"Готово: {traffic_path}", file=sys.stderr)

    print("Получаю отчёт о реализации…", file=sys.stderr)
    try:
        realization = get_realization(year, month)
    except RuntimeError as e:
        print(f"  отчёт о реализации недоступен: {e}", file=sys.stderr)
        realization = {}
    realization_path = Path(__file__).parent / "analytics_realization.json"
    realization_path.write_text(json.dumps(realization, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Готово: {realization_path}", file=sys.stderr)


if __name__ == "__main__":
    main()
