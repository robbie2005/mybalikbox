import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PostgrestError } from '@supabase/supabase-js';

import {
  ACTIVE_BOX_BUDGET_USD_KEY,
  ACTIVE_BOX_CODE_KEY,
  ACTIVE_BOX_ID_KEY,
  ACTIVE_BOX_TITLE_KEY,
  ACTIVE_BOX_WEIGHT_KG_KEY,
  HAS_USER_BOX_KEY,
} from '@/constants/first-launch';
import { markUserBoxSetupComplete } from '@/services/user-box-setup';
import { supabase } from '@/services/supabase';

export type PrimaryBox = {
  boxId: string;
  title: string;
  joinCode: string | null;
};

function mapPg(error: PostgrestError): Error {
  return new Error([error.message, error.details, error.hint].filter(Boolean).join('\n'));
}

function parsePrimaryRow(row: unknown): PrimaryBox | null {
  if (!row || typeof row !== 'object') return null;
  const boxId = String((row as { box_id: string }).box_id ?? '');
  if (!boxId) return null;
  const title = String((row as { title: string }).title ?? '').trim() || 'Balikbayan Box';
  const rawCode = (row as { join_code: string | null }).join_code;
  const joinCode = typeof rawCode === 'string' && rawCode.trim() ? rawCode.trim() : null;
  return { boxId, title, joinCode };
}

/** Primary box via RPC (preferred) or direct queries (fallback). */
export async function resolvePrimaryBoxForUser(userId: string): Promise<PrimaryBox | null> {
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_primary_box');

  if (!rpcError) {
    const row = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    const parsed = parsePrimaryRow(row);
    if (parsed) return parsed;
  } else {
    const msg = (rpcError.message ?? '').toLowerCase();
    if (!msg.includes('get_user_primary_box') && rpcError.code !== 'PGRST202') {
      console.warn('get_user_primary_box RPC failed, using fallback', rpcError);
    }
  }

  const { data: membership, error: memberErr } = await supabase
    .from('box_members')
    .select('box_id')
    .eq('user_id', userId)
    .in('role', ['builder', 'contributor'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (memberErr) throw mapPg(memberErr);

  if (membership?.box_id) {
    const { data: box, error: boxErr } = await supabase
      .from('boxes')
      .select('id, title, join_code')
      .eq('id', membership.box_id)
      .maybeSingle();
    if (boxErr) throw mapPg(boxErr);
    if (box?.id) {
      return {
        boxId: box.id,
        title: box.title?.trim() || 'Balikbayan Box',
        joinCode: typeof box.join_code === 'string' ? box.join_code.trim() || null : null,
      };
    }
  }

  const { data: ownedBox, error: ownedErr } = await supabase
    .from('boxes')
    .select('id, title, join_code')
    .eq('owner_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (ownedErr) throw mapPg(ownedErr);
  if (!ownedBox?.id) return null;

  return {
    boxId: ownedBox.id,
    title: ownedBox.title?.trim() || 'Balikbayan Box',
    joinCode: typeof ownedBox.join_code === 'string' ? ownedBox.join_code.trim() || null : null,
  };
}

/** True when the user owns, built, or joined any active box. */
export async function userHasBoxMembership(userId: string): Promise<boolean> {
  const primary = await resolvePrimaryBoxForUser(userId);
  return primary !== null;
}

/** Restore local active-box keys from Supabase after sign-in on a new device. */
export async function syncActiveBoxFromServer(userId: string): Promise<void> {
  const primary = await resolvePrimaryBoxForUser(userId);
  if (!primary) return;
  await setActiveBoxContext({
    boxId: primary.boxId,
    title: primary.title,
    joinCode: primary.joinCode,
  });
}

export async function getStoredActiveBoxId(): Promise<string | null> {
  const id = await AsyncStorage.getItem(ACTIVE_BOX_ID_KEY);
  return id?.trim() || null;
}

/** Persist the box the user is working in and show the home widget. */
export async function setActiveBoxContext(params: {
  boxId: string;
  title: string;
  joinCode?: string | null;
}): Promise<void> {
  const pairs: [string, string][] = [
    [ACTIVE_BOX_ID_KEY, params.boxId],
    [ACTIVE_BOX_TITLE_KEY, params.title.trim() || 'Balikbayan Box'],
  ];
  const code = params.joinCode?.trim();
  if (code) {
    pairs.push([ACTIVE_BOX_CODE_KEY, code]);
  }
  await AsyncStorage.multiSet(pairs);
  await markUserBoxSetupComplete();
}

export async function clearActiveBoxStorage(): Promise<void> {
  await AsyncStorage.multiRemove([
    HAS_USER_BOX_KEY,
    ACTIVE_BOX_ID_KEY,
    ACTIVE_BOX_TITLE_KEY,
    ACTIVE_BOX_CODE_KEY,
    ACTIVE_BOX_BUDGET_USD_KEY,
    ACTIVE_BOX_WEIGHT_KG_KEY,
  ]);
}
