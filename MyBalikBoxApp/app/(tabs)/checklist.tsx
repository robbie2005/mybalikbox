import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { resolveActiveBoxId } from '@/services/checklist-items';
import { supabase } from '@/services/supabase';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type ChecklistRow = {
  id: string;
  name: string;
  category: string | null;
  status: 'planned' | 'purchased' | 'packed' | 'removed';
};

const FAMILY_SUBTITLE = 'Garcia Family Balikbayan Box Checklist';

const PRIORITY_CATEGORIES = [
  'Clothing, Shoes & Jewelry',
  'Computers & Accessories',
  'Health & Household',
  'Home & Kitchen',
];

const INCLUDED_STATUSES: ChecklistRow['status'][] = ['purchased', 'packed'];
const PENDING_STATUSES: ChecklistRow['status'][] = ['planned'];

function orderCategories(categories: string[]): string[] {
  const seen = new Set(categories);
  const ordered = PRIORITY_CATEGORIES.filter((c) => seen.has(c));
  const rest = categories.filter((c) => !PRIORITY_CATEGORIES.includes(c)).sort();
  return [...ordered, ...rest];
}

function groupByCategory(rows: ChecklistRow[]): Array<{ category: string; items: ChecklistRow[] }> {
  const map = new Map<string, ChecklistRow[]>();
  for (const row of rows) {
    const category = row.category?.trim() || 'Uncategorized';
    const list = map.get(category) ?? [];
    list.push(row);
    map.set(category, list);
  }
  return orderCategories([...map.keys()]).map((category) => ({
    category,
    items: map.get(category) ?? [],
  }));
}

export default function SharedChecklistScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [rows, setRows] = useState<ChecklistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    included: true,
    pending: false,
  });
  const [expandedCategory, setExpandedCategory] = useState<Record<string, boolean>>({});

  const loadChecklist = useCallback(async () => {
    setLoading(true);
    try {
      const boxId = await resolveActiveBoxId();
      if (!boxId) {
        setRows([]);
        return;
      }
      const { data, error } = await supabase
        .from('box_checklist_items')
        .select('id, name, category, status')
        .eq('box_id', boxId)
        .neq('status', 'removed');
      if (error) throw error;
      setRows((data ?? []) as ChecklistRow[]);
    } catch (e) {
      console.warn('Failed to load checklist', e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadChecklist();
  }, [loadChecklist]);

  const includedItems = useMemo(
    () => rows.filter((r) => INCLUDED_STATUSES.includes(r.status)),
    [rows],
  );
  const pendingItems = useMemo(
    () => rows.filter((r) => PENDING_STATUSES.includes(r.status)),
    [rows],
  );

  const includedByCategory = useMemo(() => groupByCategory(includedItems), [includedItems]);
  const pendingByCategory = useMemo(() => groupByCategory(pendingItems), [pendingItems]);

  const stats = useMemo(
    () => ({
      total: rows.length,
      included: includedItems.length,
      pending: pendingItems.length,
    }),
    [rows.length, includedItems.length, pendingItems.length],
  );

  const toggleSection = useCallback((section: 'included' | 'pending') => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }, []);

  const toggleCategory = useCallback((key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCategory((prev) => ({ ...prev, [key]: !prev[key] }));
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
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 12, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <View style={styles.headerSpacer} />
          <Pressable hitSlop={12} accessibilityRole="button" accessibilityLabel="Open menu" style={styles.menuButton}>
            <MaterialIcons name="menu" size={26} color={ChecklistDesign.textPrimary} />
          </Pressable>
        </View>

        <Text style={styles.title}>Shared Checklist</Text>
        <Text style={styles.subtitle}>{FAMILY_SUBTITLE}</Text>

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

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={ChecklistDesign.accentOrange} />
          </View>
        ) : (
          <View style={styles.sectionList}>
            <View style={styles.sectionCard}>
              <Pressable
                onPress={() => toggleSection('included')}
                style={styles.sectionHeader}
                accessibilityRole="button"
                accessibilityState={{ expanded: expandedSections.included }}>
                <Text style={styles.sectionTitle}>Included Items ({stats.included})</Text>
                <MaterialIcons
                  name="keyboard-arrow-down"
                  size={24}
                  color={ChecklistDesign.textMuted}
                  style={{ transform: [{ rotate: expandedSections.included ? '180deg' : '0deg' }] }}
                />
              </Pressable>
            </View>

            {expandedSections.included
              ? includedByCategory.map(({ category, items }) => {
                  const key = `included:${category}`;
                  const isOpen = expandedCategory[key];
                  return (
                    <View key={key} style={styles.categoryCard}>
                      <Pressable
                        onPress={() => toggleCategory(key)}
                        style={styles.categoryHeader}
                        accessibilityRole="button"
                        accessibilityState={{ expanded: isOpen }}>
                        <Text style={styles.categoryTitle}>
                          {category} ({items.length})
                        </Text>
                        <MaterialIcons
                          name="keyboard-arrow-down"
                          size={24}
                          color={ChecklistDesign.textMuted}
                          style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}
                        />
                      </Pressable>
                      {isOpen ? (
                        <View style={styles.categoryBody}>
                          {items.slice(0, 5).map((item) => (
                            <Text key={item.id} style={styles.categoryItem}>
                              • {item.name}
                            </Text>
                          ))}
                          {items.length > 5 ? (
                            <Text style={styles.categoryPlaceholder}>+{items.length - 5} more</Text>
                          ) : null}
                        </View>
                      ) : null}
                    </View>
                  );
                })
              : null}

            <View style={styles.sectionCard}>
              <Pressable
                onPress={() => toggleSection('pending')}
                style={styles.sectionHeader}
                accessibilityRole="button"
                accessibilityState={{ expanded: expandedSections.pending }}>
                <Text style={styles.sectionTitle}>Pending ({stats.pending})</Text>
                <MaterialIcons
                  name="keyboard-arrow-down"
                  size={24}
                  color={ChecklistDesign.textMuted}
                  style={{ transform: [{ rotate: expandedSections.pending ? '180deg' : '0deg' }] }}
                />
              </Pressable>
            </View>

            {expandedSections.pending
              ? pendingByCategory.map(({ category, items }) => {
                  const key = `pending:${category}`;
                  const isOpen = expandedCategory[key];
                  return (
                    <View key={key} style={styles.categoryCard}>
                      <Pressable
                        onPress={() => toggleCategory(key)}
                        style={styles.categoryHeader}
                        accessibilityRole="button"
                        accessibilityState={{ expanded: isOpen }}>
                        <Text style={styles.categoryTitle}>
                          {category} ({items.length})
                        </Text>
                        <MaterialIcons
                          name="keyboard-arrow-down"
                          size={24}
                          color={ChecklistDesign.textMuted}
                          style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}
                        />
                      </Pressable>
                      {isOpen ? (
                        <View style={styles.categoryBody}>
                          {items.slice(0, 5).map((item) => (
                            <Text key={item.id} style={styles.categoryItem}>
                              • {item.name}
                            </Text>
                          ))}
                          {items.length > 5 ? (
                            <Text style={styles.categoryPlaceholder}>+{items.length - 5} more</Text>
                          ) : null}
                        </View>
                      ) : null}
                    </View>
                  );
                })
              : null}
          </View>
        )}

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
  loadingWrap: {
    marginTop: 22,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  sectionList: {
    marginTop: 18,
    gap: 12,
  },
  sectionCard: {
    backgroundColor: ChecklistDesign.card,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 24 - 8,
    fontWeight: '700',
    color: ChecklistDesign.textPrimary,
  },
  categoryCard: {
    backgroundColor: ChecklistDesign.card,
    borderRadius: 14,
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
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  categoryTitle: {
    fontSize: 25 - 9,
    fontWeight: '500',
    color: ChecklistDesign.textPrimary,
    flex: 1,
    paddingRight: 8,
  },
  categoryBody: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 0,
  },
  categoryItem: {
    fontSize: 14,
    color: ChecklistDesign.textPrimary,
    marginBottom: 6,
  },
  categoryPlaceholder: {
    fontSize: 13,
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
