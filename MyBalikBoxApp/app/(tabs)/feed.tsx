import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DiscoverAvatar } from '@/components/discover/avatar';
import {
  DiscoverCategoryPills,
  type DiscoverCategoryFilter,
} from '@/components/discover/category-pills';
import { DiscoverCommentsSheet } from '@/components/discover/comments-sheet';
import { DiscoverNewPostModal } from '@/components/discover/new-post-modal';
import { DiscoverPostCard } from '@/components/discover/post-card';
import { ChecklistDesign } from '@/constants/checklist-design';
import {
  createDiscoverComment,
  createDiscoverPost,
  fetchCurrentProfileSummary,
  fetchDiscoverComments,
  fetchDiscoverPosts,
  toggleDiscoverPostLike,
  type CreateDiscoverPostInput,
  type DiscoverComment,
  type DiscoverPost,
} from '@/services/discover-feed';
import type { ProfileSummary } from '@/services/profiles';

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const [viewer, setViewer] = useState<ProfileSummary | null>(null);
  const [posts, setPosts] = useState<DiscoverPost[]>([]);
  const [filter, setFilter] = useState<DiscoverCategoryFilter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [posting, setPosting] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<DiscoverComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const loadFeed = useCallback(
    async (nextFilter: DiscoverCategoryFilter, opts?: { refreshing?: boolean }) => {
      if (opts?.refreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        setError(null);
        const category = nextFilter === 'all' ? undefined : nextFilter;
        const [viewerProfile, feedPosts] = await Promise.all([
          fetchCurrentProfileSummary(),
          fetchDiscoverPosts(category),
        ]);
        setViewer(viewerProfile);
        setPosts(feedPosts);
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : 'Could not load the feed.';
        setError(message);
        setPosts([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadFeed(filter);
  }, [filter, loadFeed]);

  const selectedPost = useMemo(
    () => posts.find((post) => post.id === selectedPostId) ?? null,
    [posts, selectedPostId],
  );

  const onRefresh = useCallback(async () => {
    await loadFeed(filter, { refreshing: true });
  }, [filter, loadFeed]);

  const onLikePress = useCallback(async (post: DiscoverPost) => {
    const nextLiked = !post.viewerHasLiked;
    setPosts((prev) =>
      prev.map((entry) =>
        entry.id === post.id
          ? {
              ...entry,
              viewerHasLiked: nextLiked,
              likeCount: Math.max(0, entry.likeCount + (nextLiked ? 1 : -1)),
            }
          : entry,
      ),
    );

    try {
      await toggleDiscoverPostLike(post.id, nextLiked);
    } catch (likeError) {
      setPosts((prev) =>
        prev.map((entry) =>
          entry.id === post.id
            ? {
                ...entry,
                viewerHasLiked: post.viewerHasLiked,
                likeCount: post.likeCount,
              }
            : entry,
        ),
      );

      Alert.alert('Could not update like', likeError instanceof Error ? likeError.message : 'Try again.');
    }
  }, []);

  const openComments = useCallback(async (post: DiscoverPost) => {
    setSelectedPostId(post.id);
    setCommentsOpen(true);
    setCommentsLoading(true);
    setComments([]);
    setCommentDraft('');

    try {
      const rows = await fetchDiscoverComments(post.id);
      setComments(rows);
    } catch (commentsError) {
      Alert.alert(
        'Could not load comments',
        commentsError instanceof Error ? commentsError.message : 'Try again.',
      );
    } finally {
      setCommentsLoading(false);
    }
  }, []);

  const submitComment = useCallback(async () => {
    if (!selectedPost || !commentDraft.trim()) return;

    setCommentSubmitting(true);
    try {
      const nextComment = await createDiscoverComment(selectedPost.id, commentDraft);
      setComments((prev) => [...prev, nextComment]);
      setPosts((prev) =>
        prev.map((entry) =>
          entry.id === selectedPost.id ? { ...entry, commentCount: entry.commentCount + 1 } : entry,
        ),
      );
      setCommentDraft('');
    } catch (commentError) {
      Alert.alert(
        'Could not add comment',
        commentError instanceof Error ? commentError.message : 'Try again.',
      );
    } finally {
      setCommentSubmitting(false);
    }
  }, [commentDraft, selectedPost]);

  const submitPost = useCallback(
    async (input: CreateDiscoverPostInput) => {
      setPosting(true);
      try {
        const post = await createDiscoverPost(input);
        setPosts((prev) => {
          if (filter !== 'all' && post.category !== filter) {
            return prev;
          }
          return [post, ...prev];
        });
        setComposerOpen(false);
      } catch (postError) {
        Alert.alert('Could not share post', postError instanceof Error ? postError.message : 'Try again.');
      } finally {
        setPosting(false);
      }
    },
    [filter],
  );

  return (
    <LinearGradient
      colors={['#F0C66C', '#F7E5BC', '#F9F0DE']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.gradient}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 18,
          paddingHorizontal: 12,
          paddingBottom: 132,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={ChecklistDesign.accentOrange}
          />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.headerRow}>
              <View style={styles.viewerWrap}>
                <DiscoverAvatar
                  name={viewer?.displayName ?? 'User'}
                  avatarUrl={viewer?.avatarUrl}
                  size={34}
                />
                <Text style={styles.viewerName} numberOfLines={1}>
                  {viewer?.displayName ?? 'You'}
                </Text>
              </View>
              <Text style={styles.title}>Feed</Text>
              <View style={styles.headerSpacer} />
            </View>

            <DiscoverCategoryPills value={filter} onChange={setFilter} />

            <Pressable
              onPress={() => setComposerOpen(true)}
              style={styles.shareRow}
              accessibilityRole="button"
              accessibilityLabel="Create a new post">
              <View style={styles.shareIcon}>
                <MaterialIcons name="add" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.shareText}>Share</Text>
            </Pressable>

            {error ? (
              <View style={styles.banner}>
                <Text style={styles.bannerText}>{error}</Text>
                <Pressable onPress={() => void loadFeed(filter)} accessibilityRole="button">
                  <Text style={styles.bannerAction}>Retry</Text>
                </Pressable>
              </View>
            ) : null}

            {loading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={ChecklistDesign.accentOrange} size="large" />
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>No posts yet</Text>
              <Text style={styles.emptyText}>Share the first Balikbayan box story to start the feed.</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <DiscoverPostCard post={item} onLikePress={onLikePress} onCommentPress={openComments} />
        )}
      />

      <DiscoverNewPostModal
        visible={composerOpen}
        submitting={posting}
        onClose={() => setComposerOpen(false)}
        onSubmit={submitPost}
      />

      <DiscoverCommentsSheet
        visible={commentsOpen}
        post={selectedPost}
        viewerName={viewer?.displayName ?? 'You'}
        viewerAvatarUrl={viewer?.avatarUrl}
        comments={comments}
        loading={commentsLoading}
        submitting={commentSubmitting}
        draft={commentDraft}
        onDraftChange={setCommentDraft}
        onClose={() => setCommentsOpen(false)}
        onSubmit={() => void submitComment()}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  viewerWrap: {
    width: 118,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewerName: {
    flex: 1,
    color: ChecklistDesign.textPrimary,
    fontSize: 14,
    fontWeight: '400',
  },
  title: {
    color: ChecklistDesign.textPrimary,
    fontSize: 24,
    fontWeight: '500',
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 118,
  },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
    marginBottom: 26,
    marginLeft: 2,
  },
  shareIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#6E95A6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  shareText: {
    color: ChecklistDesign.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.78)',
  },
  bannerText: {
    flex: 1,
    color: ChecklistDesign.textPrimary,
  },
  bannerAction: {
    color: '#8B5924',
    fontWeight: '800',
  },
  loadingWrap: {
    paddingVertical: 40,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 42,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: ChecklistDesign.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  emptyText: {
    marginTop: 10,
    color: ChecklistDesign.textMuted,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
  },
});
