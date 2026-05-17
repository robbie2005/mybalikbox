import type { FeedPostComment } from '@/constants/feed';
import { resolveProfileAvatarUrl } from '@/services/profile';
import { supabase } from '@/services/supabase';
import { formatTimeAgoShort } from '@/utils/time-ago';

type ProfileSnippet = {
  display_name: string | null;
  avatar_url: string | null;
  username: string | null;
};

type CommentRow = {
  id: string;
  post_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
  profiles: ProfileSnippet | ProfileSnippet[] | null;
  parent: { profiles: ProfileSnippet | ProfileSnippet[] | null } | { profiles: ProfileSnippet | ProfileSnippet[] | null }[] | null;
};

type CommentLikeRow = { comment_id: string; user_id: string };

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

function profileFromRow(
  profiles: ProfileSnippet | ProfileSnippet[] | null | undefined,
): ProfileSnippet | null {
  if (!profiles) return null;
  return Array.isArray(profiles) ? (profiles[0] ?? null) : profiles;
}

function resolveAuthorName(profile: ProfileSnippet | null): string {
  const display = profile?.display_name?.trim();
  if (display) return display;
  const username = profile?.username?.trim();
  if (username) return username;
  return 'User';
}

function resolveUsername(profile: ProfileSnippet | null): string | null {
  const username = profile?.username?.trim();
  return username || null;
}

function parentProfileFromRow(row: CommentRow): ProfileSnippet | null {
  if (!row.parent) return null;
  const parent = Array.isArray(row.parent) ? row.parent[0] : row.parent;
  return profileFromRow(parent?.profiles);
}

function mapRowToComment(row: CommentRow): FeedPostComment {
  const profile = profileFromRow(row.profiles);
  const parentProfile = parentProfileFromRow(row);

  return {
    id: row.id,
    postId: row.post_id,
    parentId: row.parent_id,
    authorName: resolveAuthorName(profile),
    authorUsername: resolveUsername(profile),
    authorAvatarUri: resolveProfileAvatarUrl(profile?.avatar_url),
    replyToAuthorName: row.parent_id ? resolveAuthorName(parentProfile) : null,
    replyToUsername: row.parent_id ? resolveUsername(parentProfile) : null,
    body: row.body,
    timeAgo: formatTimeAgoShort(row.created_at),
    likeCount: 0,
    likedByMe: false,
  };
}

function enrichReplyMentions(comments: FeedPostComment[]): FeedPostComment[] {
  const byId = new Map(comments.map((comment) => [comment.id, comment]));
  return comments.map((comment) => {
    if (!comment.parentId || comment.replyToAuthorName) return comment;
    const parent = byId.get(comment.parentId);
    if (!parent) return comment;
    return {
      ...comment,
      replyToAuthorName: parent.authorName,
      replyToUsername: parent.authorUsername,
    };
  });
}

async function attachCommentLikeStats(comments: FeedPostComment[]): Promise<FeedPostComment[]> {
  if (comments.length === 0) return comments;

  const commentIds = comments.map((c) => c.id);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? null;

  const { data, error } = await supabase
    .from('feed_post_comment_likes')
    .select('comment_id, user_id')
    .in('comment_id', commentIds);

  if (error) throw formatServiceError('comments:likes_fetch', error);

  const likeCountByComment = new Map<string, number>();
  const likedByMe = new Set<string>();

  for (const row of (data ?? []) as CommentLikeRow[]) {
    likeCountByComment.set(row.comment_id, (likeCountByComment.get(row.comment_id) ?? 0) + 1);
    if (currentUserId && row.user_id === currentUserId) {
      likedByMe.add(row.comment_id);
    }
  }

  return comments.map((comment) => ({
    ...comment,
    likeCount: likeCountByComment.get(comment.id) ?? 0,
    likedByMe: likedByMe.has(comment.id),
  }));
}

const COMMENT_SELECT = `
  id,
  post_id,
  parent_id,
  body,
  created_at,
  profiles!author_id (
    display_name,
    avatar_url,
    username
  ),
  parent:feed_post_comments!parent_id (
    profiles!author_id (
      display_name,
      avatar_url,
      username
    )
  )
`;

export async function fetchFeedPostComments(postId: string): Promise<FeedPostComment[]> {
  const { data, error } = await supabase
    .from('feed_post_comments')
    .select(COMMENT_SELECT)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw formatServiceError('comments:fetch', error);
  const comments = enrichReplyMentions((data ?? []).map((row) => mapRowToComment(row as CommentRow)));
  return attachCommentLikeStats(comments);
}

export type CreateFeedPostCommentInput = {
  postId: string;
  body: string;
  parentId?: string | null;
  replyToAuthorName?: string | null;
  replyToUsername?: string | null;
};

export async function createFeedPostComment(
  input: CreateFeedPostCommentInput,
): Promise<FeedPostComment> {
  const trimmed = input.body.trim();
  if (!trimmed) throw new Error('[comments:create] Comment cannot be empty.');

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) throw formatServiceError('comments:create_auth', authError);
  if (!user) throw new Error('[comments:create] Not signed in');

  const { data, error } = await supabase
    .from('feed_post_comments')
    .insert({
      post_id: input.postId,
      author_id: user.id,
      body: trimmed,
      parent_id: input.parentId ?? null,
    })
    .select(COMMENT_SELECT)
    .single();

  if (error) throw formatServiceError('comments:create_insert', error);
  let mapped = mapRowToComment(data as CommentRow);
  if (input.parentId && input.replyToAuthorName) {
    mapped = {
      ...mapped,
      replyToAuthorName: input.replyToAuthorName,
      replyToUsername: input.replyToUsername ?? null,
    };
  }
  const [comment] = await attachCommentLikeStats(enrichReplyMentions([mapped]));
  return comment;
}

export async function likeFeedPostComment(commentId: string): Promise<void> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) throw formatServiceError('comments:like_auth', authError);
  if (!user) throw new Error('[comments:like] Not signed in');

  const { error } = await supabase.from('feed_post_comment_likes').insert({
    comment_id: commentId,
    user_id: user.id,
  });

  if (error) {
    if (error.code === '23505') return;
    throw formatServiceError('comments:like_insert', error);
  }
}

/** @username for mentions (prefers username, falls back to display name). */
export function mentionHandle(comment: Pick<FeedPostComment, 'authorUsername' | 'authorName'>): string {
  const username = comment.authorUsername?.trim();
  if (username) return username.replace(/\s+/g, '');
  return comment.authorName.replace(/\s+/g, '');
}

export function replyMentionHandle(
  comment: Pick<FeedPostComment, 'replyToUsername' | 'replyToAuthorName'>,
): string | null {
  if (!comment.replyToAuthorName) return null;
  const username = comment.replyToUsername?.trim();
  if (username) return username.replace(/\s+/g, '');
  return comment.replyToAuthorName.replace(/\s+/g, '');
}
