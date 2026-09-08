export const MARKETPLACES = [
  { code: "wb", label: "Wildberries" },
  { code: "ozon", label: "Ozon" },
  { code: "ym", label: "Яндекс Маркет" },
] as const;

export type MarketplaceCode = (typeof MARKETPLACES)[number]["code"];

const LABEL_BY_CODE = new Map<string, string>(MARKETPLACES.map((m) => [m.code, m.label]));

export function marketplaceLabel(code: string | null): string {
  if (!code) return "(не указано)";
  return LABEL_BY_CODE.get(code) ?? code;
}
