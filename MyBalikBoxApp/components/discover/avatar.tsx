import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  name: string;
  avatarUrl?: string | null;
  size?: number;
};

function initialsForName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? 'U').toUpperCase();
}

export function DiscoverAvatar({ name, avatarUrl, size = 34 }: Props) {
  const borderRadius = size / 2;

  if (avatarUrl) {
    return <Image source={{ uri: avatarUrl }} style={{ width: size, height: size, borderRadius }} contentFit="cover" />;
  }

  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius }]}>
      <Text style={[styles.initial, { fontSize: Math.max(12, size * 0.4) }]}>{initialsForName(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(80, 62, 36, 0.12)',
  },
  initial: {
    color: '#6B4B1C',
    fontWeight: '700',
  },
});
