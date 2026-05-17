/** Estimated weight per unit when checklist row `weight_kg` is unset (stored + display). */
export const DEFAULT_ITEM_WEIGHT_KG_PER_UNIT = 1;

/** Total kg on the line (`per-unit × quantity`), using defaults when unset. */
export function lineWeightTotalKg(row: {
  weight_kg: number | null | undefined;
  quantity?: number | null;
}): number {
  const q = Number(row.quantity ?? 1);
  const qty = Number.isFinite(q) && q >= 0 ? q : 1;
  const w = row.weight_kg;
  const perKg =
    w != null && Number.isFinite(Number(w)) ? Number(w) : DEFAULT_ITEM_WEIGHT_KG_PER_UNIT;
  return perKg * qty;
}
