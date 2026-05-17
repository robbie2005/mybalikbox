import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

type VideoPreviewProps = {
  uri: string;
  style?: StyleProp<ViewStyle>;
};

export function VideoPreview({ uri, style }: VideoPreviewProps) {
  const player = useVideoPlayer(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        await player.replaceAsync(uri);
        if (cancelled) return;
        player.loop = true;
        player.play();
      } catch {
        // Player may reject invalid URIs; surface handled by empty view upstream.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uri, player]);

  return (
    <VideoView
      style={[styles.video, style]}
      player={player}
      contentFit="contain"
      nativeControls
      fullscreenOptions={{ enable: true }}
    />
  );
}

const styles = StyleSheet.create({
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: '#D4D0C8',
  },
});
