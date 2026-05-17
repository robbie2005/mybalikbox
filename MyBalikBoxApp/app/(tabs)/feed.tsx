import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ProfileAvatar } from '@/components/profile-avatar';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CommentsSheet } from '@/components/feed/comments-sheet';
import { FeedPostCard } from '@/components/feed/feed-post-card';
import { ChecklistDesign } from '@/constants/checklist-design';
import { FEED_CATEGORIES, type FeedCategory, type FeedPost } from '@/constants/feed';
import { consumePendingFeedScrollPostId } from '@/services/feed-navigation';
import { deleteFeedPost, fetchFeedPosts, likeFeedPost, unlikeFeedPost } from '@/services/feed-posts';
import { fetchCurrentProfile } from '@/services/profile';

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<FeedCategory>('All');
  const [displayName, setDisplayName] = useState('You');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const [scrollToPostId, setScrollToPostId] = useState<string | null>(null);
  const feedScrollRef = useRef<ScrollView>(null);
  const postOffsetsRef = useRef<Map<string, number>>(new Map());

  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      const [profile, feedPosts] = await Promise.all([fetchCurrentProfile(), fetchFeedPosts()]);
      if (profile) {
        setCurrentUserId(profile.id);
        setDisplayName(profile.displayName);
        setAvatarUri(profile.avatarUrl);
      } else {
        setCurrentUserId(null);
      }
      setPosts(feedPosts);
    } catch (err) {
      Alert.alert('Feed', err instanceof Error ? err.message : 'Could not load posts.');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const pendingPostId = consumePendingFeedScrollPostId();
      if (pendingPostId) {
        setSelectedCategory('All');
        setScrollToPostId(pendingPostId);
      }
      void loadFeed();
    }, [loadFeed]),
  );

  const filteredPosts = useMemo(() => {
    if (selectedCategory === 'All') return posts;
    return posts.filter((p) => p.tag === selectedCategory);
  }, [posts, selectedCategory]);

  useEffect(() => {
    postOffsetsRef.current.clear();
  }, [filteredPosts]);

  useEffect(() => {
    if (!scrollToPostId || loading) return;

    let attempts = 0;
    const tryScroll = () => {
      const offsetY = postOffsetsRef.current.get(scrollToPostId);
      if (offsetY != null) {
        feedScrollRef.current?.scrollTo({ y: Math.max(0, offsetY - 12), animated: true });
        setScrollToPostId(null);
        return;
      }
      attempts += 1;
      if (attempts < 12) {
        setTimeout(tryScroll, 80);
      } else {
        setScrollToPostId(null);
      }
    };

    tryScroll();
  }, [scrollToPostId, loading, filteredPosts]);

  const onShare = useCallback(() => {
    router.push('/new-post');
  }, []);

  const onLike = useCallback((postId: string) => {
    let previous: FeedPost | undefined;
    setPosts((current) =>
      current.map((post) => {
        if (post.id !== postId) return post;
        previous = post;
        if (post.likedByMe) {
          return {
            ...post,
            likedByMe: false,
            likeCount: Math.max(0, post.likeCount - 1),
          };
        }
        return {
          ...post,
          likedByMe: true,
          likeCount: post.likeCount + 1,
        };
      }),
    );
    if (!previous) return;

    const wasLiked = previous.likedByMe;
    const persist = wasLiked ? unlikeFeedPost(postId) : likeFeedPost(postId);
    void persist.catch((err) => {
      setPosts((current) =>
        current.map((post) => (post.id === postId ? previous! : post)),
      );
      Alert.alert(
        wasLiked ? 'Unlike' : 'Like',
        err instanceof Error ? err.message : wasLiked ? 'Could not unlike this post.' : 'Could not like this post.',
      );
    });
  }, []);

  const onOpenComments = useCallback((postId: string) => {
    setCommentsPostId(postId);
  }, []);

  const onCloseComments = useCallback(() => {
    setCommentsPostId(null);
  }, []);

  const onCommentAdded = useCallback((postId: string) => {
    setPosts((current) =>
      current.map((post) =>
        post.id === postId ? { ...post, commentCount: post.commentCount + 1 } : post,
      ),
    );
  }, []);

  const onDeletePost = useCallback((postId: string) => {
    void deleteFeedPost(postId)
      .then(() => {
        setPosts((current) => current.filter((post) => post.id !== postId));
        if (commentsPostId === postId) {
          setCommentsPostId(null);
        }
      })
      .catch((err) => {
        Alert.alert('Delete post', err instanceof Error ? err.message : 'Could not delete post.');
      });
  }, [commentsPostId]);

  return (
    <LinearGradient
      colors={[ChecklistDesign.gradientTop, ChecklistDesign.gradientBottom]}
      style={styles.gradient}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable
          style={styles.userRow}
          onPress={() => router.push('/profile')}
          accessibilityRole="button"
          accessibilityLabel="Open profile">
          <ProfileAvatar uri={avatarUri} size={36} style={styles.profileAvatar} />
          <Text style={styles.username}>{displayName}</Text>
        </Pressable>
      </View>

      <Text style={styles.pageTitle}>Feed</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
        style={styles.chipsScroll}>
        {FEED_CATEGORIES.map((category) => {
          const active = category === selectedCategory;
          return (
            <Pressable
              key={category}
              onPress={() => setSelectedCategory(category)}
              style={[styles.chip, active && styles.chipActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{category}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Pressable
        style={styles.shareRow}
        onPress={onShare}
        accessibilityRole="button"
        accessibilityLabel="Share a post">
        <View style={styles.shareFab}>
          <MaterialIcons name="add" size={28} color="#FFFFFF" />
        </View>
        <Text style={styles.shareLabel}>Share</Text>
      </Pressable>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={ChecklistDesign.textMuted} />
        </View>
      ) : (
        <ScrollView
          ref={feedScrollRef}
          style={styles.feedScroll}
          contentContainerStyle={[styles.feedContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}>
          {filteredPosts.length === 0 ? (
            <Text style={styles.emptyText}>No posts in this category yet.</Text>
          ) : (
            filteredPosts.map((post) => (
              <View
                key={post.id}
                onLayout={(event) => {
                  postOffsetsRef.current.set(post.id, event.nativeEvent.layout.y);
                }}>
                <FeedPostCard
                  post={post}
                  isOwnPost={currentUserId !== null && post.authorId === currentUserId}
                  onLike={() => onLike(post.id)}
                  onComment={() => onOpenComments(post.id)}
                  onDelete={() => onDeletePost(post.id)}
                />
              </View>
            ))
          )}
        </ScrollView>
      )}

      <CommentsSheet
        visible={commentsPostId !== null}
        postId={commentsPostId ?? ''}
        currentUserAvatarUri={avatarUri}
        onClose={onCloseComments}
        onCommentAdded={onCommentAdded}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: 20,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: ChecklistDesign.textPrimary,
  },
  pageTitle: {
    marginTop: 16,
    marginBottom: 14,
    textAlign: 'center',
    fontSize: 34,
    fontWeight: '800',
    color: ChecklistDesign.textPrimary,
    letterSpacing: -0.5,
  },
  chipsScroll: {
    flexGrow: 0,
    marginBottom: 16,
  },
  chipsRow: {
    paddingHorizontal: 20,
    gap: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  chipActive: {
    backgroundColor: '#E8D4B0',
    borderColor: '#D4BC8E',
  },
  chipText: {
    fontSize: 15,
    fontWeight: '600',
    color: ChecklistDesign.textMuted,
  },
  chipTextActive: {
    color: ChecklistDesign.textPrimary,
    fontWeight: '700',
  },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 18,
  },
  shareFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2F80ED',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 4,
  },
  shareLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: ChecklistDesign.textPrimary,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedScroll: {
    flex: 1,
  },
  feedContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 15,
    color: ChecklistDesign.textMuted,
    marginTop: 24,
  },
});
