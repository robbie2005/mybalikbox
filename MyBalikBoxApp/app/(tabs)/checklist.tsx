import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChecklistDesign } from '@/constants/checklist-design';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type FilterTab = 'all' | 'included' | 'pending';

const FAMILY_SUBTITLE = 'Garcia Family Balikbayan Box Checklist';

const CATEGORIES = [
  { id: 'food', label: 'Food' },
  { id: 'cleaning', label: 'Cleaning & Home Care' },
  { id: 'beauty', label: 'Beauty & Health' },
  { id: 'personal', label: 'Personal Items' },
] as const;

/** Placeholder counts until Supabase wiring */
function useChecklistStats() {
  return useMemo(
    () => ({
      total: 0,
      included: 0,
      pending: 0,
      byCategory: { food: 0, cleaning: 0, beauty: 0, personal: 0 } as Record<string, number>,
    }),
    [],
  );
}

export default function SharedChecklistScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [filter, setFilter] = useState<FilterTab>('all');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const stats = useChecklistStats();

  const toggleCategory = useCallback((id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const onMenuPress = useCallback(() => {
    // Drawer / settings can plug in here
  }, []);

  const onProceed = useCallback(() => {
    router.push('/box-overview');
  }, [router]);

  return (
    <LinearGradient
      colors={[ChecklistDesign.gradientTop, ChecklistDesign.gradientBottom]}
      style={styles.gradient}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 12, paddingBottom: 120 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <View style={styles.headerSpacer} />
          <Pressable
            onPress={onMenuPress}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Open menu"
            style={styles.menuButton}>
            <MaterialIcons name="menu" size={26} color={ChecklistDesign.textPrimary} />
          </Pressable>
        </View>

        <Text style={styles.title}>Shared Checklist</Text>
        <Text style={styles.subtitle}>{FAMILY_SUBTITLE}</Text>

        <View style={styles.filterRow}>
          {(
            [
              { key: 'all' as const, label: 'All Items' },
              { key: 'included' as const, label: 'Included' },
              { key: 'pending' as const, label: 'Pending' },
            ] as const
          ).map(({ key, label }) => {
            const active = filter === key;
            return (
              <Pressable
                key={key}
                onPress={() => setFilter(key)}
                style={[styles.filterPill, active && styles.filterPillActive]}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}>
                <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Total Items</Text>
            <Text style={styles.statValue}>{stats.total}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Included</Text>
            <Text style={[styles.statValue, styles.statIncluded]}>{stats.included}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Pending</Text>
            <Text style={[styles.statValue, styles.statPending]}>{stats.pending}</Text>
          </View>
        </View>

        <View style={styles.categoryList}>
          {CATEGORIES.map((cat) => {
            const count = stats.byCategory[cat.id] ?? 0;
            const isOpen = expanded[cat.id];
            return (
              <View key={cat.id} style={styles.categoryCard}>
                <Pressable
                  onPress={() => toggleCategory(cat.id)}
                  style={styles.categoryHeader}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isOpen }}>
                  <Text style={styles.categoryTitle}>
                    {cat.label} ({count})
                  </Text>
                  <MaterialIcons
                    name="keyboard-arrow-down"
                    size={28}
                    color={ChecklistDesign.textMuted}
                    style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}
                  />
                </Pressable>
                {isOpen ? (
                  <View style={styles.categoryBody}>
                    <Text style={styles.categoryPlaceholder}>No items yet.</Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        <Pressable
          onPress={onProceed}
          style={({ pressed }) => [styles.primaryButton, pressed && { opacity: 0.92 }]}
          accessibilityRole="button"
          accessibilityLabel="Proceed to Box Overview">
          <Text style={styles.primaryButtonText}>Proceed to Box Overview</Text>
        </Pressable>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  headerSpacer: {
    flex: 1,
  },
  menuButton: {
    padding: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: ChecklistDesign.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: ChecklistDesign.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 22,
    flexWrap: 'wrap',
  },
  filterPill: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: ChecklistDesign.tabInactive,
  },
  filterPillActive: {
    backgroundColor: ChecklistDesign.tabActive,
  },
  filterPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: ChecklistDesign.textMuted,
  },
  filterPillTextActive: {
    fontWeight: '700',
    color: ChecklistDesign.textPrimary,
  },
  statsCard: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: ChecklistDesign.card,
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: '#E8E0D4',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    color: ChecklistDesign.textMuted,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: ChecklistDesign.textPrimary,
  },
  statIncluded: {
    color: ChecklistDesign.statsIncluded,
  },
  statPending: {
    color: ChecklistDesign.statsPending,
  },
  categoryList: {
    marginTop: 18,
    gap: 12,
  },
  categoryCard: {
    backgroundColor: ChecklistDesign.card,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: ChecklistDesign.textPrimary,
    flex: 1,
    paddingRight: 8,
  },
  categoryBody: {
    paddingHorizontal: 18,
    paddingBottom: 16,
    paddingTop: 0,
  },
  categoryPlaceholder: {
    fontSize: 14,
    color: ChecklistDesign.textMuted,
  },
  primaryButton: {
    marginTop: 28,
    backgroundColor: ChecklistDesign.tanButton,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: ChecklistDesign.textPrimary,
  },
});
