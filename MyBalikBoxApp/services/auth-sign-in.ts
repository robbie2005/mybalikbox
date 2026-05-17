import { supabase } from '@/services/supabase';

/** Same normalization as sign-up / profile bootstrap for username lookup. */
function normalizeUsernameLookup(value: string): string {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return '';
  return trimmed.replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

/**
 * Returns the email to pass to `signInWithPassword`.
 * Accepts a full email or a profile username.
 */
export async function resolveEmailForSignIn(identifier: string): Promise<string | null> {
  const trimmed = identifier.trim();
  if (!trimmed) return null;

  const loginIdentifier = trimmed.includes('@') ? trimmed.toLowerCase() : normalizeUsernameLookup(trimmed);
  if (!loginIdentifier) return null;

  const { data, error } = await supabase.rpc('resolve_login_email', {
    login_identifier: loginIdentifier,
  });

  if (error) {
    throw error;
  }

  if (typeof data !== 'string') return null;
  const email = data.trim().toLowerCase();
  return email.includes('@') ? email : null;
}
