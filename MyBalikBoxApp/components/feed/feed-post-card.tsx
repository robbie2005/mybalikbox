import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { ProfileAvatar } from '@/components/profile-avatar';
import { ChecklistDesign } from '@/constants/checklist-design';
import type { FeedPost } from '@/constants/feed';
import { resolveFeedImageUrl } from '@/services/feed-posts';

/** Matches horizontal padding on `feed.tsx` scroll content. */
const FEED_HORIZONTAL_PADDING = 20;

type FeedPostCardProps = {
  post: FeedPost;
  isOwnPost?: boolean;
  onLike?: () => void;
  onComment?: () => void;
  onDelete?: () => void;
};

export function FeedPostCard({ post, isOwnPost, onLike, onComment, onDelete }: FeedPostCardProps) {
  const { width: screenWidth } = useWindowDimensions();
  const [imageUri, setImageUri] = useState(post.imageUri);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageUri(post.imageUri);
    setImageFailed(false);
  }, [post.id, post.imageUri]);

  const onDeletePress = () => {
    Alert.alert('Delete post?', 'This will permanently remove your post from the feed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDelete?.(),
      },
    ]);
  };

  const onImageError = () => {
    if (imageFailed) return;
    setImageFailed(true);
    void resolveFeedImageUrl(post.imageUri)
      .then(setImageUri)
      .catch(() => {
        // Keep showing placeholder background if reload fails.
      });
  };

  return (
    <View style={styles.card}>
      <View style={styles.postHeader}>
        <ProfileAvatar uri={post.authorAvatarUri} size={44} style={styles.avatar} />
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
        <Image
          source={{ uri: imageUri }}
          style={styles.postImage}
          contentFit="cover"
          recyclingKey={post.id}
          onError={onImageError}
        />
      </View>

      <Text style={styles.caption}>{post.caption}</Text>

      <Text style={styles.tagLine}>
        Tag: <Text style={styles.tagValue}>{post.tag}</Text>
      </Text>

      <View
        style={[
          styles.actionsRow,
          {
            width: screenWidth,
            marginLeft: -FEED_HORIZONTAL_PADDING,
            paddingHorizontal: FEED_HORIZONTAL_PADDING,
          },
        ]}>
        <View style={styles.actionsLeading}>
        <View style={styles.actionGroup}>
          <Pressable
            onPress={onLike}
            disabled={post.likedByMe}
            style={styles.actionButton}
            accessibilityRole="button"
            accessibilityLabel={post.likedByMe ? 'Liked' : 'Like post'}
            accessibilityState={{ disabled: post.likedByMe }}>
            <MaterialIcons
              name={post.likedByMe ? 'favorite' : 'favorite-border'}
              size={26}
              color={post.likedByMe ? '#D64545' : ChecklistDesign.textPrimary}
            />
          </Pressable>
          <Text style={styles.actionCount}>{post.likeCount}</Text>
        </View>
        <View style={[styles.actionGroup, styles.commentGroup]}>
          <Pressable
            onPress={onComment}
            style={styles.actionButton}
            accessibilityRole="button"
            accessibilityLabel="Comment on post">
            <MaterialIcons name="chat-bubble-outline" size={26} color={ChecklistDesign.textPrimary} />
          </Pressable>
          <Text style={styles.actionCount}>{post.commentCount}</Text>
        </View>
        </View>
        {isOwnPost ? (
          <Pressable
            onPress={onDeletePress}
            style={styles.deleteButton}
            accessibilityRole="button"
            accessibilityLabel="Delete post">
            <MaterialIcons name="delete-outline" size={26} color={ChecklistDesign.textPrimary} />
          </Pressable>
        ) : null}
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
    justifyContent: 'space-between',
    marginTop: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.42)',
  },
  actionsLeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  deleteButton: {
    paddingVertical: 4,
    paddingLeft: 8,
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  commentGroup: {
    marginLeft: -18,
  },
  actionButton: {
    paddingVertical: 4,
  },
  actionCount: {
    minWidth: 18,
    fontSize: 15,
    fontWeight: '600',
    color: ChecklistDesign.textPrimary,
  },
});
