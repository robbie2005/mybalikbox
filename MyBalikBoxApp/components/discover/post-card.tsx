import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DiscoverAvatar } from '@/components/discover/avatar';
import { ChecklistDesign } from '@/constants/checklist-design';
import type { DiscoverPost } from '@/services/discover-feed';

function formatRelativeTime(value: string): string {
  const created = new Date(value).getTime();
  const deltaMs = Math.max(0, Date.now() - created);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (deltaMs < hour) {
    const minutes = Math.max(1, Math.floor(deltaMs / minute));
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }
  if (deltaMs < day) {
    const hours = Math.max(1, Math.floor(deltaMs / hour));
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  const days = Math.max(1, Math.floor(deltaMs / day));
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function formatCategoryLabel(category: DiscoverPost['category']): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

type Props = {
  post: DiscoverPost;
  onLikePress: (post: DiscoverPost) => void;
  onCommentPress: (post: DiscoverPost) => void;
};

export function DiscoverPostCard({ post, onLikePress, onCommentPress }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <DiscoverAvatar name={post.authorName} avatarUrl={post.authorAvatarUrl} size={37} />
        <View style={styles.headerText}>
          <Text style={styles.authorLine}>
            <Text style={styles.author}>{post.authorName}</Text>
            <Text>{` • ${formatRelativeTime(post.createdAt)}`}</Text>
          </Text>
          {post.sharedWithText ? (
            <Text style={styles.sharedText}>
              Shared with <Text style={styles.sharedName}>{post.sharedWithText}</Text>
            </Text>
          ) : null}
        </View>
      </View>

      <Image source={{ uri: post.imageUrl }} style={styles.image} contentFit="cover" transition={180} />

      <Text style={styles.caption}>{post.caption}</Text>
      <Text style={styles.tagText}>
        Tag: <Text style={styles.tagName}>{formatCategoryLabel(post.category)}</Text>
      </Text>

      <View style={styles.actions}>
        <Pressable onPress={() => onLikePress(post)} style={styles.actionButton} accessibilityRole="button">
          <MaterialIcons
            name={post.viewerHasLiked ? 'favorite' : 'favorite-border'}
            size={35}
            color={post.viewerHasLiked ? '#A95A38' : ChecklistDesign.textPrimary}
          />
        </Pressable>

        <Pressable onPress={() => onCommentPress(post)} style={styles.actionButton} accessibilityRole="button">
          <MaterialIcons name="chat-bubble-outline" size={33} color={ChecklistDesign.textPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerText: {
    flex: 1,
    marginLeft: 11,
  },
  authorLine: {
    color: ChecklistDesign.textPrimary,
    fontSize: 13,
  },
  author: {
    fontWeight: '700',
  },
  sharedText: {
    marginTop: 2,
    color: '#857763',
    fontSize: 13,
  },
  sharedName: {
    color: '#4F7B96',
    fontWeight: '700',
  },
  image: {
    width: '100%',
    aspectRatio: 1.28,
    borderRadius: 0,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  caption: {
    marginTop: 11,
    color: ChecklistDesign.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  tagText: {
    marginTop: 9,
    color: ChecklistDesign.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  tagName: {
    color: '#A85E34',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
    marginTop: 10,
  },
  actionButton: {
    minWidth: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
