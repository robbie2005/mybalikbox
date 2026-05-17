import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CaptionEditor } from '@/components/new-post/caption-editor';
import { VideoPreview } from '@/components/new-post/video-preview';
import { ChecklistDesign } from '@/constants/checklist-design';
import type { FeedPostCategory } from '@/constants/feed';
import { createFeedPost } from '@/services/feed-posts';
import { takePendingPostMedia } from '@/services/pending-post-media';

const CATEGORIES = ['Family', 'Culture', 'Gratitude'] as const;
type Category = (typeof CATEGORIES)[number];

/** Fixed preview size on the finalize post screen (photos and videos). */
const COMPOSE_MEDIA_HEIGHT = 340;

export default function NewPostComposeScreen() {
  const insets = useSafeAreaInsets();
  const [pendingMedia] = useState(() => takePendingPostMedia());
  const mediaUri = pendingMedia?.uri ?? '';
  const mediaType = pendingMedia?.mediaType ?? 'photo';

  const [caption, setCaption] = useState('');
  const [captionDraft, setCaptionDraft] = useState('');
  const [captionEditorOpen, setCaptionEditorOpen] = useState(false);
  const [category, setCategory] = useState<Category | null>(null);
  const [sharing, setSharing] = useState(false);

  const openCaptionEditor = () => {
    setCaptionDraft(caption);
    setCaptionEditorOpen(true);
  };

  const closeCaptionEditor = () => {
    setCaption(captionDraft);
    setCaptionEditorOpen(false);
  };

  const onShare = async () => {
    if (!mediaUri || sharing) return;

    const postCategory: FeedPostCategory = category ?? 'Family';

    setSharing(true);
    try {
      await createFeedPost({
        localMediaUri: mediaUri,
        caption,
        category: postCategory,
        mediaType,
        assetId: pendingMedia?.assetId,
      });
      router.replace('/(tabs)/feed');
    } catch (err) {
      Alert.alert('Could not share', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSharing(false);
    }
  };

  if (!mediaUri) {
    return (
      <LinearGradient
        colors={[ChecklistDesign.gradientTop, ChecklistDesign.gradientBottom]}
        style={styles.gradient}>
        <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
          <View style={styles.header}>
            <Pressable style={styles.headerIconBtn} onPress={() => router.back()} accessibilityRole="button">
              <MaterialIcons name="arrow-back" size={26} color={ChecklistDesign.textPrimary} />
            </Pressable>
            <Text style={styles.headerTitle}>New Post</Text>
            <View style={styles.headerIconBtn} />
          </View>
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No media selected.</Text>
          </View>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[ChecklistDesign.gradientTop, ChecklistDesign.gradientBottom]}
      style={styles.gradient}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}>
      <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
        <View style={styles.header}>
          <Pressable
            style={styles.headerIconBtn}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <MaterialIcons name="arrow-back" size={26} color={ChecklistDesign.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>New Post</Text>
          <View style={styles.headerIconBtn} />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={styles.mediaFrame}>
            {mediaType === 'video' ? (
              <VideoPreview key={mediaUri} uri={mediaUri} style={styles.mediaFill} contentFit="cover" />
            ) : (
              <Image source={{ uri: mediaUri }} style={styles.mediaFill} contentFit="cover" />
            )}
          </View>

          <Pressable
            style={styles.captionPressable}
            onPress={openCaptionEditor}
            accessibilityRole="button"
            accessibilityLabel="Add a caption">
            <Text style={[styles.captionText, !caption && styles.captionPlaceholder]}>
              {caption || 'Add a caption...'}
            </Text>
          </Pressable>

          <Pressable
            style={styles.row}
            onPress={() => Alert.alert('Invite Collaborator', 'Coming soon.')}
            accessibilityRole="button">
            <MaterialIcons name="badge" size={22} color={ChecklistDesign.textPrimary} />
            <Text style={styles.rowLabel}>Invite Collaborator</Text>
            <MaterialIcons name="chevron-right" size={22} color={ChecklistDesign.textPrimary} />
          </Pressable>

          <View style={styles.categorySection}>
            <Text style={styles.categoryLabel}>Category</Text>
            <View style={styles.categoryChips}>
              {CATEGORIES.map((item) => {
                const active = category === item;
                return (
                  <Pressable
                    key={item}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setCategory(active ? null : item)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable
            style={[styles.shareButton, sharing && styles.shareButtonDisabled]}
            onPress={() => void onShare()}
            disabled={sharing}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Share post">
            {sharing ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.shareButtonText}>Share</Text>
            )}
          </Pressable>
        </View>
      </View>

      <CaptionEditor
        visible={captionEditorOpen}
        value={captionDraft}
        onChange={setCaptionDraft}
        onClose={closeCaptionEditor}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ChecklistDesign.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 16,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    alignItems: 'center',
  },
  shareButton: {
    width: '100%',
    maxWidth: 280,
    height: 27,
    borderRadius: 8,
    backgroundColor: '#557E8F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonDisabled: {
    opacity: 0.7,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  mediaFrame: {
    width: '100%',
    height: COMPOSE_MEDIA_HEIGHT,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#D4D0C8',
  },
  mediaFill: {
    width: '100%',
    height: '100%',
  },
  captionPressable: {
    minHeight: 44,
    paddingVertical: 4,
    justifyContent: 'center',
  },
  captionText: {
    fontSize: 16,
    lineHeight: 22,
    color: ChecklistDesign.textPrimary,
  },
  captionPlaceholder: {
    color: ChecklistDesign.textMuted,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: ChecklistDesign.textPrimary,
  },
  categorySection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 8,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: ChecklistDesign.textPrimary,
    marginTop: 8,
  },
  categoryChips: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: ChecklistDesign.card,
  },
  chipActive: {
    backgroundColor: ChecklistDesign.textPrimary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: ChecklistDesign.textPrimary,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: ChecklistDesign.textMuted,
  },
});
