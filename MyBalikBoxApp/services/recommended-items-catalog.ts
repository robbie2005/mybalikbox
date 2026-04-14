import type { PostgrestError } from '@supabase/supabase-js';

import { supabase } from '@/services/supabase';

function throwFromPostgrest(error: PostgrestError): never {
  const parts = [
    error.message,
    error.details ? `Details: ${error.details}` : '',
    error.hint ? `Hint: ${error.hint}` : '',
    error.code ? `Code: ${error.code}` : '',
  ].filter(Boolean);
  throw new Error(parts.join('\n'));
}

/** Row shape from `public.recommended_items` */
export type RecommendedCatalogItem = {
  id: string;
  slug: string;
  name: string;
  category: string;
  reference_price: number;
  image_url: string | null;
  amazon_url: string | null;
  asin: string | null;
  sort_order: number;
};

function mapRow(row: Record<string, unknown>): RecommendedCatalogItem {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    category: String(row.category),
    reference_price: typeof row.reference_price === 'number' ? row.reference_price : Number(row.reference_price),
    image_url: row.image_url == null ? null : String(row.image_url),
    amazon_url: row.amazon_url == null ? null : String(row.amazon_url),
    asin: row.asin == null ? null : String(row.asin),
    sort_order: typeof row.sort_order === 'number' ? row.sort_order : Number(row.sort_order),
  };
}

export async function fetchRecommendedItems(): Promise<RecommendedCatalogItem[]> {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. Add them to .env and restart Expo (try: npx expo start -c).',
    );
  }

  // RLS policy already restricts to is_active = true; avoid .eq here so older schemas without the column still get a clearer DB error.
  const { data, error } = await supabase
    .from('recommended_items')
    .select('id, slug, name, category, reference_price, image_url, amazon_url, asin, sort_order')
    .order('sort_order', { ascending: true });

  if (error) {
    throwFromPostgrest(error);
  }

  const rows = (data ?? []) as Record<string, unknown>[];
  return rows.map(mapRow);
}
