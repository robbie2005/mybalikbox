import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CaptionEditor } from '@/components/new-post/caption-editor';
import { VideoPreview } from '@/components/new-post/video-preview';
import { ChecklistDesign } from '@/constants/checklist-design';

const CATEGORIES = ['Family', 'Culture', 'Gratitude'] as const;
type Category = (typeof CATEGORIES)[number];

export default function NewPostComposeScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    mediaUri?: string;
    mediaType?: string;
  }>();

  const mediaUri = typeof params.mediaUri === 'string' ? params.mediaUri : '';
  const mediaType = params.mediaType === 'video' ? 'video' : 'photo';

  const [caption, setCaption] = useState('');
  const [captionDraft, setCaptionDraft] = useState('');
  const [captionEditorOpen, setCaptionEditorOpen] = useState(false);
  const [category, setCategory] = useState<Category | null>(null);
  const [mediaAspect, setMediaAspect] = useState(1);

  const openCaptionEditor = () => {
    setCaptionDraft(caption);
    setCaptionEditorOpen(true);
  };

  const closeCaptionEditor = () => {
    setCaption(captionDraft);
    setCaptionEditorOpen(false);
  };

  const onNext = () => {
    Alert.alert('Post', 'Sharing your post is coming soon.');
  };

  if (!mediaUri) {
    return (
      <LinearGradient
        colors={[ChecklistDesign.gradientTop, ChecklistDesign.gradientBottom]}
        style={styles.gradient}>
        <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
          <View style={styles.header}>
            <Pressable style={styles.headerIconBtn} onPress={() => router.back()} accessibilityRole="button">
              <MaterialIcons name="close" size={26} color={ChecklistDesign.textPrimary} />
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
      <View style={[styles.screen, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.header}>
          <Pressable
            style={styles.headerIconBtn}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Close">
            <MaterialIcons name="close" size={26} color={ChecklistDesign.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>New Post</Text>
          <Pressable
            style={styles.headerNextBtn}
            onPress={onNext}
            accessibilityRole="button"
            accessibilityLabel="Next">
            <Text style={styles.headerNextText}>Next</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={styles.mediaFrame}>
            {mediaType === 'video' ? (
              <VideoPreview uri={mediaUri} style={styles.mediaSquare} />
            ) : (
              <Image
                source={{ uri: mediaUri }}
                style={[styles.media, { aspectRatio: mediaAspect }]}
                contentFit="fill"
                onLoad={(event) => {
                  const { width, height } = event.source;
                  if (width > 0 && height > 0) {
                    setMediaAspect(width / height);
                  }
                }}
              />
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
  headerNextBtn: {
    minWidth: 44,
    height: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  headerNextText: {
    fontSize: 17,
    fontWeight: '700',
    color: ChecklistDesign.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 16,
  },
  mediaFrame: {
    width: '100%',
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#D4D0C8',
  },
  media: {
    width: '100%',
  },
  mediaSquare: {
    width: '100%',
    aspectRatio: 1,
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
