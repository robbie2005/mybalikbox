import type { PostgrestError } from '@supabase/supabase-js';

import { getStoredActiveBoxId } from '@/services/active-box';
import { notifyChecklistChanged } from '@/services/checklist-events';
import type { RecommendedCatalogItem } from '@/services/recommended-items-catalog';
import { supabase } from '@/services/supabase';

/**
 * Pin a box when you cannot infer it from membership yet.
 * Set `EXPO_PUBLIC_ACTIVE_BOX_ID` in `.env` to your `boxes.id` UUID.
 */
function getPinnedBoxId(): string | null {
  const id = process.env.EXPO_PUBLIC_ACTIVE_BOX_ID;
  return id && id.length > 0 ? id : null;
}

function mapPg(error: PostgrestError): Error {
  return new Error([error.message, error.details, error.hint].filter(Boolean).join('\n'));
}

async function ensureProfileRow(userId: string): Promise<void> {
  const { error } = await supabase.from('profiles').upsert({ id: userId }, { onConflict: 'id' });
  if (error) throw mapPg(error);
}

async function membershipBoxId(userId: string, boxId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('box_members')
    .select('box_id')
    .eq('user_id', userId)
    .eq('box_id', boxId)
    .in('role', ['builder', 'contributor'])
    .maybeSingle();
  if (error) throw mapPg(error);
  return !!data?.box_id;
}

export async function resolveActiveBoxId(): Promise<string | null> {
  const pinned = getPinnedBoxId();
  if (pinned) return pinned;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const storedId = await getStoredActiveBoxId();
  if (storedId && (await membershipBoxId(user.id, storedId))) {
    return storedId;
  }

  const { data: membership, error: memberError } = await supabase
    .from('box_members')
    .select('box_id')
    .eq('user_id', user.id)
    .in('role', ['builder', 'contributor'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (memberError) throw mapPg(memberError);
  if (membership?.box_id) return membership.box_id;

  const { data: owned, error: ownedError } = await supabase
    .from('boxes')
    .select('id')
    .eq('owner_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (ownedError) throw mapPg(ownedError);
  return owned?.id ?? null;
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

  await ensureProfileRow(user.id);

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
  if (error) throw mapPg(error);
  if (!data?.id) throw new Error('Insert did not return an id.');
  notifyChecklistChanged();
  return data.id;
}

export async function addRecommendedItemToBox(item: RecommendedCatalogItem, boxId: string): Promise<string> {
  return insertChecklistItem({
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
  params: { name: string; referencePriceUsd: number | null; quantity: number; category?: string | null },
): Promise<string> {
  return insertChecklistItem({
    boxId,
    name: params.name,
    source: 'manual',
    category: params.category?.trim() ? params.category.trim() : null,
    referencePrice: params.referencePriceUsd,
    quantity: params.quantity,
  });
}

export async function deleteChecklistItemById(id: string): Promise<void> {
  const { error } = await supabase.from('box_checklist_items').delete().eq('id', id);
  if (error) throw mapPg(error);
  notifyChecklistChanged();
}

/** Accept a pending request → included (purchased). */
export async function acceptChecklistItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('box_checklist_items')
    .update({ status: 'purchased' })
    .eq('id', id);
  if (error) throw mapPg(error);
  notifyChecklistChanged();
}

/** Decline a pending request → removed from active checklist. */
export async function declineChecklistItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('box_checklist_items')
    .update({ status: 'removed' })
    .eq('id', id);
  if (error) throw mapPg(error);
  notifyChecklistChanged();
}
