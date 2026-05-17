import { isMissingUsernameColumnError } from '@/services/profile-columns';
import { DEFAULT_BIO, DEFAULT_LOCATION } from '@/services/profile';
import { supabase } from '@/services/supabase';

type SupabaseLikeError = { message?: unknown; code?: unknown; details?: unknown; hint?: unknown };

function formatServiceError(step: string, error: unknown): Error {
  if (error instanceof Error) {
    return new Error(`[${step}] ${error.message}`);
  }

  if (error && typeof error === 'object') {
    const maybe = error as { message?: unknown; code?: unknown; details?: unknown; hint?: unknown };
    const message = typeof maybe.message === 'string' ? maybe.message : 'Unknown service error';
    const code = typeof maybe.code === 'string' ? ` code=${maybe.code}` : '';
    const details = typeof maybe.details === 'string' ? ` details=${maybe.details}` : '';
    const hint = typeof maybe.hint === 'string' ? ` hint=${maybe.hint}` : '';
    return new Error(`[${step}] ${message}${code}${details}${hint}`);
  }

  return new Error(`[${step}] Unknown service error`);
}

function normalizeUsername(value: string | null | undefined): string | null {
  const trimmed = value?.trim().toLowerCase() ?? '';
  if (!trimmed) return null;
  return trimmed.replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || null;
}

type ExistingProfile = {
  id: string;
  username?: string | null;
  display_name?: string | null;
};

async function fetchExistingProfile(userId: string): Promise<ExistingProfile | null> {
  const full = await supabase.from('profiles').select('id, username, display_name').eq('id', userId).maybeSingle();
  if (!full.error) return full.data as ExistingProfile | null;

  if (isMissingUsernameColumnError(full.error)) {
    const legacy = await supabase.from('profiles').select('id, display_name').eq('id', userId).maybeSingle();
    if (legacy.error) throw formatServiceError('bootstrap:profiles_select', legacy.error);
    return legacy.data as ExistingProfile | null;
  }

  throw formatServiceError('bootstrap:profiles_select', full.error);
}

/** Ensures profile row only. Boxes are created via create-box / join flows. */
export async function ensureUserBootstrap(params: {
  userId: string;
  username?: string | null;
  displayName?: string | null;
}): Promise<void> {
  const { userId } = params;
  const normalizedUsername = normalizeUsername(params.username ?? params.displayName);
  const normalizedName = params.displayName?.trim() || normalizedUsername || null;

  const existing = await fetchExistingProfile(userId);

  if (!existing) {
    const baseRow = {
      id: userId,
      display_name: normalizedName,
      bio: DEFAULT_BIO,
      location: DEFAULT_LOCATION,
    };
    const withUsername = normalizedUsername ? { ...baseRow, username: normalizedUsername } : baseRow;

    const { error: insertError } = await supabase.from('profiles').insert(withUsername);
    if (insertError && isMissingUsernameColumnError(insertError)) {
      const { error: legacyInsertError } = await supabase.from('profiles').insert(baseRow);
      if (legacyInsertError) throw formatServiceError('bootstrap:profiles_insert', legacyInsertError);
      return;
    }
    if (insertError) throw formatServiceError('bootstrap:profiles_insert', insertError);
    return;
  }

  const patch: Record<string, string> = {};
  if (normalizedUsername && !existing.username?.trim()) {
    patch.username = normalizedUsername;
  }
  if (normalizedName && !existing.display_name?.trim()) {
    patch.display_name = normalizedName;
  }

  if (Object.keys(patch).length === 0) return;

  const { error: updateError } = await supabase.from('profiles').update(patch).eq('id', userId);
  if (updateError && isMissingUsernameColumnError(updateError) && patch.username) {
    const { username: _removed, ...legacyPatch } = patch;
    if (Object.keys(legacyPatch).length === 0) return;
    const { error: legacyUpdateError } = await supabase.from('profiles').update(legacyPatch).eq('id', userId);
    if (legacyUpdateError) throw formatServiceError('bootstrap:profiles_update', legacyUpdateError);
    return;
  }
  if (updateError) throw formatServiceError('bootstrap:profiles_update', updateError);
}
