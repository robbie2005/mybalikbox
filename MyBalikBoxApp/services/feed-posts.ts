import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';

import type { FeedPost, FeedPostCategory } from '@/constants/feed';
import { resolveProfileAvatarUrl } from '@/services/profile';
import { formatTimeAgo } from '@/utils/time-ago';
import { supabase } from '@/services/supabase';

export type CreateFeedPostInput = {
  localMediaUri: string;
  caption: string;
  category: FeedPostCategory;
  mediaType?: 'photo' | 'video';
  assetId?: string;
};

type ProfileSnippet = {
  display_name: string | null;
  avatar_url: string | null;
  username: string | null;
};

type FeedPostRow = {
  id: string;
  author_id: string;
  image_url: string;
  caption: string;
  category: FeedPostCategory;
  media_type: string;
  created_at: string;
  profiles: ProfileSnippet | ProfileSnippet[] | null;
};

function formatServiceError(step: string, error: unknown): Error {
  if (error instanceof Error) {
    return new Error(`[${step}] ${error.message}`);
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const message =
      typeof (error as { message: unknown }).message === 'string'
        ? (error as { message: string }).message
        : 'Unknown error';
    return new Error(`[${step}] ${message}`);
  }
  return new Error(`[${step}] Unknown error`);
}

function profileFromRow(row: FeedPostRow): ProfileSnippet | null {
  if (!row.profiles) return null;
  return Array.isArray(row.profiles) ? (row.profiles[0] ?? null) : row.profiles;
}

function resolveAuthorName(row: FeedPostRow): string {
  const profile = profileFromRow(row);
  const display = profile?.display_name?.trim();
  if (display) return display;
  const username = profile?.username?.trim();
  if (username) return username;
  return 'User';
}

function mapRowToFeedPost(row: FeedPostRow): FeedPost {
  const profile = profileFromRow(row);
  return {
    id: row.id,
    authorId: row.author_id,
    authorName: resolveAuthorName(row),
    authorAvatarUri: resolveProfileAvatarUrl(profile?.avatar_url),
    timeAgo: formatTimeAgo(row.created_at),
    sharedWithName: 'Everyone',
    imageUri: row.image_url,
    caption: row.caption,
    tag: row.category,
    likeCount: 0,
    commentCount: 0,
    likedByMe: false,
  };
}

type EngagementRow = { post_id: string; user_id?: string };

async function attachEngagementStats(posts: FeedPost[]): Promise<FeedPost[]> {
  if (posts.length === 0) return posts;

  const postIds = posts.map((p) => p.id);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? null;

  const [likesResult, commentsResult] = await Promise.all([
    supabase.from('feed_post_likes').select('post_id, user_id').in('post_id', postIds),
    supabase.from('feed_post_comments').select('post_id').in('post_id', postIds),
  ]);

  if (likesResult.error) throw formatServiceError('feed:likes_fetch', likesResult.error);
  if (commentsResult.error) throw formatServiceError('feed:comments_fetch', commentsResult.error);

  const likeCountByPost = new Map<string, number>();
  const likedByMe = new Set<string>();

  for (const row of (likesResult.data ?? []) as EngagementRow[]) {
    likeCountByPost.set(row.post_id, (likeCountByPost.get(row.post_id) ?? 0) + 1);
    if (currentUserId && row.user_id === currentUserId) {
      likedByMe.add(row.post_id);
    }
  }

  const commentCountByPost = new Map<string, number>();
  for (const row of (commentsResult.data ?? []) as EngagementRow[]) {
    commentCountByPost.set(row.post_id, (commentCountByPost.get(row.post_id) ?? 0) + 1);
  }

  return posts.map((post) => ({
    ...post,
    likeCount: likeCountByPost.get(post.id) ?? 0,
    commentCount: commentCountByPost.get(post.id) ?? 0,
    likedByMe: likedByMe.has(post.id),
  }));
}

/** RFC 4122 v4 UUID (Postgres `uuid` column requires valid format). */
function createPostId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function extensionForContentType(contentType: string, mediaType: 'photo' | 'video'): string {
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('webp')) return 'webp';
  if (contentType.includes('video') || contentType.includes('mp4')) return 'mp4';
  if (mediaType === 'video') return 'mp4';
  return 'jpg';
}

function contentTypeFromUri(localUri: string, mediaType: 'photo' | 'video'): string {
  const lower = localUri.toLowerCase();
  if (lower.includes('.png')) return 'image/png';
  if (lower.includes('.webp')) return 'image/webp';
  if (lower.includes('.mp4') || mediaType === 'video') return 'video/mp4';
  return 'image/jpeg';
}

function normalizeFileUri(uri: string): string {
  const withoutHash = uri.split('#')[0] ?? uri;
  if (
    withoutHash.startsWith('file://') ||
    withoutHash.startsWith('content://') ||
    withoutHash.startsWith('ph://')
  ) {
    return withoutHash;
  }
  if (withoutHash.startsWith('/')) {
    return `file://${withoutHash}`;
  }
  return withoutHash;
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function resolveUploadUri(
  localUri: string,
  mediaType: 'photo' | 'video',
  assetId?: string,
): Promise<string> {
  if (mediaType === 'video' && assetId && !assetId.startsWith('camera-')) {
    try {
      const info = await MediaLibrary.getAssetInfoAsync(assetId, {
        shouldDownloadFromNetwork: true,
      });
      const localFile = info.localUri?.split('#')[0];
      if (localFile) return normalizeFileUri(localFile);
      if (info.uri) return info.uri;
    } catch {
      // Fall back to the preview URI below.
    }
  }

  return normalizeFileUri(localUri);
}

async function readBytesViaFetch(uri: string): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch(uri);
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    return buffer.byteLength > 0 ? buffer : null;
  } catch {
    return null;
  }
}

async function readVideoAsArrayBuffer(uri: string): Promise<ArrayBuffer> {
  const fromFetch = await readBytesViaFetch(uri);
  if (fromFetch) return fromFetch;

  const cacheDir = FileSystem.cacheDirectory;
  if (cacheDir) {
    const cachedPath = `${cacheDir}post-upload-${Date.now()}.mp4`;
    try {
      await FileSystem.copyAsync({ from: uri, to: cachedPath });
      const fromCache = await readBytesViaFetch(cachedPath);
      await FileSystem.deleteAsync(cachedPath, { idempotent: true });
      if (fromCache) return fromCache;
    } catch {
      await FileSystem.deleteAsync(cachedPath, { idempotent: true }).catch(() => undefined);
    }
  }

  throw new Error('[feed:media_read] Could not read video file for upload.');
}

async function readPhotoAsArrayBuffer(uri: string): Promise<ArrayBuffer> {
  const fromFetch = await readBytesViaFetch(uri);
  if (fromFetch) return fromFetch;

  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) {
    throw new Error('[feed:media_read] Photo file is missing on device.');
  }

  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  if (!base64) {
    throw new Error('[feed:media_read] Could not read photo data from device.');
  }
  return base64ToArrayBuffer(base64);
}

async function readLocalUriAsArrayBuffer(
  localUri: string,
  mediaType: 'photo' | 'video',
  assetId?: string,
): Promise<ArrayBuffer> {
  const uri = await resolveUploadUri(localUri, mediaType, assetId);
  if (mediaType === 'video') {
    return readVideoAsArrayBuffer(uri);
  }
  return readPhotoAsArrayBuffer(uri);
}

export function postMediaPathFromUrl(imageUrl: string): string | null {
  const markers = ['/object/public/post-media/', '/object/sign/post-media/'];
  for (const marker of markers) {
    const idx = imageUrl.indexOf(marker);
    if (idx === -1) continue;
    const raw = imageUrl.slice(idx + marker.length).split('?')[0] ?? '';
    return decodeURIComponent(raw);
  }
  return null;
}

/** Storage object path from DB value (path or legacy public URL). */
export function resolveStoragePath(imageUrlOrPath: string): string | null {
  if (!imageUrlOrPath) return null;
  if (imageUrlOrPath.startsWith('http://') || imageUrlOrPath.startsWith('https://')) {
    return postMediaPathFromUrl(imageUrlOrPath);
  }
  if (!imageUrlOrPath.includes('://')) {
    return imageUrlOrPath;
  }
  return null;
}

/** Signed URL for display in the feed (works for private or public buckets). */
export async function resolveFeedImageUrl(imageUrlOrPath: string): Promise<string> {
  const path = resolveStoragePath(imageUrlOrPath);
  if (!path) return imageUrlOrPath;

  const { data, error } = await supabase.storage
    .from('post-media')
    .createSignedUrl(path, 60 * 60 * 24 * 7);

  if (error) {
    throw formatServiceError('feed:signed_url', error);
  }
  if (!data?.signedUrl) {
    throw new Error('[feed:signed_url] Could not create image URL.');
  }
  return data.signedUrl;
}

/** Uploads media and returns the storage path (stored in feed_posts.image_url). */
export async function uploadPostMedia(
  localUri: string,
  userId: string,
  postId: string,
  mediaType: 'photo' | 'video',
  assetId?: string,
): Promise<string> {
  const arrayBuffer = await readLocalUriAsArrayBuffer(localUri, mediaType, assetId);
  if (arrayBuffer.byteLength === 0) {
    throw new Error('[feed:media_upload] Image file was empty.');
  }

  const contentType = contentTypeFromUri(localUri, mediaType);
  const ext = extensionForContentType(contentType, mediaType);
  const path = `${userId}/${postId}.${ext}`;

  const { error: uploadError } = await supabase.storage.from('post-media').upload(path, arrayBuffer, {
    contentType,
    upsert: true,
  });
  if (uploadError) throw formatServiceError('feed:media_upload', uploadError);

  return path;
}

export async function createFeedPost(input: CreateFeedPostInput): Promise<FeedPost> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) throw formatServiceError('feed:create_auth', authError);
  if (!user) throw new Error('[feed:create] Not signed in');

  const postId = createPostId();
  const mediaType = input.mediaType ?? 'photo';
  const storagePath = await uploadPostMedia(
    input.localMediaUri,
    user.id,
    postId,
    mediaType,
    input.assetId,
  );

  const { data, error } = await supabase
    .from('feed_posts')
    .insert({
      id: postId,
      author_id: user.id,
      image_url: storagePath,
      caption: input.caption.trim(),
      category: input.category,
      media_type: mediaType,
    })
    .select(
      `
      id,
      author_id,
      image_url,
      caption,
      category,
      media_type,
      created_at,
      profiles!author_id (
        display_name,
        avatar_url,
        username
      )
    `,
    )
    .single();

  if (error) throw formatServiceError('feed:create_insert', error);

  const [post] = await attachEngagementStats([mapRowToFeedPost(data as FeedPostRow)]);
  post.imageUri = await resolveFeedImageUrl(storagePath);
  return post;
}

export async function fetchFeedPosts(): Promise<FeedPost[]> {
  const { data, error } = await supabase
    .from('feed_posts')
    .select(
      `
      id,
      author_id,
      image_url,
      caption,
      category,
      media_type,
      created_at,
      profiles!author_id (
        display_name,
        avatar_url,
        username
      )
    `,
    )
    .order('created_at', { ascending: false });

  if (error) throw formatServiceError('feed:fetch', error);

  const posts = (data ?? []).map((row) => mapRowToFeedPost(row as FeedPostRow));
  const withEngagement = await attachEngagementStats(posts);
  return Promise.all(
    withEngagement.map(async (post) => ({
      ...post,
      imageUri: await resolveFeedImageUrl(post.imageUri),
    })),
  );
}

export async function deleteFeedPost(postId: string): Promise<void> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) throw formatServiceError('feed:delete_auth', authError);
  if (!user) throw new Error('[feed:delete] Not signed in');

  const { data: post, error: fetchError } = await supabase
    .from('feed_posts')
    .select('id, author_id, image_url')
    .eq('id', postId)
    .maybeSingle();

  if (fetchError) throw formatServiceError('feed:delete_fetch', fetchError);
  if (!post) throw new Error('[feed:delete] Post not found.');
  if (post.author_id !== user.id) throw new Error('[feed:delete] Not allowed to delete this post.');

  const storagePath = resolveStoragePath(post.image_url as string);
  if (storagePath) {
    const { error: storageError } = await supabase.storage.from('post-media').remove([storagePath]);
    if (storageError) {
      console.warn('feed:delete_media', storageError.message);
    }
  }

  const { error: deleteError } = await supabase
    .from('feed_posts')
    .delete()
    .eq('id', postId)
    .eq('author_id', user.id);

  if (deleteError) throw formatServiceError('feed:delete', deleteError);
}

export async function likeFeedPost(postId: string): Promise<void> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) throw formatServiceError('feed:like_auth', authError);
  if (!user) throw new Error('[feed:like] Not signed in');

  const { error } = await supabase.from('feed_post_likes').insert({
    post_id: postId,
    user_id: user.id,
  });

  if (error) {
    if (error.code === '23505') return;
    throw formatServiceError('feed:like_insert', error);
  }
}

export async function unlikeFeedPost(postId: string): Promise<void> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) throw formatServiceError('feed:unlike_auth', authError);
  if (!user) throw new Error('[feed:unlike] Not signed in');

  const { error } = await supabase
    .from('feed_post_likes')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', user.id);

  if (error) throw formatServiceError('feed:unlike_delete', error);
}

export type FeedPostThumbnail = {
  id: string;
  imageUri: string;
  mediaType: 'photo' | 'video';
};

export async function fetchUserFeedPostThumbnails(userId: string): Promise<FeedPostThumbnail[]> {
  const { data, error } = await supabase
    .from('feed_posts')
    .select('id, image_url, media_type')
    .eq('author_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw formatServiceError('feed:user_thumbnails', error);

  return Promise.all(
    (data ?? []).map(async (row) => ({
      id: row.id as string,
      imageUri: await resolveFeedImageUrl(row.image_url as string),
      mediaType: (row.media_type as 'photo' | 'video') ?? 'photo',
    })),
  );
}

export async function countPostsByUser(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('feed_posts')
    .select('id', { count: 'exact', head: true })
    .eq('author_id', userId);

  if (error) throw formatServiceError('feed:count', error);
  return count ?? 0;
}
