import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
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

const SUBTITLE = 'Garcia Family Balikbayan Box Summary';

const CONTRIBUTORS = [
  { id: '1', initial: 'E', name: 'Elle' },
  { id: '2', initial: 'E', name: 'Emma' },
  { id: '3', initial: 'C', name: 'Caine' },
  { id: '4', initial: 'E', name: 'Evelyn' },
] as const;

const CATEGORY_ROWS = [
  { id: 'food', label: 'Food', count: 39 },
  { id: 'clothing', label: 'Clothing', count: 12 },
  { id: 'beauty', label: 'Beauty & Health', count: 4 },
] as const;

const PACKING_PERCENT = 0.78;
const TOTAL_ITEMS = 192;
const BUDGET_TOTAL = 300;
const BUDGET_SPENT = 120;
const WEIGHT_TOTAL_KG = 50;
const WEIGHT_USED_KG = 20;

export default function BoxOverviewScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const budgetRemaining = BUDGET_TOTAL - BUDGET_SPENT;
  const weightRemaining = WEIGHT_TOTAL_KG - WEIGHT_USED_KG;
  const budgetRemainingRatio = budgetRemaining / BUDGET_TOTAL;
  const weightRemainingRatio = weightRemaining / WEIGHT_TOTAL_KG;

  const toggleCategory = useCallback((id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

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
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.headerIcon}>
            <MaterialIcons name="arrow-back" size={26} color={ChecklistDesign.textPrimary} />
          </Pressable>
          <View style={styles.headerSpacer} />
          <Pressable
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Open menu"
            style={styles.headerIcon}>
            <MaterialIcons name="menu" size={26} color={ChecklistDesign.textPrimary} />
          </Pressable>
        </View>

        <Text style={styles.title}>Box Overview</Text>
        <Text style={styles.subtitle}>{SUBTITLE}</Text>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Packing Progress</Text>
            <Text style={styles.percentText}>{Math.round(PACKING_PERCENT * 100)}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${PACKING_PERCENT * 100}%` }]} />
          </View>
          <Text style={styles.mutedCaption}>{TOTAL_ITEMS} total items.</Text>
        </View>

        <View style={styles.rowTwo}>
          <View style={[styles.card, styles.halfCard]}>
            <Text style={styles.smallCardTitle}>Budget</Text>
            <Text style={styles.orangeValue}>${budgetRemaining}</Text>
            <View style={styles.miniTrack}>
              <View style={[styles.miniFill, { width: `${budgetRemainingRatio * 100}%` }]} />
            </View>
            <Text style={styles.smallCaption}>remaining of ${BUDGET_TOTAL}</Text>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: ChecklistDesign.accentOrange }]} />
              <Text style={styles.legendText}>${BUDGET_SPENT} spent</Text>
            </View>
          </View>

          <View style={[styles.card, styles.halfCard]}>
            <Text style={styles.smallCardTitle}>Weight</Text>
            <Text style={styles.orangeValue}>{weightRemaining}kg</Text>
            <View style={styles.miniTrack}>
              <View style={[styles.miniFill, { width: `${weightRemainingRatio * 100}%` }]} />
            </View>
            <Text style={styles.smallCaption}>remaining of {WEIGHT_TOTAL_KG}kg</Text>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: ChecklistDesign.accentOrange }]} />
              <Text style={styles.legendText}>{WEIGHT_USED_KG}kg used</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Contributors</Text>
        <View style={styles.contributorsRow}>
          {CONTRIBUTORS.map((c) => (
            <View key={c.id} style={styles.avatarWrap}>
              <View style={styles.avatar}>
                <Text style={styles.avatarInitial}>{c.initial}</Text>
              </View>
              <Text style={styles.avatarName} numberOfLines={1}>
                {c.name}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Category Breakdown</Text>
        <View style={styles.categoryBlock}>
          {CATEGORY_ROWS.map((cat) => {
            const isOpen = expanded[cat.id];
            return (
              <View key={cat.id} style={styles.categoryCard}>
                <Pressable
                  onPress={() => toggleCategory(cat.id)}
                  style={styles.categoryHeader}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isOpen }}>
                  <Text style={styles.categoryTitle}>
                    {cat.label} ({cat.count})
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
                    <Text style={styles.categoryPlaceholder}>Details coming soon.</Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        <Pressable
          onPress={() => {}}
          style={({ pressed }) => [styles.primaryButton, pressed && { opacity: 0.92 }]}
          accessibilityRole="button"
          accessibilityLabel="Proceed to finalize box">
          <MaterialIcons name="check-circle" size={22} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Proceed to Finalize Box</Text>
        </Pressable>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerIcon: { padding: 4 },
  headerSpacer: { flex: 1 },
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
    marginBottom: 20,
  },
  card: {
    backgroundColor: ChecklistDesign.card,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: ChecklistDesign.textPrimary },
  percentText: {
    fontSize: 18,
    fontWeight: '700',
    color: ChecklistDesign.accentOrange,
  },
  progressTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: ChecklistDesign.tabInactive,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: ChecklistDesign.accentOrange,
  },
  mutedCaption: {
    marginTop: 10,
    fontSize: 14,
    color: ChecklistDesign.textMuted,
  },
  rowTwo: { flexDirection: 'row', gap: 12, marginBottom: 6 },
  halfCard: { flex: 1, marginBottom: 0, minWidth: 0 },
  smallCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: ChecklistDesign.textMuted,
    marginBottom: 6,
  },
  orangeValue: {
    fontSize: 22,
    fontWeight: '700',
    color: ChecklistDesign.accentOrange,
    marginBottom: 10,
  },
  miniTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: ChecklistDesign.tabInactive,
    overflow: 'hidden',
    marginBottom: 8,
  },
  miniFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: ChecklistDesign.accentOrangeMuted,
  },
  smallCaption: {
    fontSize: 12,
    color: ChecklistDesign.textMuted,
    marginBottom: 10,
  },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: ChecklistDesign.textPrimary, fontWeight: '500' },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: ChecklistDesign.textPrimary,
    marginTop: 8,
    marginBottom: 12,
  },
  contributorsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 16,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  avatarWrap: { alignItems: 'center', width: 64 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#B0B0B0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  avatarName: {
    marginTop: 6,
    fontSize: 11,
    color: ChecklistDesign.textMuted,
    textAlign: 'center',
  },
  categoryBlock: { gap: 12, marginBottom: 8 },
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
  categoryPlaceholder: { fontSize: 14, color: ChecklistDesign.textMuted },
  primaryButton: {
    marginTop: 20,
    backgroundColor: ChecklistDesign.accentOrange,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
