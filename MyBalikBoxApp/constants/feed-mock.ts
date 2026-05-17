export type FeedCategory = 'All' | 'Gratitude' | 'Family' | 'Culture';

export type FeedPost = {
  id: string;
  authorName: string;
  authorAvatarUri: string;
  timeAgo: string;
  sharedWithName: string;
  imageUri: string;
  caption: string;
  tag: Exclude<FeedCategory, 'All'>;
  likeCount?: number;
  commentCount?: number;
};

export const FEED_CATEGORIES: FeedCategory[] = ['All', 'Gratitude', 'Family', 'Culture'];

export const MOCK_FEED_POSTS: FeedPost[] = [
  {
    id: '1',
    authorName: 'Kaylee',
    authorAvatarUri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    timeAgo: '2 hours ago',
    sharedWithName: 'Emma',
    imageUri:
      'https://images.unsplash.com/photo-1604719312566-8912d9227c59?w=800&h=600&fit=crop',
    caption:
      "Packed some of my mom's favorite snacks and a few things she asked for. Can't wait for this box to reach home. ❤️📦",
    tag: 'Family',
  },
  {
    id: '2',
    authorName: 'Maria',
    authorAvatarUri: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
    timeAgo: '5 hours ago',
    sharedWithName: 'Sam',
    imageUri:
      'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=600&fit=crop',
    caption: 'Grateful for everyone who helped fill our box this week. Salamat po! 🙏',
    tag: 'Gratitude',
  },
  {
    id: '3',
    authorName: 'Andrei',
    authorAvatarUri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    timeAgo: 'Yesterday',
    sharedWithName: 'Kaylee',
    imageUri:
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d4046?w=800&h=600&fit=crop',
    caption: 'Added some pantry staples and instant noodles—classic balikbayan essentials.',
    tag: 'Culture',
  },
  {
    id: '4',
    authorName: 'Emma',
    authorAvatarUri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
    timeAgo: '2 days ago',
    sharedWithName: 'Maria',
    imageUri:
      'https://images.unsplash.com/photo-1586201375761-83865001e26a?w=800&h=600&fit=crop',
    caption: 'Tried to pack light but ended up with snacks for the whole barangay. 😅',
    tag: 'Family',
  },
];
