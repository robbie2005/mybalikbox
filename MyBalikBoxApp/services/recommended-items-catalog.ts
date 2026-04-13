import { supabase } from '@/services/supabase';

/** Row shape from `public.recommended_items` */
export type RecommendedCatalogItem = {
  id: string;
  slug: string;
  name: string;
  category: string;
  reference_price: number;
  image_url: string | null;
  sort_order: number;
};

export async function fetchRecommendedItems(): Promise<RecommendedCatalogItem[]> {
  const { data, error } = await supabase
    .from('recommended_items')
    .select('id, slug, name, category, reference_price, image_url, sort_order')
    .order('sort_order', { ascending: true });

  if (error) throw error;

  return (data ?? []) as RecommendedCatalogItem[];
}
