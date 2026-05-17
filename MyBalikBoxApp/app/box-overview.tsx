import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { formatCapacityKg } from '@/constants/box-metrics';
import { fetchBoxMemberDisplayRows } from '@/services/box-member-display';
import { resolveActiveBoxId } from '@/services/checklist-items';
import { finalizeBox } from '@/services/finalize-box';
import { supabase } from '@/services/supabase';
import { groupRowsByCategory } from '@/utils/checklist-categories';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type ItemRow = {
  id: string;
  name: string;
  category: string | null;
  quantity: number | null;
  status: 'planned' | 'purchased' | 'packed' | 'removed';
  reference_price: number | null;
};

function initialFromDisplayName(displayName: string): string {
  const t = displayName.trim();
  if (!t) return '?';
  return t.slice(0, 1).toUpperCase();
}

function statusChip(status: ItemRow['status']): string {
  if (status === 'planned') return 'Planned';
  if (status === 'purchased') return 'Purchased';
  if (status === 'packed') return 'Packed';
  return status;
}

export default function BoxOverviewScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [noBoxId, setNoBoxId] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [boxTitle, setBoxTitle] = useState('');
  const [budgetCapUsd, setBudgetCapUsd] = useState<number | null>(null);
  const [weightCapKg, setWeightCapKg] = useState<number | null>(null);

  const [spentUsd, setSpentUsd] = useState(0);
  const [totalQty, setTotalQty] = useState(0);
  const [includedQty, setIncludedQty] = useState(0);

  const [contributors, setContributors] = useState<
    Array<{ userId: string; initial: string; name: string }>
  >([]);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [activeBoxId, setActiveBoxId] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);

  const categoryGroups = useMemo(() => groupRowsByCategory(items), [items]);

  const packingPercent = totalQty > 0 ? Math.round((includedQty / totalQty) * 100) : 0;

  const budgetRemainingUsd =
    budgetCapUsd != null && Number.isFinite(budgetCapUsd) ? Math.max(0, budgetCapUsd - spentUsd) : null;

  const budgetRemainingRatio =
    budgetCapUsd != null && budgetCapUsd > 0 ? (budgetRemainingUsd ?? 0) / budgetCapUsd : 1;

  const loadOverview = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const boxId = await resolveActiveBoxId();
      setActiveBoxId(boxId);
      if (!boxId) {
        setNoBoxId(true);
        setBoxTitle('');
        setBudgetCapUsd(null);
        setWeightCapKg(null);
        setContributors([]);
        setItems([]);
        setSpentUsd(0);
        setTotalQty(0);
        setIncludedQty(0);
        return;
      }
      setNoBoxId(false);

      const authRes = await supabase.auth.getUser();

      let boxRes = await supabase
        .from('boxes')
        .select('title, budget_cap_usd, weight_cap_kg')
        .eq('id', boxId)
        .maybeSingle();
      if (boxRes.error) {
        boxRes = await supabase.from('boxes').select('title').eq('id', boxId).maybeSingle();
      }
      if (boxRes.error) throw boxRes.error;
      const box = boxRes.data;

      const title = box?.title?.trim() || 'Balikbayan Box';
      setBoxTitle(title);

      const capUsd =
        typeof box?.budget_cap_usd === 'number' && Number.isFinite(box.budget_cap_usd)
          ? box.budget_cap_usd
          : null;
      const capKg =
        typeof box?.weight_cap_kg === 'number' && Number.isFinite(box.weight_cap_kg)
          ? box.weight_cap_kg
          : null;
      setBudgetCapUsd(capUsd);
      setWeightCapKg(capKg);

      const userId = authRes.data.user?.id ?? null;

      const { data: checklistRows, error: itemsErr } = await supabase
        .from('box_checklist_items')
        .select('id, name, category, quantity, status, reference_price')
        .eq('box_id', boxId)
        .neq('status', 'removed');
      if (itemsErr) throw itemsErr;

      const rows = (checklistRows ?? []) as ItemRow[];
      setItems(rows);

      let tQty = 0;
      let iQty = 0;
      let spent = 0;
      for (const row of rows) {
        const q = Number(row.quantity ?? 1);
        if (!Number.isFinite(q) || q < 0) continue;
        tQty += q;
        if (row.status === 'purchased' || row.status === 'packed') iQty += q;
        spent += Math.max(0, Number(row.reference_price ?? 0)) * q;
      }
      setTotalQty(tQty);
      setIncludedQty(iQty);
      setSpentUsd(spent);

      try {
        const memberRows = await fetchBoxMemberDisplayRows(boxId, userId);
        setContributors(
          memberRows.map((r) => ({
            userId: r.userId,
            initial: initialFromDisplayName(r.displayName),
            name: r.displayName,
          })),
        );
      } catch {
        const { data: idsOnly } = await supabase.from('box_members').select('user_id').eq('box_id', boxId);
        setContributors(
          (idsOnly ?? []).map((m) => ({
            userId: m.user_id,
            initial: m.user_id === userId ? 'Y' : 'M',
            name: m.user_id === userId ? 'You' : 'Member',
          })),
        );
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not load box overview.';
      setLoadError(msg);
      console.warn('Box overview load failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadOverview();
    }, [loadOverview]),
  );

  const onProceedToFinalize = useCallback(async () => {
    if (!activeBoxId || finalizing) return;
    setFinalizing(true);
    try {
      await finalizeBox(activeBoxId);
      router.push('/box-finalized');
    } catch (e) {
      Alert.alert(
        'Could not finalize box',
        e instanceof Error ? e.message : 'Please try again.',
      );
    } finally {
      setFinalizing(false);
    }
  }, [activeBoxId, finalizing, router]);

  const toggleCategory = useCallback((slug: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => ({ ...prev, [slug]: !prev[slug] }));
  }, []);

  const subtitle = boxTitle.trim() ? `${boxTitle.trim()} Summary` : 'Balikbayan Box Summary';

  const budgetPrimaryLabel =
    budgetCapUsd != null && budgetCapUsd > 0 ? `$${Math.round(budgetRemainingUsd ?? 0)}` : `$${Math.round(spentUsd)}`;

  const budgetCaption =
    budgetCapUsd != null && budgetCapUsd > 0
      ? `remaining of $${Math.round(budgetCapUsd)}`
      : spentUsd > 0
        ? 'estimated from checklist prices'
        : 'add prices on items for an estimate';

  const capacityPrimaryLabel = formatCapacityKg(weightCapKg);

  const capacityCaption =
    weightCapKg != null && weightCapKg > 0
      ? 'capacity for this box'
      : 'set capacity when creating the box';

  let body: ReactNode;
  if (loading) {
    body = (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color={ChecklistDesign.accentOrange} />
      </View>
    );
  } else if (loadError) {
    body = (
      <View style={styles.emptyBlock}>
        <Text style={styles.emptyText}>{loadError}</Text>
        <Pressable onPress={() => void loadOverview()} style={styles.retryBtn} accessibilityRole="button">
          <Text style={styles.retryBtnText}>Retry</Text>
        </Pressable>
      </View>
    );
  } else if (noBoxId) {
    body = (
      <View style={styles.emptyBlock}>
        <Text style={styles.emptyText}>
          Join or create a box to see overview. Items you add appear under Category Breakdown.
        </Text>
        <Pressable
          onPress={() => router.push('/create-box')}
          style={styles.retryBtn}
          accessibilityRole="button">
          <Text style={styles.retryBtnText}>Create box</Text>
        </Pressable>
      </View>
    );
  } else {
    body = (
      <>
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Packing Progress</Text>
            <Text style={styles.percentText}>{packingPercent}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${packingPercent}%` }]} />
          </View>
          <Text style={styles.mutedCaption}>
            {totalQty > 0
              ? `${includedQty} of ${totalQty} item${totalQty !== 1 ? 's' : ''} packed or purchased`
              : 'No checklist items yet.'}
          </Text>
        </View>

        <View style={styles.rowTwo}>
          <View style={[styles.card, styles.halfCard]}>
            <Text style={styles.smallCardTitle}>Budget</Text>
            <Text style={styles.orangeValue}>{budgetPrimaryLabel}</Text>
            {budgetCapUsd != null && budgetCapUsd > 0 ? (
              <View style={styles.miniTrack}>
                <View style={[styles.miniFill, { width: `${Math.min(1, Math.max(0, budgetRemainingRatio)) * 100}%` }]} />
              </View>
            ) : null}
            <Text style={styles.smallCaption}>{budgetCaption}</Text>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: ChecklistDesign.accentOrange }]} />
              <Text style={styles.legendText}>${Math.round(spentUsd)} spent</Text>
            </View>
          </View>

          <View style={[styles.card, styles.halfCard]}>
            <Text style={styles.smallCardTitle}>Capacity</Text>
            <Text style={styles.orangeValue}>{capacityPrimaryLabel}</Text>
            <Text style={styles.smallCaption}>{capacityCaption}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Contributors</Text>
        {contributors.length ? (
          <View style={styles.contributorsRow}>
            {contributors.map((c) => (
              <View key={c.userId} style={styles.avatarWrap}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarInitial}>{c.initial}</Text>
                </View>
                <Text style={styles.avatarName} numberOfLines={1}>
                  {c.name}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.mutedInline}>No contributors loaded yet.</Text>
        )}

        <Text style={styles.sectionLabel}>Category Breakdown</Text>
        <View style={styles.categoryBlock}>
          {categoryGroups.length === 0 ? (
            <View style={[styles.categoryCard, styles.flatCardPadding]}>
              <Text style={styles.categoryMuted}>Nothing in the checklist yet — add items to see categories.</Text>
            </View>
          ) : (
            categoryGroups.map((group) => {
              const slug = encodeURIComponent(group.category);
              const isOpen = expanded[slug];
              const count = group.items.reduce((acc, row) => acc + Number(row.quantity ?? 1), 0);
              return (
                <View key={slug} style={styles.categoryCard}>
                  <Pressable
                    onPress={() => toggleCategory(slug)}
                    style={styles.categoryHeader}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: isOpen }}>
                    <Text style={styles.categoryTitle}>
                      {group.category} ({count})
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
                      {group.items.map((item) => {
                        const q = Number(item.quantity ?? 1);
                        const qtyLabel = Number.isFinite(q) && q !== 1 ? ` × ${q}` : '';
                        return (
                          <View key={item.id} style={styles.breakdownRow}>
                            <Text style={styles.breakdownName} numberOfLines={2}>
                              {item.name}
                              {qtyLabel}
                            </Text>
                            <Text style={styles.breakdownStatus}>{statusChip(item.status)}</Text>
                          </View>
                        );
                      })}
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
        </View>

        <Pressable
          onPress={() => void onProceedToFinalize()}
          disabled={finalizing}
          style={({ pressed }) => [
            styles.primaryButton,
            (pressed || finalizing) && { opacity: 0.92 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Proceed to finalize box">
          {finalizing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <MaterialIcons name="check-circle" size={22} color="#FFFFFF" />
          )}
          <Text style={styles.primaryButtonText}>
            {finalizing ? 'Finalizing…' : 'Proceed to Finalize Box'}
          </Text>
        </Pressable>
      </>
    );
  }

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
        <Text style={styles.subtitle}>{subtitle}</Text>

        {body}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  loaderWrap: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBlock: {
    paddingVertical: 24,
    gap: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: ChecklistDesign.textMuted,
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 8,
  },
  mutedInline: {
    fontSize: 14,
    color: ChecklistDesign.textMuted,
    marginBottom: 20,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: ChecklistDesign.tanButton,
  },
  retryBtnText: { fontWeight: '800', fontSize: 15, color: ChecklistDesign.textPrimary },
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
  flatCardPadding: {
    paddingVertical: 18,
    paddingHorizontal: 18,
  },
  categoryMuted: { fontSize: 14, color: ChecklistDesign.textMuted },
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
    gap: 10,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EDE7DE',
  },
  breakdownName: {
    flex: 1,
    fontSize: 14,
    color: ChecklistDesign.textPrimary,
    fontWeight: '500',
    lineHeight: 19,
  },
  breakdownStatus: {
    fontSize: 12,
    fontWeight: '700',
    color: ChecklistDesign.textMuted,
  },
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