import * as ImagePicker from 'expo-image-picker';

import {
  isMissingUsernameColumnError,
  PROFILE_SELECT_FULL,
  PROFILE_SELECT_LEGACY,
} from '@/services/profile-columns';
import { countPostsByUser } from '@/services/feed-posts';
import { supabase } from '@/services/supabase';

export const DEFAULT_LOCATION = 'Irvine, CA';
export const DEFAULT_BIO = 'Sharing balikbayan box moments with family and friends.';

export type UserProfile = {
  id: string;
  displayName: string;
  username: string;
  handle: string;
  bio: string;
  location: string;
  avatarUrl: string | null;
};

export type ProfileStats = {
  boxes: number;
  friends: number;
  posts: number;
};

type ProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
};

function formatServiceError(step: string, error: unknown): Error {
  if (error instanceof Error) {
    return new Error(`[${step}] ${error.message}`);
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const message = typeof (error as { message: unknown }).message === 'string'
      ? (error as { message: string }).message
      : 'Unknown error';
    return new Error(`[${step}] ${message}`);
  }
  return new Error(`[${step}] Unknown error`);
}

export function usernameToHandle(username: string): string {
  const trimmed = username.trim().toLowerCase();
  if (!trimmed) return '@username';
  const slug = trimmed.replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  return `@${slug || 'username'}`;
}

function normalizeUsername(value: string | null | undefined): string | null {
  const trimmed = value?.trim().toLowerCase() ?? '';
  if (!trimmed) return null;
  return trimmed.replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || null;
}

function resolveDisplayName(
  profile: ProfileRow | null,
  username: string,
  emailName: string | null,
): string {
  return profile?.display_name?.trim() || username || emailName || 'User';
}

function resolveUsername(
  profile: ProfileRow | null,
  metadataUsername: string | null,
  emailName: string | null,
): string {
  return (
    normalizeUsername(profile?.username) ||
    normalizeUsername(metadataUsername) ||
    normalizeUsername(emailName) ||
    'username'
  );
}

async function fetchProfileRow(userId: string): Promise<ProfileRow | null> {
  const full = await supabase.from('profiles').select(PROFILE_SELECT_FULL).eq('id', userId).maybeSingle();
  if (!full.error) return full.data as ProfileRow | null;

  if (isMissingUsernameColumnError(full.error)) {
    const legacy = await supabase
      .from('profiles')
      .select(PROFILE_SELECT_LEGACY)
      .eq('id', userId)
      .maybeSingle();
    if (legacy.error) throw formatServiceError('profile:select', legacy.error);
    return legacy.data as ProfileRow | null;
  }

  throw formatServiceError('profile:select', full.error);
}

export async function fetchCurrentProfile(): Promise<UserProfile | null> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) throw formatServiceError('profile:auth', authError);
  if (!user) return null;

  const metadataUsername =
    (typeof user.user_metadata?.display_name === 'string' && user.user_metadata.display_name.trim()) ||
    null;
  const emailName = user.email?.split('@')[0]?.trim() || null;

  const row = await fetchProfileRow(user.id);
  const username = resolveUsername(row, metadataUsername, emailName);
  const displayName = resolveDisplayName(row, username, emailName);

  return {
    id: user.id,
    displayName,
    username,
    handle: usernameToHandle(username),
    bio: row?.bio?.trim() || DEFAULT_BIO,
    location: row?.location?.trim() || DEFAULT_LOCATION,
    avatarUrl: row?.avatar_url?.trim() || null,
  };
}

export async function fetchProfileStats(userId: string): Promise<ProfileStats> {
  const { data: memberships, error: memberError } = await supabase
    .from('box_members')
    .select('box_id')
    .eq('user_id', userId);

  if (memberError) throw formatServiceError('profile:stats_members', memberError);

  const boxIds = [...new Set((memberships ?? []).map((m) => m.box_id as string))];
  const boxes = boxIds.length;

  let posts = 0;
  try {
    posts = await countPostsByUser(userId);
  } catch {
    posts = 0;
  }

  if (boxIds.length === 0) {
    return { boxes: 0, friends: 0, posts };
  }

  const { data: peers, error: peersError } = await supabase
    .from('box_members')
    .select('user_id')
    .in('box_id', boxIds);

  if (peersError) throw formatServiceError('profile:stats_peers', peersError);

  const friendIds = new Set(
    (peers ?? [])
      .map((p) => p.user_id as string)
      .filter((id) => id !== userId),
  );

  return { boxes, friends: friendIds.size, posts };
}

export async function updateProfile(params: {
  displayName: string;
  bio: string;
  location: string;
  avatarUrl?: string | null;
}): Promise<void> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) throw formatServiceError('profile:update_auth', authError);
  if (!user) throw new Error('[profile:update] Not signed in');

  const patch: Record<string, string | null> = {
    display_name: params.displayName.trim() || null,
    bio: params.bio.trim() || DEFAULT_BIO,
    location: params.location.trim() || DEFAULT_LOCATION,
  };
  if (params.avatarUrl !== undefined) {
    patch.avatar_url = params.avatarUrl;
  }

  const { error } = await supabase.from('profiles').upsert({ id: user.id, ...patch }, { onConflict: 'id' });
  if (error) throw formatServiceError('profile:update', error);
}

export async function pickProfileImage(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Photo library permission is required to change your profile picture.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  });

  if (result.canceled || !result.assets[0]?.uri) {
    return null;
  }

  return result.assets[0].uri;
}

export async function uploadProfileAvatar(localUri: string, userId: string): Promise<string> {
  const response = await fetch(localUri);
  const arrayBuffer = await response.arrayBuffer();
  const contentType = response.headers.get('Content-Type') ?? 'image/jpeg';
  const ext = contentType.includes('png') ? 'png' : 'jpg';
  const path = `${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage.from('avatars').upload(path, arrayBuffer, {
    contentType,
    upsert: true,
  });
  if (uploadError) throw formatServiceError('profile:avatar_upload', uploadError);

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  const publicUrl = data.publicUrl;
  if (!publicUrl) throw new Error('[profile:avatar_upload] Could not resolve public URL');
  return `${publicUrl}?t=${Date.now()}`;
}
