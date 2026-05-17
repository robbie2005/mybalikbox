import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ProfileAvatar } from '@/components/profile-avatar';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FeedPostCard } from '@/components/feed/feed-post-card';
import { ChecklistDesign } from '@/constants/checklist-design';
import {
  FEED_CATEGORIES,
  MOCK_FEED_POSTS,
  type FeedCategory,
} from '@/constants/feed-mock';
import { fetchCurrentProfile } from '@/services/profile';

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<FeedCategory>('All');
  const [displayName, setDisplayName] = useState('You');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const profile = await fetchCurrentProfile();
      if (!profile) return;
      setDisplayName(profile.displayName);
      setAvatarUri(profile.avatarUrl);
    })();
  }, []);

  const filteredPosts = useMemo(() => {
    if (selectedCategory === 'All') return MOCK_FEED_POSTS;
    return MOCK_FEED_POSTS.filter((p) => p.tag === selectedCategory);
  }, [selectedCategory]);

  const onShare = useCallback(() => {
    router.push('/new-post');
  }, []);

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

      <ScrollView
        style={styles.feedScroll}
        contentContainerStyle={[styles.feedContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}>
        {filteredPosts.length === 0 ? (
          <Text style={styles.emptyText}>No posts in this category yet.</Text>
        ) : (
          filteredPosts.map((post) => (
            <FeedPostCard
              key={post.id}
              post={post}
              onLike={() => Alert.alert('Like', 'Coming soon.')}
              onComment={() => Alert.alert('Comment', 'Coming soon.')}
            />
          ))
        )}
      </ScrollView>
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
