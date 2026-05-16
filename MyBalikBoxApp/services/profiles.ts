import type { User } from '@supabase/supabase-js';

import { supabase } from '@/services/supabase';

export type ProfileSummary = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
};

function deriveDisplayName(user: Pick<User, 'email' | 'user_metadata'>): string {
  const meta = user.user_metadata ?? {};
  const raw =
    meta.display_name ??
    meta.full_name ??
    meta.name ??
    meta.username ??
    (typeof user.email === 'string' ? user.email.split('@')[0] : null) ??
    'User';

  return String(raw).trim() || 'User';
}

function deriveAvatarUrl(user: Pick<User, 'user_metadata'>): string | null {
  const meta = user.user_metadata ?? {};
  const raw = meta.avatar_url ?? meta.picture ?? meta.photo_url ?? null;
  return raw == null ? null : String(raw);
}

export async function ensureProfileRow(user: Pick<User, 'id' | 'email' | 'user_metadata'>): Promise<ProfileSummary> {
  const seedDisplayName = deriveDisplayName(user);
  const seedAvatarUrl = deriveAvatarUrl(user);

  const row: { id: string; display_name?: string; avatar_url?: string } = { id: user.id };
  if (seedDisplayName) row.display_name = seedDisplayName;
  if (seedAvatarUrl) row.avatar_url = seedAvatarUrl;

  const { error: upsertError } = await supabase.from('profiles').upsert(row, { onConflict: 'id' });
  if (upsertError) throw upsertError;

  const { data, error } = await supabase
    .from('profiles')
    .select('display_name, avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;

  return {
    id: user.id,
    displayName: data?.display_name?.trim() || seedDisplayName,
    avatarUrl: data?.avatar_url ?? seedAvatarUrl,
  };
}

export async function fetchCurrentProfileSummary(): Promise<ProfileSummary> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Sign in to continue.');
  }

  return ensureProfileRow(user);
}
