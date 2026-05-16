import { ensureProfileRow, fetchCurrentProfileSummary, type ProfileSummary } from '@/services/profiles';
import { supabase } from '@/services/supabase';

const DISCOVER_BUCKET = 'discover-post-images';

export type DiscoverCategory = 'gratitude' | 'family' | 'culture';

export type DiscoverPost = {
  id: string;
  category: DiscoverCategory;
  caption: string;
  sharedWithText: string | null;
  imagePath: string;
  imageUrl: string;
  createdAt: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  likeCount: number;
  commentCount: number;
  viewerHasLiked: boolean;
};

export type DiscoverComment = {
  id: string;
  postId: string;
  body: string;
  createdAt: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
};

export type CreateDiscoverPostInput = {
  category: DiscoverCategory;
  caption: string;
  sharedWithText?: string | null;
  image: {
    uri: string;
    fileName?: string | null;
    mimeType?: string | null;
  };
};

type PostRow = {
  id: string;
  category: DiscoverCategory;
  caption: string;
  shared_with_text: string | null;
  image_path: string;
  created_at: string;
  author_id: string;
  profiles:
    | {
        display_name: string | null;
        avatar_url: string | null;
      }
    | {
        display_name: string | null;
        avatar_url: string | null;
      }[]
    | null;
};

type CommentRow = {
  id: string;
  post_id: string;
  body: string;
  created_at: string;
  author_id: string;
  profiles:
    | {
        display_name: string | null;
        avatar_url: string | null;
      }
    | {
        display_name: string | null;
        avatar_url: string | null;
      }[]
    | null;
};

type LikeRow = {
  post_id: string;
  user_id: string;
};

function slugifyFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function profileFromJoin(
  value:
    | {
        display_name: string | null;
        avatar_url: string | null;
      }
    | {
        display_name: string | null;
        avatar_url: string | null;
      }[]
    | null,
): { displayName: string; avatarUrl: string | null } {
  const record = Array.isArray(value) ? value[0] : value;
  return {
    displayName: record?.display_name?.trim() || 'User',
    avatarUrl: record?.avatar_url ?? null,
  };
}

function imageUrlForPath(path: string): string {
  return supabase.storage.from(DISCOVER_BUCKET).getPublicUrl(path).data.publicUrl;
}

function mapPost(row: PostRow, viewerId: string, comments: CommentRow[], likes: LikeRow[]): DiscoverPost {
  const profile = profileFromJoin(row.profiles);
  const likeRows = likes.filter((like) => like.post_id === row.id);
  const commentCount = comments.filter((comment) => comment.post_id === row.id).length;

  return {
    id: row.id,
    category: row.category,
    caption: row.caption,
    sharedWithText: row.shared_with_text,
    imagePath: row.image_path,
    imageUrl: imageUrlForPath(row.image_path),
    createdAt: row.created_at,
    authorId: row.author_id,
    authorName: profile.displayName,
    authorAvatarUrl: profile.avatarUrl,
    likeCount: likeRows.length,
    commentCount,
    viewerHasLiked: likeRows.some((like) => like.user_id === viewerId),
  };
}

function mapComment(row: CommentRow): DiscoverComment {
  const profile = profileFromJoin(row.profiles);
  return {
    id: row.id,
    postId: row.post_id,
    body: row.body,
    createdAt: row.created_at,
    authorId: row.author_id,
    authorName: profile.displayName,
    authorAvatarUrl: profile.avatarUrl,
  };
}

async function getCurrentUserProfile(): Promise<ProfileSummary> {
  return fetchCurrentProfileSummary();
}

async function uploadDiscoverImage(
  userId: string,
  image: CreateDiscoverPostInput['image'],
): Promise<string> {
  const extensionFromMime = image.mimeType?.split('/')[1]?.toLowerCase();
  const fallbackName = extensionFromMime ? `upload.${extensionFromMime}` : 'upload.jpg';
  const fileName = slugifyFileName(image.fileName?.trim() || fallbackName) || fallbackName;
  const path = `${userId}/${Date.now()}-${fileName}`;

  let body: ArrayBuffer;
  const response = await fetch(image.uri);
  body = await response.arrayBuffer();

  const { error } = await supabase.storage.from(DISCOVER_BUCKET).upload(path, body, {
    contentType: image.mimeType ?? 'image/jpeg',
    upsert: false,
  });

  if (error) throw error;
  return path;
}

async function fetchPostRows(category?: DiscoverCategory): Promise<PostRow[]> {
  let query = supabase
    .from('discover_posts')
    .select(
      'id, category, caption, shared_with_text, image_path, created_at, author_id, profiles!discover_posts_author_id_fkey(display_name, avatar_url)',
    )
    .order('created_at', { ascending: false });

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as PostRow[];
}

async function fetchCommentRows(postIds: string[]): Promise<CommentRow[]> {
  if (postIds.length === 0) return [];

  const { data, error } = await supabase
    .from('discover_comments')
    .select('id, post_id, body, created_at, author_id, profiles!discover_comments_author_id_fkey(display_name, avatar_url)')
    .in('post_id', postIds);

  if (error) throw error;
  return (data ?? []) as CommentRow[];
}

async function fetchLikeRows(postIds: string[]): Promise<LikeRow[]> {
  if (postIds.length === 0) return [];

  const { data, error } = await supabase
    .from('discover_post_likes')
    .select('post_id, user_id')
    .in('post_id', postIds);

  if (error) throw error;
  return (data ?? []) as LikeRow[];
}

export async function fetchDiscoverPosts(category?: DiscoverCategory): Promise<DiscoverPost[]> {
  const viewer = await getCurrentUserProfile();
  const postRows = await fetchPostRows(category);
  const postIds = postRows.map((row) => row.id);
  const [commentRows, likeRows] = await Promise.all([fetchCommentRows(postIds), fetchLikeRows(postIds)]);

  return postRows.map((row) => mapPost(row, viewer.id, commentRows, likeRows));
}

export async function createDiscoverPost(input: CreateDiscoverPostInput): Promise<DiscoverPost> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Sign in to share a post.');
  }

  const profile = await ensureProfileRow(user);
  const imagePath = await uploadDiscoverImage(user.id, input.image);

  const { data, error } = await supabase
    .from('discover_posts')
    .insert({
      author_id: profile.id,
      category: input.category,
      caption: input.caption.trim(),
      shared_with_text: input.sharedWithText?.trim() || null,
      image_path: imagePath,
    })
    .select(
      'id, category, caption, shared_with_text, image_path, created_at, author_id, profiles!discover_posts_author_id_fkey(display_name, avatar_url)',
    )
    .single();

  if (error) {
    await supabase.storage.from(DISCOVER_BUCKET).remove([imagePath]);
    throw error;
  }

  return mapPost(data as PostRow, user.id, [], []);
}

export async function toggleDiscoverPostLike(postId: string, liked: boolean): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Sign in to like posts.');
  }

  await ensureProfileRow(user);

  if (liked) {
    const { error } = await supabase
      .from('discover_post_likes')
      .upsert({ post_id: postId, user_id: user.id }, { onConflict: 'post_id,user_id' });

    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from('discover_post_likes')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', user.id);

  if (error) throw error;
}

export async function fetchDiscoverComments(postId: string): Promise<DiscoverComment[]> {
  await getCurrentUserProfile();

  const { data, error } = await supabase
    .from('discover_comments')
    .select('id, post_id, body, created_at, author_id, profiles!discover_comments_author_id_fkey(display_name, avatar_url)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return ((data ?? []) as CommentRow[]).map(mapComment);
}

export async function createDiscoverComment(postId: string, body: string): Promise<DiscoverComment> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Sign in to comment.');
  }

  const profile = await ensureProfileRow(user);

  const { data, error } = await supabase
    .from('discover_comments')
    .insert({
      post_id: postId,
      author_id: profile.id,
      body: body.trim(),
    })
    .select('id, post_id, body, created_at, author_id, profiles!discover_comments_author_id_fkey(display_name, avatar_url)')
    .single();

  if (error) throw error;
  return mapComment(data as CommentRow);
}

export { fetchCurrentProfileSummary };
