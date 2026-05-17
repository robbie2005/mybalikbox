import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { FeedPostThumbnail } from '@/services/feed-posts';

const COLUMNS = 3;
const PROFILE_HORIZONTAL_PADDING = 40;

type ProfilePostsGridProps = {
  posts: FeedPostThumbnail[];
  loading?: boolean;
  onPostPress: (postId: string) => void;
};

export function ProfilePostsGrid({ posts, loading, onPostPress }: ProfilePostsGridProps) {
  const { width: screenWidth } = useWindowDimensions();
  const itemSize = (screenWidth - PROFILE_HORIZONTAL_PADDING) / COLUMNS;

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="small" color="#5F6670" />
      </View>
    );
  }

  if (posts.length === 0) {
    return <Text style={styles.emptyText}>No posts yet.</Text>;
  }

  return (
    <View style={styles.grid}>
      {posts.map((post) => (
        <Pressable
          key={post.id}
          style={[styles.gridItem, { width: itemSize, height: itemSize }]}
          onPress={() => onPostPress(post.id)}
          accessibilityRole="button"
          accessibilityLabel="View post on feed">
          <Image source={{ uri: post.imageUri }} style={styles.thumbnail} contentFit="cover" />
          {post.mediaType === 'video' ? (
            <View style={styles.videoBadge}>
              <MaterialIcons name="play-arrow" size={18} color="#FFFFFF" />
            </View>
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    width: '100%',
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    width: '100%',
    textAlign: 'center',
    fontSize: 13,
    color: '#5F6670',
    marginTop: 20,
    marginBottom: 8,
  },
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
  },
  gridItem: {
    backgroundColor: '#D8D8D8',
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  videoBadge: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
