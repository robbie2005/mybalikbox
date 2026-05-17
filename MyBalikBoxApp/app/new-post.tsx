import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VideoPreview } from '@/components/new-post/video-preview';
import { ZoomableMedia } from '@/components/new-post/zoomable-media';
import { ChecklistDesign } from '@/constants/checklist-design';
import { setPendingPostMedia } from '@/services/pending-post-media';
import {
  capturePhotoWithCamera,
  loadRecentMedia,
  presentLimitedLibraryPicker,
  requestMediaLibraryAccess,
  resolveMediaUriForPreview,
  type RecentMediaItem,
} from '@/services/recent-media';

const THUMB_GAP = 4;
const GRID_COLUMNS = 3;
const GRID_ROWS_VISIBLE = 2;
const GRID_HORIZONTAL_PADDING = 20;

export default function NewPostScreen() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const thumbSize = Math.floor(
    (screenWidth - GRID_HORIZONTAL_PADDING * 2 - THUMB_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS,
  );
  const gridViewportHeight = thumbSize * GRID_ROWS_VISIBLE + THUMB_GAP * (GRID_ROWS_VISIBLE - 1);

  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [limitedAccess, setLimitedAccess] = useState(false);
  const [items, setItems] = useState<RecentMediaItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const selected = items.find((item) => item.id === selectedId) ?? items[0] ?? null;

  const loadPreview = useCallback(async (item: RecentMediaItem) => {
    setPreviewLoading(true);
    try {
      const uri = await resolveMediaUriForPreview(item);
      setPreviewUri(uri);
    } catch {
      setPreviewUri(item.uri);
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  const loadLibrary = useCallback(async () => {
    setLoading(true);
    setPermissionDenied(false);
    try {
      const access = await requestMediaLibraryAccess();
      if (!access.granted) {
        setPermissionDenied(true);
        setLimitedAccess(false);
        setItems([]);
        setSelectedId(null);
        setPreviewUri(null);
        return;
      }

      setLimitedAccess(access.limited);
      const recent = await loadRecentMedia(120);
      setItems(recent);
      const first = recent[0] ?? null;
      setSelectedId(first?.id ?? null);
      if (first) {
        await loadPreview(first);
      } else {
        setPreviewUri(null);
      }
    } catch (err) {
      Alert.alert(
        'Photos unavailable',
        err instanceof Error ? err.message : 'Could not load your camera roll.',
      );
      setItems([]);
      setSelectedId(null);
      setPreviewUri(null);
    } finally {
      setLoading(false);
    }
  }, [loadPreview]);

  useEffect(() => {
    void loadLibrary();
  }, [loadLibrary]);

  const onSelectItem = useCallback(
    (item: RecentMediaItem) => {
      setSelectedId(item.id);
      void loadPreview(item);
    },
    [loadPreview],
  );

  const onOpenSettings = () => {
    void Linking.openSettings();
  };

  const onManageLimitedAccess = () => {
    void presentLimitedLibraryPicker().then(() => loadLibrary());
  };

  const onCameraPress = async () => {
    const captured = await capturePhotoWithCamera();
    if (!captured) return;
    setItems((prev) => [captured, ...prev]);
    onSelectItem(captured);
  };

  const onNext = () => {
    if (!selected || !previewUri) {
      Alert.alert('Select media', 'Choose a photo or video to continue.');
      return;
    }
<<<<<<< HEAD

    let mediaUri = previewUri;
    let mediaType: 'photo' | 'video' = selected.mediaType;

    // Photos: capture zoomed frame as snapshot. Videos: keep playable URI (view-shot of VideoView is unreliable).
    if (previewCaptureRef.current && selected.mediaType !== 'video') {
      setCapturingSnapshot(true);
      try {
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        });
        const snapshotUri = await captureRef(previewCaptureRef, {
          format: 'jpg',
          quality: 0.92,
          result: 'tmpfile',
        });
        mediaUri = snapshotUri;
        mediaType = 'photo';
      } catch {
        // Fall back to the resolved asset URI if the view snapshot fails.
      } finally {
        setCapturingSnapshot(false);
      }
    }

    setPendingPostMedia({
      uri: mediaUri,
      mediaType,
      width: selected.width,
      height: selected.height,
      assetId: selected.id,
=======
    router.push({
      pathname: '/new-post-compose',
      params: {
        mediaUri: previewUri,
        mediaType: selected.mediaType,
      },
>>>>>>> 2c0ea69 (Made changes to dropoff)
    });
    router.push('/new-post-compose');
  };

  const renderPreview = () => {
    if (loading || previewLoading) {
      return (
        <View style={styles.previewPlaceholder}>
          <ActivityIndicator size="large" color={ChecklistDesign.textMuted} />
        </View>
      );
    }

    if (permissionDenied) {
      return (
        <View style={styles.previewPlaceholder}>
          <MaterialIcons name="photo-library" size={48} color="#9A9A9A" />
          <Text style={styles.permissionText}>
            Allow photo library access to choose media. On Android, Expo Go has limited library access — use a
            development build for full camera roll support.
          </Text>
          <Pressable style={styles.permissionButton} onPress={() => void loadLibrary()}>
            <Text style={styles.permissionButtonText}>Try again</Text>
          </Pressable>
          <Pressable onPress={onOpenSettings}>
            <Text style={styles.settingsLink}>Open Settings</Text>
          </Pressable>
        </View>
      );
    }

    if (!selected || !previewUri) {
      return (
        <View style={styles.previewPlaceholder}>
          <MaterialIcons name="image" size={56} color="#B0B0B0" />
          <Text style={styles.permissionText}>No photos or videos found.</Text>
        </View>
      );
    }

    return (
      <ZoomableMedia
        key={selected.id}
        resetKey={selected.id}
        style={styles.previewMedia}>
        {selected.mediaType === 'video' ? (
          <VideoPreview uri={previewUri} style={styles.previewMediaFill} />
        ) : (
          <Image source={{ uri: previewUri }} style={styles.previewMediaFill} contentFit="contain" />
        )}
      </ZoomableMedia>
    );
  };

  const renderThumb = (item: RecentMediaItem) => {
    const active = item.id === selected?.id;
    return (
      <Pressable
        key={item.id}
        onPress={() => onSelectItem(item)}
        style={[styles.thumbWrap, { width: thumbSize, height: thumbSize }, active && styles.thumbActive]}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}>
        <Image source={{ uri: item.uri }} style={styles.thumbImage} contentFit="cover" recyclingKey={item.id} />
        {item.mediaType === 'video' ? (
          <View style={styles.videoBadge}>
            <MaterialIcons name="play-arrow" size={18} color="#FFFFFF" />
          </View>
        ) : null}
      </Pressable>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
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
          onPress={() => void onNext()}
          disabled={loading || previewLoading || !previewUri}
          accessibilityRole="button"
          accessibilityLabel="Next">
          <Text style={styles.headerNextText}>Next</Text>
        </Pressable>
      </View>

      <View style={styles.previewArea}>{renderPreview()}</View>

      <LinearGradient
        colors={[ChecklistDesign.gradientTop, ChecklistDesign.gradientBottom]}
        style={[styles.galleryPanel, { paddingBottom: insets.bottom + 12 }]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}>
        {limitedAccess ? (
          <Pressable style={styles.limitedBanner} onPress={onManageLimitedAccess}>
            <MaterialIcons name="info-outline" size={18} color={ChecklistDesign.textPrimary} />
            <Text style={styles.limitedBannerText}>
              Limited photo access — tap to select more photos
            </Text>
          </Pressable>
        ) : null}

        <View style={styles.galleryHeader}>
          <Pressable style={styles.recentsRow} accessibilityRole="button">
            <Text style={styles.recentsLabel}>Recents</Text>
            <MaterialIcons name="chevron-right" size={22} color={ChecklistDesign.textPrimary} />
          </Pressable>
          <Pressable style={styles.selectRow} accessibilityRole="button">
            <Text style={styles.selectLabel}>Select</Text>
            <MaterialIcons name="library-add-check" size={22} color={ChecklistDesign.textPrimary} />
          </Pressable>
        </View>

        {loading ? (
          <View style={[styles.galleryLoading, { height: gridViewportHeight }]}>
            <ActivityIndicator color={ChecklistDesign.textMuted} />
          </View>
        ) : (
          <ScrollView
            style={{ maxHeight: gridViewportHeight }}
            contentContainerStyle={styles.gridScrollContent}
            showsVerticalScrollIndicator
            nestedScrollEnabled>
            <View style={styles.grid}>
              <Pressable
                style={[styles.cameraTile, { width: thumbSize, height: thumbSize }]}
                onPress={() => void onCameraPress()}
                accessibilityRole="button"
                accessibilityLabel="Open camera">
                <MaterialIcons name="photo-camera" size={36} color="#FFFFFF" />
              </Pressable>
              {items.map((item) => renderThumb(item))}
            </View>
          </ScrollView>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: ChecklistDesign.gradientTop,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: ChecklistDesign.gradientTop,
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
    fontWeight: '600',
    color: ChecklistDesign.textPrimary,
  },
  previewArea: {
    flex: 1,
    backgroundColor: '#E8E4DC',
  },
  previewPlaceholder: {
    flex: 1,
    width: '100%',
    backgroundColor: '#D4D0C8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  previewMedia: {
    flex: 1,
    width: '100%',
    backgroundColor: '#D4D0C8',
  },
  previewMediaFill: {
    width: '100%',
    height: '100%',
  },
  permissionText: {
    textAlign: 'center',
    fontSize: 14,
    color: ChecklistDesign.textMuted,
    lineHeight: 20,
  },
  permissionButton: {
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: ChecklistDesign.tanButton,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  settingsLink: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    color: ChecklistDesign.textPrimary,
    textDecorationLine: 'underline',
  },
  galleryPanel: {
    paddingTop: 14,
  },
  limitedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  limitedBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: ChecklistDesign.textPrimary,
  },
  galleryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  recentsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  recentsLabel: {
    fontSize: 22,
    fontWeight: '700',
    color: ChecklistDesign.textPrimary,
  },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: ChecklistDesign.textPrimary,
  },
  galleryLoading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridScrollContent: {
    paddingHorizontal: GRID_HORIZONTAL_PADDING,
    paddingBottom: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THUMB_GAP,
  },
  cameraTile: {
    backgroundColor: '#B8B4AC',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbWrap: {
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#D8D4CC',
  },
  thumbActive: {
    borderWidth: 2,
    borderColor: ChecklistDesign.gradientTop,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  videoBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
