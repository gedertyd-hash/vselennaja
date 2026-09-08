export const MARKETPLACES = [
  { code: "wb", label: "🤍 Wildberries" },
  { code: "ozon", label: "🤍 Ozon" },
  { code: "ym", label: "🤍 Яндекс Маркет" },
  { code: "other", label: "Другой вариант" },
] as const;

// "other" не даёт готовую метку — пользователь вводит текст сам,
// он и попадает в поле marketplace вместо кода.
export const CUSTOM_MARKETPLACE_CODE = "other";

export type MarketplaceCode = (typeof MARKETPLACES)[number]["code"];

const LABEL_BY_CODE = new Map<string, string>(MARKETPLACES.map((m) => [m.code, m.label]));

export function marketplaceLabel(code: string | null): string {
  if (!code) return "(не указано)";
  return LABEL_BY_CODE.get(code) ?? code;
}
