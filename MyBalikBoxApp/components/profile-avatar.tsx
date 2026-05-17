import { Image } from 'expo-image';
import type { StyleProp, ViewStyle } from 'react-native';

const DEFAULT_PROFILE_AVATAR = require('@/assets/images/default-profile-avatar.png');

type ProfileAvatarProps = {
  uri?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function ProfileAvatar({ uri, size = 100, style }: ProfileAvatarProps) {
  const dimension = { width: size, height: size, borderRadius: size / 2 };

  return (
    <Image
      source={uri ? { uri } : DEFAULT_PROFILE_AVATAR}
      style={[dimension, style]}
      contentFit="cover"
    />
  );
}
