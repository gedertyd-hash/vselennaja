#!/usr/bin/env python3
"""Read-only отчёт по кампаниям Яндекс.Директа через Reports API v5.

Только чтение статистики. Ставки, бюджет и настройки кампаний этот
скрипт не трогает — на изменения нужен отдельный явный запрос.

Использование:
    export YANDEX_DIRECT_TOKEN="..."   # см. tools/yandex-direct/README.md
    python3 report.py 2026-08-05 2026-08-07 [GOAL_ID]

GOAL_ID — id цели в Метрике (например telegram_click), опционален.
Без него отчёт покажет показы/клики/расход/CTR/среднюю цену клика.
С ним — дополнительно конверсии по цели.
"""

import json
import os
import sys
import time
import urllib.error
import urllib.request
from typing import Optional

API_URL = "https://api.direct.yandex.com/json/v5/reports"


def fetch_report(token: str, date_from: str, date_to: str, goal_id: Optional[str]) -> str:
    field_names = ["CampaignName", "Impressions", "Clicks", "Cost", "Ctr", "AvgCpc"]
    criteria = {"DateFrom": date_from, "DateTo": date_to}
    if goal_id:
        criteria["Goals"] = [str(goal_id)]
        field_names += ["Conversions", "ConversionRate", "CostPerConversion"]

    body = {
        "params": {
            "SelectionCriteria": criteria,
            "FieldNames": field_names,
            "ReportName": f"vm-report-{date_from}-{date_to}-{int(time.time())}",
            "ReportType": "CAMPAIGN_PERFORMANCE_REPORT",
            "DateRangeType": "CUSTOM_DATE",
            "Format": "TSV",
            "IncludeVAT": "YES",
        }
    }
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept-Language": "ru",
        "Content-Type": "application/json; charset=utf-8",
        "processingMode": "auto",
        "skipReportHeader": "true",
        "skipReportSummary": "true",
    }
    data = json.dumps(body).encode("utf-8")

    while True:
        req = urllib.request.Request(API_URL, data=data, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req) as resp:
                return resp.read().decode("utf-8")
        except urllib.error.HTTPError as e:
            if e.code in (201, 202):
                wait = int(e.headers.get("retryIn", "5"))
                print(f"Отчёт формируется на стороне Яндекса, жду {wait} с...", file=sys.stderr)
                time.sleep(wait)
                continue
            print(e.read().decode("utf-8"), file=sys.stderr)
            raise


def main() -> None:
    token = os.environ.get("YANDEX_DIRECT_TOKEN")
    if not token:
        sys.exit("Установите переменную окружения YANDEX_DIRECT_TOKEN (см. README.md)")

    if len(sys.argv) < 3:
        sys.exit("Использование: python3 report.py ДАТА_ОТ ДАТА_ДО [GOAL_ID]\n"
                  "Пример: python3 report.py 2026-08-05 2026-08-07 telegram_click")

    date_from, date_to = sys.argv[1], sys.argv[2]
    goal_id = sys.argv[3] if len(sys.argv) > 3 else None

    print(fetch_report(token, date_from, date_to, goal_id))


if __name__ == "__main__":
    main()
