/**
 * Shared ordering for grouping checklist items by category (matches Shared Checklist).
 */
export const PRIORITY_CATEGORIES: string[] = [
  'Clothing, Shoes & Jewelry',
  'Computers & Accessories',
  'Health & Household',
  'Home & Kitchen',
];

export function orderCategories(categories: string[]): string[] {
  const seen = new Set(categories);
  const ordered = PRIORITY_CATEGORIES.filter((c) => seen.has(c));
  const rest = categories.filter((c) => !PRIORITY_CATEGORIES.includes(c)).sort();
  return [...ordered, ...rest];
}

export function groupRowsByCategory<T extends { category: string | null }>(
  rows: T[],
): Array<{ category: string; items: T[] }> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const category = row.category?.trim() || 'Uncategorized';
    const list = map.get(category) ?? [];
    list.push(row);
    map.set(category, list);
  }
  return orderCategories([...map.keys()]).map((category) => ({
    category,
    items: map.get(category) ?? [],
  }));
}
