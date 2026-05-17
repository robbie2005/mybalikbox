import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  TAB_BAR_BACKGROUND_SVG,
  TAB_BAR_DESIGN_HEIGHT,
  TAB_BAR_DESIGN_WIDTH,
} from '@/components/tab-bar/tab-bar-background';

const FLOAT_ABOVE_BOTTOM = 0;
const FAB_SIZE = 56;
const FAB_CENTER_X = 204;
const ACTIVE_COLOR = '#F2C572';
const INACTIVE_COLOR = 'rgba(255, 255, 255, 0.72)';

/** Tab layout anchors from the 408×121 Figma SVG. */
const ICON_TOP_Y = 44;
const LABEL_TOP_Y = 72;
const TAB_HIT_WIDTH = 88;

type TabConfig = {
  routeName: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  centerX: number;
};

const TABS: TabConfig[] = [
  { routeName: 'index', label: 'Home', icon: 'home', centerX: 64 },
  { routeName: 'checklist', label: 'Checklist', icon: 'playlist-add-check', centerX: 136 },
  { routeName: 'feed', label: 'Feed', icon: 'forum', centerX: 269 },
  { routeName: 'profile', label: 'Profile', icon: 'person', centerX: 344 },
];

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const scale = screenWidth / TAB_BAR_DESIGN_WIDTH;
  const barHeight = screenWidth * (TAB_BAR_DESIGN_HEIGHT / TAB_BAR_DESIGN_WIDTH);
  const slotTop = (ICON_TOP_Y / TAB_BAR_DESIGN_HEIGHT) * barHeight;
  const labelGap = ((LABEL_TOP_Y - ICON_TOP_Y - 22) / TAB_BAR_DESIGN_HEIGHT) * barHeight;
  const fabSlotWidth = TAB_HIT_WIDTH;
  const fabLeft = FAB_CENTER_X * scale - fabSlotWidth / 2;
  const fabLabelMarginTop = ((LABEL_TOP_Y - FAB_SIZE) / TAB_BAR_DESIGN_HEIGHT) * barHeight;
  const addItemRouteIndex = state.routes.findIndex((r) => r.name === 'add-item');
  const isAddItemFocused = state.index === addItemRouteIndex;

  const onFabPress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/add-item');
  };

  const navigateTo = (routeName: string, routeKey: string, isFocused: boolean) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: routeKey,
      canPreventDefault: true,
    });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  };

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingBottom: insets.bottom,
          marginBottom: FLOAT_ABOVE_BOTTOM,
        },
      ]}
      pointerEvents="box-none">
      <View style={[styles.barShell, { height: barHeight, width: screenWidth }]}>
        <SvgXml xml={TAB_BAR_BACKGROUND_SVG} width={screenWidth} height={barHeight} />

        {TABS.map((tab) => {
          const routeIndex = state.routes.findIndex((r) => r.name === tab.routeName);
          if (routeIndex < 0) return null;

          const route = state.routes[routeIndex];
          const isFocused = state.index === routeIndex;
          const { options } = descriptors[route.key];
          const color = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;
          const left = tab.centerX * scale - TAB_HIT_WIDTH / 2;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? tab.label}
              onPress={() => navigateTo(route.name, route.key, isFocused)}
              style={[styles.tab, { left, width: TAB_HIT_WIDTH, top: slotTop }]}>
              <MaterialIcons name={tab.icon} size={22} color={color} />
              <Text style={[styles.tabLabel, { color, marginTop: labelGap }]}>{tab.label}</Text>
            </Pressable>
          );
        })}

        <Pressable
          onPress={onFabPress}
          style={({ pressed }) => [
            styles.fabSlot,
            {
              left: fabLeft,
              width: fabSlotWidth,
              top: 0,
              opacity: pressed ? 0.92 : 1,
              transform: [{ scale: pressed ? 0.96 : 1 }],
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Add item">
          <View style={[styles.fabIconSpacer, { height: (FAB_SIZE / TAB_BAR_DESIGN_HEIGHT) * barHeight }]} />
          <Text
            style={[
              styles.tabLabel,
              {
                color: isAddItemFocused ? ACTIVE_COLOR : INACTIVE_COLOR,
                marginTop: fabLabelMarginTop,
              },
            ]}>
            Add Item
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  barShell: {
    position: 'relative',
  },
  tab: {
    position: 'absolute',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  fabSlot: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 2,
  },
  fabIconSpacer: {
    width: FAB_SIZE,
  },
});
