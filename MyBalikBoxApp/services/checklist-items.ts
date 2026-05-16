import type { RecommendedCatalogItem } from '@/services/recommended-items-catalog';
import { ensureProfileRow } from '@/services/profiles';
import { supabase } from '@/services/supabase';

/**
 * Pin a box when you cannot infer it from membership yet.
 * Set `EXPO_PUBLIC_ACTIVE_BOX_ID` in `.env` to your `boxes.id` UUID.
 */
function getPinnedBoxId(): string | null {
  const id = process.env.EXPO_PUBLIC_ACTIVE_BOX_ID;
  return id && id.length > 0 ? id : null;
}

export async function resolveActiveBoxId(): Promise<string | null> {
  const pinned = getPinnedBoxId();
  if (pinned) return pinned;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('box_members')
    .select('box_id')
    .eq('user_id', user.id)
    .in('role', ['builder', 'contributor'])
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.box_id ?? null;
}

export type InsertChecklistSource = 'manual' | 'recommendation';

export async function insertChecklistItem(params: {
  boxId: string;
  name: string;
  source: InsertChecklistSource;
  category?: string | null;
  referencePrice?: number | null;
  recommendedItemId?: string | null;
  quantity?: number;
}): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Sign in to add items to your box.');
  }

  await ensureProfileRow(user);

  const row = {
    box_id: params.boxId,
    name: params.name.trim(),
    quantity: params.quantity ?? 1,
    source: params.source,
    added_by: user.id,
    category: params.category ?? null,
    reference_price: params.referencePrice ?? null,
    recommended_item_id: params.recommendedItemId ?? null,
  };

  const { data, error } = await supabase.from('box_checklist_items').insert(row).select('id').single();
  if (error) throw error;
  if (!data?.id) throw new Error('Insert did not return an id.');
  return data.id;
}

export async function addRecommendedItemToBox(item: RecommendedCatalogItem, boxId: string): Promise<void> {
  await insertChecklistItem({
    boxId,
    name: item.name,
    source: 'recommendation',
    category: item.category,
    referencePrice: item.reference_price,
    recommendedItemId: item.id,
  });
}

export async function addCustomItemToBox(
  boxId: string,
  params: { name: string; referencePriceUsd: number | null; quantity: number },
): Promise<string> {
  return insertChecklistItem({
    boxId,
    name: params.name,
    source: 'manual',
    category: 'Personal Items',
    referencePrice: params.referencePriceUsd,
    quantity: params.quantity,
  });
}

export async function deleteChecklistItemById(id: string): Promise<void> {
  const { error } = await supabase.from('box_checklist_items').delete().eq('id', id);
  if (error) throw error;
}
