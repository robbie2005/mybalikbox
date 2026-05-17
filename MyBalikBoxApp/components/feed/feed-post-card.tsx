import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ChecklistDesign } from '@/constants/checklist-design';
import type { FeedPost } from '@/constants/feed-mock';

type FeedPostCardProps = {
  post: FeedPost;
  onLike?: () => void;
  onComment?: () => void;
};

export function FeedPostCard({ post, onLike, onComment }: FeedPostCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.postHeader}>
        <Image source={{ uri: post.authorAvatarUri }} style={styles.avatar} contentFit="cover" />
        <View style={styles.headerText}>
          <Text style={styles.metaLine}>
            <Text style={styles.authorName}>{post.authorName}</Text>
            <Text style={styles.metaMuted}> • {post.timeAgo}</Text>
          </Text>
          <Text style={styles.sharedLine}>
            Shared with <Text style={styles.sharedName}>{post.sharedWithName}</Text>
          </Text>
        </View>
      </View>

      <View style={styles.imageFrame}>
        <Image source={{ uri: post.imageUri }} style={styles.postImage} contentFit="cover" />
      </View>

      <Text style={styles.caption}>{post.caption}</Text>

      <Text style={styles.tagLine}>
        Tag: <Text style={styles.tagValue}>{post.tag}</Text>
      </Text>

      <View style={styles.actionsRow}>
        <Pressable
          onPress={onLike}
          style={styles.actionButton}
          accessibilityRole="button"
          accessibilityLabel="Like post">
          <MaterialIcons name="favorite-border" size={26} color={ChecklistDesign.textPrimary} />
        </Pressable>
        <Pressable
          onPress={onComment}
          style={styles.actionButton}
          accessibilityRole="button"
          accessibilityLabel="Comment on post">
          <MaterialIcons name="chat-bubble-outline" size={26} color={ChecklistDesign.textPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 28,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8DFD0',
  },
  headerText: {
    flex: 1,
  },
  metaLine: {
    fontSize: 15,
    lineHeight: 20,
  },
  authorName: {
    fontWeight: '700',
    color: ChecklistDesign.textPrimary,
  },
  metaMuted: {
    fontWeight: '500',
    color: ChecklistDesign.textMuted,
  },
  sharedLine: {
    marginTop: 2,
    fontSize: 14,
    color: ChecklistDesign.textMuted,
  },
  sharedName: {
    color: '#4A90D9',
    fontWeight: '600',
  },
  imageFrame: {
    borderRadius: 4,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  postImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: '#E8DFD0',
  },
  caption: {
    marginTop: 14,
    fontSize: 15,
    lineHeight: 22,
    color: ChecklistDesign.textPrimary,
    fontWeight: '500',
  },
  tagLine: {
    marginTop: 10,
    fontSize: 14,
    color: ChecklistDesign.textMuted,
    fontWeight: '500',
  },
  tagValue: {
    color: '#B85C38',
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginTop: 12,
  },
  actionButton: {
    padding: 4,
  },
});
