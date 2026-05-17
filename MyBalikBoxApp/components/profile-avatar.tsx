import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

const DEFAULT_PROFILE_AVATAR = require('@/assets/images/default-profile-avatar.png');

type ProfileAvatarProps = {
  uri?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function ProfileAvatar({ uri, size = 100, style }: ProfileAvatarProps) {
  const [loadFailed, setLoadFailed] = useState(false);
  const dimension = { width: size, height: size, borderRadius: size / 2 };

  useEffect(() => {
    setLoadFailed(false);
  }, [uri]);

  const source = uri && !loadFailed ? { uri } : DEFAULT_PROFILE_AVATAR;

  return (
    <Image
      source={source}
      style={[dimension, style]}
      contentFit="cover"
      onError={() => setLoadFailed(true)}
    />
  );
}
