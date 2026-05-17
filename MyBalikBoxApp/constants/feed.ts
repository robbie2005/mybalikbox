export type FeedCategory = 'All' | 'Gratitude' | 'Family' | 'Culture';

export type FeedPostCategory = Exclude<FeedCategory, 'All'>;

export type FeedPost = {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUri: string | null;
  timeAgo: string;
  sharedWithName: string;
  imageUri: string;
  caption: string;
  tag: FeedPostCategory;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
};

export type FeedPostComment = {
  id: string;
  postId: string;
  parentId: string | null;
  authorName: string;
  authorUsername: string | null;
  authorAvatarUri: string | null;
  replyToAuthorName: string | null;
  replyToUsername: string | null;
  body: string;
  timeAgo: string;
  likeCount: number;
  likedByMe: boolean;
};

export const FEED_CATEGORIES: FeedCategory[] = ['All', 'Gratitude', 'Family', 'Culture'];
