import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

type HomeBoxIconProps = {
  /** `widget` matches the home screen box chip; `hero` scales up for success screens. */
  size?: 'widget' | 'hero';
  showHeart?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Box illustration used on the home widget (📦 in rounded wrap). */
export function HomeBoxIcon({ size = 'widget', showHeart = false, style }: HomeBoxIconProps) {
  const isHero = size === 'hero';

  return (
    <View style={[styles.root, isHero && styles.rootHero, style]}>
      {showHeart ? <Text style={[styles.heart, isHero && styles.heartHero]}>❤️</Text> : null}
      <View style={[styles.wrap, isHero && styles.wrapHero]}>
        <Text style={[styles.emoji, isHero && styles.emojiHero]}>📦</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rootHero: {
    marginBottom: 8,
  },
  heart: {
    fontSize: 28,
    position: 'absolute',
    top: -8,
    zIndex: 2,
  },
  heartHero: {
    fontSize: 44,
    top: -12,
  },
  wrap: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapHero: {
    width: 120,
    height: 120,
    borderRadius: 28,
  },
  emoji: {
    fontSize: 40,
  },
  emojiHero: {
    fontSize: 72,
  },
});
