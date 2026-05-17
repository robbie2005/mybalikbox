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

/** Ensures profile row only. Boxes are created via create-box / join flows. */
export async function ensureUserBootstrap(params: { userId: string; displayName?: string | null }): Promise<void> {
  const { userId, displayName } = params;
  const normalizedName = displayName?.trim() || null;

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ id: userId, display_name: normalizedName }, { onConflict: 'id' });
  if (profileError) throw formatServiceError('bootstrap:profiles_upsert', profileError);
}
