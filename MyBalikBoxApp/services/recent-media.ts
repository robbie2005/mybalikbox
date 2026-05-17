import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';

export type RecentMediaItem = {
  id: string;
  /** URI from the asset listing — reliable for thumbnails. */
  uri: string;
  mediaType: 'photo' | 'video';
  width: number;
  height: number;
};

export type MediaLibraryAccess = {
  granted: boolean;
  limited: boolean;
};

export async function requestMediaLibraryAccess(): Promise<MediaLibraryAccess> {
  const current = await MediaLibrary.getPermissionsAsync();
  if (current.granted) {
    return { granted: true, limited: current.accessPrivileges === 'limited' };
  }
  if (current.canAskAgain) {
    const requested = await MediaLibrary.requestPermissionsAsync();
    return {
      granted: requested.granted,
      limited: requested.accessPrivileges === 'limited',
    };
  }
  return { granted: false, limited: false };
}

export async function presentLimitedLibraryPicker(): Promise<void> {
  try {
    await MediaLibrary.presentPermissionsPickerAsync();
  } catch {
    // Unavailable in Expo Go or unsupported platform — ignore.
  }
}

function mapAsset(asset: MediaLibrary.Asset): RecentMediaItem | null {
  if (!asset.uri) return null;
  return {
    id: asset.id,
    uri: asset.uri,
    mediaType: asset.mediaType === MediaLibrary.MediaType.video ? 'video' : 'photo',
    width: asset.width,
    height: asset.height,
  };
}

export async function loadRecentMedia(limit = 120): Promise<RecentMediaItem[]> {
  const page = await MediaLibrary.getAssetsAsync({
    first: limit,
    mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
    sortBy: [[MediaLibrary.SortBy.creationTime, false]],
  });

  return page.assets.map(mapAsset).filter((item): item is RecentMediaItem => item !== null);
}

function normalizePhotoUri(uri: string): string {
  const withoutHash = uri.split('#')[0] ?? uri;
  if (withoutHash.startsWith('/') && !withoutHash.startsWith('file://')) {
    return `file://${withoutHash}`;
  }
  return withoutHash;
}

/**
 * Resolves a URI for the large preview.
 * Videos: use `uri` from MediaLibrary (not `localUri` — breaks expo-video on iOS).
 * Photos: prefer `localUri` for full resolution when available.
 */
export async function resolveMediaUriForPreview(item: RecentMediaItem): Promise<string> {
  try {
    const info = await MediaLibrary.getAssetInfoAsync(item.id, {
      shouldDownloadFromNetwork: item.mediaType === 'photo',
    });

    if (item.mediaType === 'video') {
      return info.uri ?? item.uri;
    }

    const photoUri = info.localUri ?? info.uri ?? item.uri;
    return normalizePhotoUri(photoUri);
  } catch {
    return item.uri;
  }
}

export async function capturePhotoWithCamera(): Promise<RecentMediaItem | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images', 'videos'],
    quality: 0.9,
  });

  if (result.canceled || !result.assets[0]?.uri) return null;

  const asset = result.assets[0];
  return {
    id: `camera-${Date.now()}`,
    uri: asset.uri,
    mediaType: asset.type === 'video' ? 'video' : 'photo',
    width: asset.width ?? 1,
    height: asset.height ?? 1,
  };
}
