import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChecklistDesign } from '@/constants/checklist-design';

const BAR_HEIGHT = 56;
const FAB_SIZE = 56;

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const onFabPress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/add-item');
  };

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={[styles.bar, { minHeight: BAR_HEIGHT }]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const color = isFocused ? ChecklistDesign.fab : '#8E8E93';

          // The center tab is rendered as an empty slot; navigation happens via the floating + button.
          if (route.name === 'add-item') {
            return <View key={route.key} style={styles.tabSlot} pointerEvents="none" />;
          }

          const iconName = (() => {
            if (route.name === 'index') return 'home';
            if (route.name === 'checklist') return 'checklist';
            if (route.name === 'feed') return 'chat-bubble-outline';
            if (route.name === 'profile') return 'person';
            return 'circle';
          })();

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              style={styles.tabSlot}>
              <MaterialIcons name={iconName as keyof typeof MaterialIcons.glyphMap} size={26} color={color} />
            </Pressable>
          );
        })}
      </View>

      <View style={styles.fabContainer} pointerEvents="box-none">
        <Pressable
          onPress={onFabPress}
          style={({ pressed }) => [
            styles.fab,
            { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.96 : 1 }] },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Add item">
          <MaterialIcons name="add" size={32} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: ChecklistDesign.navBar,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    position: 'relative',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tabSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  fabContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -FAB_SIZE / 2 + 4,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: ChecklistDesign.fab,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
});
