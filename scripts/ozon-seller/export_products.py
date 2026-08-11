"""Экспорт товаров продавца из Ozon Seller API в CSV.

Для каждого товара выгружает: наименование, описание, характеристики
(атрибуты карточки) и контент-рейтинг ("качество" заполнения карточки).

Запуск:
    pip install -r requirements.txt
    cp .env.example .env   # и вписать туда свои Client-Id и Api-Key
    python export_products.py

Ключ и Client-Id — в личном кабинете продавца: Настройки → Seller API →
создать API-ключ (нужны права как минимум "Товары и цены" на чтение).

Результат — products.csv рядом со скриптом.

Метод /v1/product/info/description отдаёт описание по одному товару за
раз, поэтому на каталоге в несколько тысяч SKU выгрузка займёт время —
это нормально, скрипт делает паузы между запросами, чтобы не упереться
в лимит запросов в минуту.

Если Ozon поменяет форму ответа какого-то метода (это случается) —
сверьтесь с актуальной документацией https://docs.ozon.ru/api/seller
и поправьте соответствующую функцию ниже.
"""

from __future__ import annotations

import csv
import json
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

LIST_PAGE_SIZE = 1000
INFO_BATCH = 100
RATING_BATCH = 200
REQUEST_PAUSE = 0.3

session = requests.Session()
session.headers.update(
    {
        "Client-Id": CLIENT_ID,
        "Api-Key": API_KEY,
        "Content-Type": "application/json",
    }
)


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


def get_all_products() -> list[dict]:
    items: list[dict] = []
    last_id = ""
    while True:
        data = call(
            "/v3/product/list",
            {"filter": {"visibility": "ALL"}, "last_id": last_id, "limit": LIST_PAGE_SIZE},
        )
        result = data.get("result", {})
        batch = result.get("items", [])
        items.extend(batch)
        print(f"  найдено товаров: {len(items)}", file=sys.stderr)
        last_id = result.get("last_id", "")
        if not last_id or not batch:
            break
    return items


def get_product_info(product_ids: list[int]) -> dict[int, dict]:
    info: dict[int, dict] = {}
    for batch in chunks(product_ids, INFO_BATCH):
        data = call("/v3/product/info/list", {"product_id": batch})
        items = data.get("items") or data.get("result", {}).get("items", [])
        for item in items:
            info[item["id"]] = item
    return info


def get_description(product_id: int) -> str:
    data = call("/v1/product/info/description", {"product_id": product_id})
    return data.get("result", {}).get("description", "")


def get_attributes(product_ids: list[int]) -> dict[int, list[dict]]:
    attrs: dict[int, list[dict]] = {}
    for batch in chunks(product_ids, INFO_BATCH):
        data = call(
            "/v4/product/info/attributes",
            {
                "filter": {"product_id": [str(pid) for pid in batch], "visibility": "ALL"},
                "limit": INFO_BATCH,
            },
        )
        for item in data.get("result", []):
            attrs[item["id"]] = item.get("attributes", [])
    return attrs


def get_content_rating(skus: list[int]) -> dict[int, dict]:
    rating: dict[int, dict] = {}
    unique_skus = sorted({s for s in skus if s})
    for batch in chunks(unique_skus, RATING_BATCH):
        data = call("/v1/product/rating-by-sku", {"skus": batch})
        for item in data.get("products", []):
            rating[item["sku"]] = item
    return rating


def sku_of(item: dict) -> int | None:
    sources = item.get("sources") or []
    return sources[0].get("sku") if sources else None


def main() -> None:
    if not CLIENT_ID or not API_KEY:
        sys.exit("Не заданы OZON_CLIENT_ID / OZON_API_KEY (переменные окружения или .env)")

    print("Получаю список товаров…", file=sys.stderr)
    listed = get_all_products()
    product_ids = [p["product_id"] for p in listed]
    if not product_ids:
        sys.exit("Товары не найдены — проверьте ключ и права доступа")

    print("Получаю карточки товаров…", file=sys.stderr)
    info = get_product_info(product_ids)

    print("Получаю характеристики…", file=sys.stderr)
    attributes = get_attributes(product_ids)

    print("Получаю контент-рейтинг…", file=sys.stderr)
    skus = [sku_of(item) for item in info.values()]
    ratings = get_content_rating(skus)

    print("Получаю описания (по одному товару за раз)…", file=sys.stderr)
    out_path = Path(__file__).parent / "products.csv"
    with out_path.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f, delimiter=";")
        writer.writerow(
            ["product_id", "offer_id", "name", "sku", "description", "characteristics", "content_rating"]
        )
        for n, pid in enumerate(product_ids, 1):
            item = info.get(pid, {})
            sku = sku_of(item)
            try:
                description = get_description(pid)
            except RuntimeError as e:
                print(f"  описание для {pid} не получено: {e}", file=sys.stderr)
                description = ""
            attrs_str = json.dumps(attributes.get(pid, []), ensure_ascii=False)
            rating = ratings.get(sku, {}).get("rating", "") if sku else ""
            writer.writerow([pid, item.get("offer_id", ""), item.get("name", ""), sku, description, attrs_str, rating])
            if n % 20 == 0:
                print(f"  обработано {n}/{len(product_ids)}", file=sys.stderr)
            time.sleep(REQUEST_PAUSE)

    print(f"Готово: {out_path}")


if __name__ == "__main__":
    main()
