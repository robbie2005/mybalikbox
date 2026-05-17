import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PendingRequestCard } from '@/components/checklist/pending-request-card';
import { ChecklistDesign } from '@/constants/checklist-design';
import { subscribeChecklistChanged } from '@/services/checklist-events';
import {
  acceptChecklistItem,
  declineChecklistItem,
  deleteChecklistItemById,
  resolveActiveBoxId,
  updateChecklistItemQuantity,
} from '@/services/checklist-items';
import { supabase } from '@/services/supabase';
import { groupRowsByCategory } from '@/utils/checklist-categories';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type ChecklistRow = {
  id: string;
  name: string;
  category: string | null;
  status: 'planned' | 'purchased' | 'packed' | 'removed';
  quantity: number | null;
  added_by: string | null;
  created_at: string | null;
};

const FAMILY_SUBTITLE = 'Garcia Family Balikbayan Box Checklist';
const INCLUDED_STATUSES: ChecklistRow['status'][] = ['purchased', 'packed'];
const PENDING_STATUSES: ChecklistRow['status'][] = ['planned'];
const CATEGORY_INDENT = 14;
const ITEM_INDENT = 28;

// ── Included item row ────────────────────────────────────────────────────────
function IncludedItemCard({
  item,
  onDelete,
  onQtyChange,
}: {
  item: ChecklistRow;
  onDelete: () => void;
  onQtyChange: (qty: number) => void;
}) {
  const qty = Number(item.quantity ?? 1);

  return (
    <View style={itemStyles.card}>
      <View style={itemStyles.thumb}>
        <MaterialIcons name="inventory-2" size={22} color="#C4A87A" />
      </View>

      <View style={itemStyles.meta}>
        <Text style={itemStyles.name} numberOfLines={2}>{item.name}</Text>
        <View style={itemStyles.badge}>
          <Text style={itemStyles.badgeText}>Included</Text>
        </View>
      </View>

      <View style={itemStyles.qtyRow}>
        <Pressable
          hitSlop={10}
          style={itemStyles.qtyBtn}
          onPress={() => qty > 1 && onQtyChange(qty - 1)}>
          <Text style={itemStyles.qtyBtnText}>−</Text>
        </Pressable>
        <Text style={itemStyles.qtyNum}>{qty}</Text>
        <Pressable
          hitSlop={10}
          style={itemStyles.qtyBtn}
          onPress={() => onQtyChange(qty + 1)}>
          <Text style={itemStyles.qtyBtnText}>+</Text>
        </Pressable>
      </View>

      <Pressable hitSlop={10} onPress={onDelete}>
        <MaterialIcons name="delete-outline" size={22} color="#E05252" />
      </Pressable>
    </View>
  );
}

// ── Delete confirmation modal ─────────────────────────────────────────────────
function DeleteModal({
  visible,
  itemName,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  itemName: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={modalStyles.overlay} onPress={onCancel}>
        <Pressable style={modalStyles.card} onPress={(e) => e.stopPropagation()}>
          <View style={modalStyles.iconWrap}>
            <MaterialIcons name="delete-outline" size={32} color="#E05252" />
          </View>
          <Text style={modalStyles.title}>Delete Item?</Text>
          <Text style={modalStyles.body}>
            Are you sure you want to remove{'\n'}
            <Text style={modalStyles.bold}>{itemName}</Text>
            {'\n'}from your checklist?
          </Text>
          <View style={modalStyles.btnRow}>
            <Pressable style={modalStyles.cancelBtn} onPress={onCancel}>
              <Text style={modalStyles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={modalStyles.deleteBtn} onPress={onConfirm}>
              <Text style={modalStyles.deleteText}>Delete</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────
export default function SharedChecklistScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [rows, setRows] = useState<ChecklistRow[]>([]);
  const [displayNameByUserId, setDisplayNameByUserId] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [actionItemId, setActionItemId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [expandedSections, setExpandedSections] = useState({ included: true, pending: true });
  const [expandedCategory, setExpandedCategory] = useState<Record<string, boolean>>({});

  const loadChecklist = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true);
    try {
      const boxId = await resolveActiveBoxId();
      if (!boxId) { setRows([]); setDisplayNameByUserId({}); return; }
      const { data, error } = await supabase
        .from('box_checklist_items')
        .select('id, name, category, status, quantity, added_by, created_at')
        .eq('box_id', boxId)
        .neq('status', 'removed');
      if (error) throw error;
      const list = (data ?? []) as ChecklistRow[];
      setRows(list);
      const userIds = [...new Set(list.map((r) => r.added_by).filter((id): id is string => !!id))];
      if (userIds.length) {
        const { data: profiles, error: profilesErr } = await supabase
          .from('profiles').select('id, display_name').in('id', userIds);
        if (!profilesErr && profiles) {
          const map: Record<string, string> = {};
          for (const p of profiles) {
            const id = String((p as { id: string }).id);
            const dn = (p as { display_name: string | null }).display_name?.trim();
            if (dn) map[id] = dn;
          }
          setDisplayNameByUserId(map);
        }
      } else { setDisplayNameByUserId({}); }
    } catch (e) {
      console.warn('Failed to load checklist', e);
      setRows([]); setDisplayNameByUserId({});
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadChecklist(); }, [loadChecklist]);
  useEffect(() => {
    return subscribeChecklistChanged(() => {
      void loadChecklist({ silent: true });
    });
  }, [loadChecklist]);

  const includedItems = useMemo(() => rows.filter((r) => INCLUDED_STATUSES.includes(r.status)), [rows]);
  const pendingItems = useMemo(() => rows.filter((r) => PENDING_STATUSES.includes(r.status)), [rows]);
  const includedByCategory = useMemo(() => groupRowsByCategory(includedItems), [includedItems]);
  const pendingByCategory = useMemo(() => groupRowsByCategory(pendingItems), [pendingItems]);
  const stats = useMemo(() => ({
    total: rows.length,
    included: includedItems.length,
    pending: pendingItems.length,
  }), [rows.length, includedItems.length, pendingItems.length]);

  const contributorName = useCallback(
    (userId: string | null) => userId ? (displayNameByUserId[userId] ?? 'Member') : 'Someone',
    [displayNameByUserId],
  );

  const toggleSection = useCallback((section: 'included' | 'pending') => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }, []);

  const toggleCategory = useCallback((key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCategory((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const runItemAction = useCallback(async (itemId: string, action: 'accept' | 'decline') => {
    setActionItemId(itemId);
    try {
      if (action === 'accept') await acceptChecklistItem(itemId);
      else await declineChecklistItem(itemId);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Something went wrong.';
      Alert.alert(action === 'accept' ? 'Could not accept' : 'Could not decline', message);
    } finally { setActionItemId(null); }
  }, []);

  const handleQtyChange = useCallback(async (id: string, newQty: number) => {
    if (newQty < 1) return;
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, quantity: newQty } : r));
    try {
      await updateChecklistItemQuantity(id, newQty);
    } catch {
      void loadChecklist();
    }
  }, [loadChecklist]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    setDeleteTarget(null);
    try {
      await deleteChecklistItemById(id);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not delete item.');
    }
  }, [deleteTarget]);

  const onProceed = useCallback(() => { router.push('/box-overview'); }, [router]);

  return (
    <LinearGradient
      colors={[ChecklistDesign.gradientTop, ChecklistDesign.gradientBottom]}
      style={styles.gradient}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}>

      <DeleteModal
        visible={!!deleteTarget}
        itemName={deleteTarget?.name ?? ''}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 12, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        <View style={styles.headerRow}>
          <View style={styles.headerSpacer} />
          <Pressable hitSlop={12} accessibilityRole="button" style={styles.menuButton}>
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
            {/* ── Included ── */}
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
                  const isOpen = expandedCategory[key] ?? true;
                  return (
                    <View key={key} style={[styles.categoryCard, styles.categoryIndent]}>
                      <Pressable
                        onPress={() => toggleCategory(key)}
                        style={styles.categoryHeader}
                        accessibilityRole="button"
                        accessibilityState={{ expanded: isOpen }}>
                        <Text style={styles.categoryTitle} numberOfLines={1}>
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
                        <View style={[styles.categoryBody, styles.itemIndent]}>
                          {items.map((item) => (
                            <IncludedItemCard
                              key={item.id}
                              item={item}
                              onDelete={() => setDeleteTarget({ id: item.id, name: item.name })}
                              onQtyChange={(qty) => handleQtyChange(item.id, qty)}
                            />
                          ))}
                        </View>
                      ) : null}
                    </View>
                  );
                })
              : null}

            {/* ── Pending ── */}
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
                  const isOpen = expandedCategory[key] ?? true;
                  return (
                    <View key={key} style={[styles.categoryCard, styles.categoryIndent, styles.categoryCardPending]}>
                      <Pressable
                        onPress={() => toggleCategory(key)}
                        style={styles.categoryHeader}
                        accessibilityRole="button"
                        accessibilityState={{ expanded: isOpen }}>
                        <Text style={styles.categoryTitle} numberOfLines={1}>
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
                        <View style={[styles.pendingItemsWrap, styles.itemIndent]}>
                          {items.map((item) => (
                            <PendingRequestCard
                              key={item.id}
                              contributorName={contributorName(item.added_by)}
                              itemName={item.name}
                              quantity={Number(item.quantity ?? 1)}
                              createdAt={item.created_at}
                              busy={actionItemId === item.id}
                              onAccept={() => void runItemAction(item.id, 'accept')}
                              onDecline={() => void runItemAction(item.id, 'decline')}
                            />
                          ))}
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
          accessibilityRole="button">
          <Text style={styles.primaryButtonText}>Proceed to Box Overview</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/(tabs)/find-dropoff')}
          style={({ pressed }) => [styles.dropoffButton, pressed && { opacity: 0.85 }]}
          accessibilityRole="button">
          <MaterialIcons name="location-on" size={18} color="#FEFDF9" style={{ marginRight: 6 }} />
          <Text style={styles.dropoffButtonText}>Find Dropoff Locations</Text>
        </Pressable>
      </ScrollView>
    </LinearGradient>
  );
}

// ── Item card styles ─────────────────────────────────────────────────────────
const itemStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EDE6DC',
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#F5EDE0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: ChecklistDesign.textPrimary,
    lineHeight: 18,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E6F4EA',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3A7D52',
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F0E8DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: ChecklistDesign.textPrimary,
    lineHeight: 20,
  },
  qtyNum: {
    fontSize: 15,
    fontWeight: '700',
    color: ChecklistDesign.textPrimary,
    minWidth: 24,
    textAlign: 'center',
  },
});

// ── Delete modal styles ──────────────────────────────────────────────────────
const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 10,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 10,
  },
  body: {
    fontSize: 14,
    color: '#6B6B6B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  bold: {
    fontWeight: '700',
    color: '#1A1A1A',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  deleteBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E05252',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

// ── Screen styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  headerSpacer: { flex: 1 },
  menuButton: { padding: 4 },
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
  statCol: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statDivider: { width: StyleSheet.hairlineWidth, backgroundColor: '#E8E0D4', marginVertical: 4 },
  statLabel: { fontSize: 12, color: ChecklistDesign.textMuted, marginBottom: 6 },
  statValue: { fontSize: 28, fontWeight: '700', color: ChecklistDesign.textPrimary },
  statIncluded: { color: ChecklistDesign.statsIncluded },
  statPending: { color: ChecklistDesign.statsPending },
  loadingWrap: { marginTop: 22, alignItems: 'center', justifyContent: 'center', minHeight: 120 },
  sectionList: { marginTop: 18, gap: 12 },
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
  sectionTitle: { fontSize: 16, fontWeight: '700', color: ChecklistDesign.textPrimary },
  categoryIndent: { marginLeft: CATEGORY_INDENT },
  itemIndent: { marginLeft: ITEM_INDENT - CATEGORY_INDENT },
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
  categoryCardPending: { backgroundColor: ChecklistDesign.cream },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: ChecklistDesign.textPrimary,
    flex: 1,
    paddingRight: 8,
  },
  categoryBody: { paddingHorizontal: 16, paddingBottom: 8, paddingTop: 0 },
  pendingItemsWrap: { paddingHorizontal: 12, paddingBottom: 12, paddingTop: 0 },
  primaryButton: {
    marginTop: 28,
    backgroundColor: ChecklistDesign.tanButton,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: { fontSize: 16, fontWeight: '700', color: ChecklistDesign.textPrimary },
  dropoffButton: {
    marginTop: 12,
    marginBottom: 32,
    backgroundColor: '#D4A843',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropoffButtonText: { fontSize: 16, fontWeight: '700', color: '#FEFDF9' },
});
