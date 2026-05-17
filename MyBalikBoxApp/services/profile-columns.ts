export const PROFILE_SELECT_FULL =
  'id, username, display_name, avatar_url, bio, location' as const;

export const PROFILE_SELECT_LEGACY = 'id, display_name, avatar_url, bio, location' as const;

export function isMissingUsernameColumnError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const maybe = error as { message?: unknown; code?: unknown };
  const message = typeof maybe.message === 'string' ? maybe.message : '';
  const code = typeof maybe.code === 'string' ? maybe.code : '';
  return code === '42703' || /column profiles\.username does not exist/i.test(message);
}
