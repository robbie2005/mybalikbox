export type PendingPostMedia = {
  uri: string;
  mediaType: 'photo' | 'video';
  width?: number;
  height?: number;
  /** Media Library asset id — used to resolve a readable file path for video upload. */
  assetId?: string;
};

let pending: PendingPostMedia | null = null;

/** Holds the selected media between new-post and compose (avoids huge URIs in route params). */
export function setPendingPostMedia(media: PendingPostMedia): void {
  pending = media;
}

export function takePendingPostMedia(): PendingPostMedia | null {
  const value = pending;
  pending = null;
  return value;
}
