import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChecklistDesign } from '@/constants/checklist-design';
import {
  addCustomItemToBox,
  addRecommendedItemToBox,
  deleteChecklistItemById,
  resolveActiveBoxId,
} from '@/services/checklist-items';
import {
  fetchRecommendedItems,
  type RecommendedCatalogItem,
} from '@/services/recommended-items-catalog';

const ALL_ITEMS = 'All Items';

type GridRow = { kind: 'custom' } | { kind: 'recommended'; item: RecommendedCatalogItem };

function shuffleItems<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function AddItemScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<string>(ALL_ITEMS);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categoriesMenuOpen, setCategoriesMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [lastInsertedChecklistId, setLastInsertedChecklistId] = useState<string | null>(null);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customQuantity, setCustomQuantity] = useState('1');
  const [catalog, setCatalog] = useState<RecommendedCatalogItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    setCatalogError(null);
    try {
      const rows = await fetchRecommendedItems();
      setCatalog(rows);
    } catch (e: unknown) {
      const message =
        e && typeof e === 'object' && 'message' in e && (e as { message: unknown }).message != null
          ? String((e as { message: unknown }).message)
          : e instanceof Error
            ? e.message
            : 'Could not load recommended items.';
      setCatalogError(message);
      setCatalog([]);
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const filterOptions = useMemo(() => {
    const categories = [...new Set(catalog.map((c) => c.category))].sort();
    return [ALL_ITEMS, ...categories];
  }, [catalog]);

  useEffect(() => {
    if (filter !== ALL_ITEMS && !filterOptions.includes(filter)) {
      setFilter(ALL_ITEMS);
    }
  }, [filter, filterOptions]);

  const filteredRecommended = useMemo(() => {
    let list = catalog.filter((i) => Number(i.reference_price) > 0);
    if (selectedCategories.length > 0) {
      list = list.filter((i) => selectedCategories.includes(i.category));
    } else if (filter !== ALL_ITEMS) {
      list = list.filter((i) => i.category === filter);
    } else {
      list = shuffleItems(list);
    }
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((i) => i.name.toLowerCase().includes(q));
    return list;
  }, [catalog, filter, query, selectedCategories]);

  const listData = useMemo((): GridRow[] => {
    return [{ kind: 'custom' }, ...filteredRecommended.map((item) => ({ kind: 'recommended' as const, item }))];
  }, [filteredRecommended]);

  const runWithBox = useCallback(
    async (fn: (boxId: string) => Promise<void>, opts?: { onSuccess?: () => void }) => {
      setBusy(true);
      try {
        const boxId = await resolveActiveBoxId();
        if (!boxId) {
          Alert.alert(
            'No box selected',
            'Sign in and join a box, or set EXPO_PUBLIC_ACTIVE_BOX_ID in .env to your box UUID.',
          );
          return;
        }
        await fn(boxId);
        opts?.onSuccess?.();
        Alert.alert('Added', 'Item was added to your checklist.');
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Something went wrong.';
        Alert.alert('Could not add item', message);
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  const onAddRecommended = useCallback(
    (item: RecommendedCatalogItem) => {
      void runWithBox((boxId) => addRecommendedItemToBox(item, boxId));
    },
    [runWithBox],
  );

  const onOpenCustom = useCallback(() => {
    setCustomName('');
    setCustomPrice('');
    setCustomQuantity('1');
    setCustomModalOpen(true);
  }, []);

  const closeCustomForm = useCallback(() => {
    setCustomModalOpen(false);
  }, []);

  const onSubmitCustom = useCallback(async () => {
    const name = customName.trim();
    if (!name) {
      Alert.alert('Name required', 'Enter a name for your item.');
      return;
    }

    const qtyRaw = customQuantity.trim();
    const qtyParsed = qtyRaw.length ? parseInt(qtyRaw, 10) : 1;
    if (!Number.isFinite(qtyParsed) || qtyParsed < 1) {
      Alert.alert('Invalid quantity', 'Enter a whole number of at least 1.');
      return;
    }

    let priceUsd: number | null = null;
    const priceRaw = customPrice.trim();
    if (priceRaw.length) {
      const p = parseFloat(priceRaw.replace(/[^0-9.]/g, ''));
      if (!Number.isFinite(p) || p < 0) {
        Alert.alert('Invalid price', 'Enter a valid price in USD (e.g. 5.99).');
        return;
      }
      priceUsd = p;
    }

    setBusy(true);
    try {
      const boxId = await resolveActiveBoxId();
      if (!boxId) {
        Alert.alert(
          'No box selected',
          'Sign in and join a box, or set EXPO_PUBLIC_ACTIVE_BOX_ID in .env to your box UUID.',
        );
        return;
      }
      const id = await addCustomItemToBox(boxId, {
        name,
        referencePriceUsd: priceUsd,
        quantity: qtyParsed,
      });
      setLastInsertedChecklistId(id);
      setCustomModalOpen(false);
      setCustomName('');
      setCustomPrice('');
      setCustomQuantity('1');
      setSuccessModalOpen(true);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Something went wrong.';
      Alert.alert('Could not add item', message);
    } finally {
      setBusy(false);
    }
  }, [customName, customPrice, customQuantity]);

  const onUndoSuccess = useCallback(async () => {
    if (!lastInsertedChecklistId) {
      setSuccessModalOpen(false);
      return;
    }
    setBusy(true);
    try {
      await deleteChecklistItemById(lastInsertedChecklistId);
      setLastInsertedChecklistId(null);
      setSuccessModalOpen(false);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not undo.';
      Alert.alert('Undo failed', message);
    } finally {
      setBusy(false);
    }
  }, [lastInsertedChecklistId]);

  const onProceedToChecklist = useCallback(() => {
    setSuccessModalOpen(false);
    setLastInsertedChecklistId(null);
    router.push('/checklist');
  }, []);

  const onCloseSuccess = useCallback(() => {
    setSuccessModalOpen(false);
    setLastInsertedChecklistId(null);
  }, []);

  const toggleSelectedCategory = useCallback((category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    );
  }, []);

  return (
    <LinearGradient
      colors={[ChecklistDesign.gradientTop, ChecklistDesign.gradientBottom]}
      style={styles.gradient}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}>
      <FlatList
        data={listData}
        numColumns={2}
        keyExtractor={(row) => (row.kind === 'custom' ? 'custom-create' : row.item.id)}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={catalogLoading} onRefresh={() => void loadCatalog()} tintColor={ChecklistDesign.accentOrange} />
        }
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Add Items</Text>
            <Text style={styles.subtitle}>Find items to add to your Balikbayan box</Text>

            <View style={styles.searchWrap}>
              <MaterialIcons name="search" size={20} color="#B0A79B" />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search for items..."
                placeholderTextColor="#B0A79B"
                style={styles.searchInput}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
              />
            </View>

            {catalogError ? (
              <View style={styles.banner}>
                <Text style={styles.bannerText} selectable>
                  {catalogError}
                </Text>
                <Pressable onPress={() => void loadCatalog()} style={styles.bannerBtn}>
                  <Text style={styles.bannerBtnText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}

            <View style={styles.filterBarRow}>
              <Pressable
                onPress={() => setCategoriesMenuOpen(true)}
                style={styles.categoryMenuButton}
                accessibilityRole="button"
                accessibilityLabel="Open categories menu">
                <MaterialIcons name="tune" size={24} color={ChecklistDesign.textPrimary} />
                {selectedCategories.length > 0 ? (
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{selectedCategories.length}</Text>
                  </View>
                ) : null}
              </Pressable>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterScrollContent}>
                {filterOptions.map((f) => {
                  const active = selectedCategories.length > 0 ? selectedCategories.includes(f) : filter === f;
                  return (
                    <Pressable
                      key={f}
                      onPress={() => {
                        setSelectedCategories([]);
                        setFilter(f);
                      }}
                      style={[styles.filterPill, active && styles.filterPillActive]}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: active }}>
                      <Text style={[styles.filterText, active && styles.filterTextActive]} numberOfLines={1}>
                        {f}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <Text style={styles.sectionTitle}>Items you might like</Text>
            {catalogLoading && catalog.length === 0 ? (
              <View style={styles.catalogLoading}>
                <ActivityIndicator size="large" color={ChecklistDesign.accentOrange} />
              </View>
            ) : null}
            {!catalogLoading && !catalogError && catalog.length === 0 ? (
              <Text style={styles.emptyHint}>
                No items loaded. Confirm rows in Supabase have is_active = true, RLS allows anon read, and
                EXPO_PUBLIC_SUPABASE_URL matches this project. Pull down to retry.
              </Text>
            ) : null}
          </View>
        }
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 140 },
        ]}
        renderItem={({ item: row }) => {
          if (row.kind === 'custom') {
            const showExpandedCustom = filteredRecommended.length === 0;
            return (
              <View style={[styles.cardWrap, showExpandedCustom && styles.cardWrapFull]}>
                <Pressable
                  onPress={onOpenCustom}
                  disabled={busy}
                  style={({ pressed }) => [
                    styles.customCard,
                    showExpandedCustom && styles.customCardExpanded,
                    pressed && { opacity: 0.94 },
                    busy && { opacity: 0.6 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Create custom item">
                  <View style={styles.customIconCircle}>
                    <MaterialIcons name="add" size={34} color={ChecklistDesign.textPrimary} />
                  </View>
                  <Text style={styles.customTitle}>Create Custom Item</Text>
                  <Text style={styles.customSubtitle}>
                    {"Can't find what you need? Add it manually."}
                  </Text>
                </Pressable>
              </View>
            );
          }

          const { item } = row;
          return (
            <View style={styles.cardWrap}>
              <View style={styles.card}>
                <View style={styles.imagePlaceholder}>
                  {item.image_url ? (
                    <Image
                      source={{ uri: item.image_url }}
                      style={styles.cardImage}
                      contentFit="cover"
                      transition={200}
                    />
                  ) : (
                    <View style={styles.checkerMini} />
                  )}
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.itemPrice}>${Number(item.reference_price).toFixed(2)}</Text>

                  <Pressable
                    onPress={() => onAddRecommended(item)}
                    disabled={busy}
                    style={({ pressed }) => [styles.addButton, pressed && { opacity: 0.92 }, busy && { opacity: 0.6 }]}
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${item.name} to box`}>
                    {busy ? (
                      <ActivityIndicator color={ChecklistDesign.textPrimary} />
                    ) : (
                      <>
                        <MaterialIcons name="add" size={18} color={ChecklistDesign.textPrimary} />
                        <Text style={styles.addButtonText}>Add to Box</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            </View>
          );
        }}
      />

      <Modal
        visible={categoriesMenuOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setCategoriesMenuOpen(false)}>
        <View style={styles.dropdownBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setCategoriesMenuOpen(false)} />
          <View style={styles.dropdownCard}>
            <Text style={styles.dropdownTitle}>Categories</Text>
            <ScrollView style={styles.dropdownList} showsVerticalScrollIndicator={false}>
              {filterOptions
                .filter((f) => f !== ALL_ITEMS)
                .map((category) => {
                  const selected = selectedCategories.includes(category);
                  return (
                    <Pressable
                      key={category}
                      onPress={() => toggleSelectedCategory(category)}
                      style={styles.dropdownItem}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: selected }}>
                      <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                        {selected ? <MaterialIcons name="check" size={14} color="#fff" /> : null}
                      </View>
                      <Text style={styles.dropdownItemText}>{category}</Text>
                    </Pressable>
                  );
                })}
            </ScrollView>
            <View style={styles.dropdownActions}>
              <Pressable
                onPress={() => setSelectedCategories([])}
                style={styles.dropdownGhostBtn}
                accessibilityRole="button">
                <Text style={styles.dropdownGhostText}>Clear</Text>
              </Pressable>
              <Pressable
                onPress={() => setCategoriesMenuOpen(false)}
                style={styles.dropdownPrimaryBtn}
                accessibilityRole="button">
                <Text style={styles.dropdownPrimaryText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={customModalOpen}
        animationType="slide"
        transparent
        onRequestClose={closeCustomForm}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}>
          <View style={StyleSheet.absoluteFill} />
          <View style={[styles.modalCard, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Create Custom Item</Text>
              <Pressable
                onPress={closeCustomForm}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Close">
                <MaterialIcons name="close" size={26} color={ChecklistDesign.textPrimary} />
              </Pressable>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.formScroll}>
              <Text style={styles.fieldLabel}>Item Name</Text>
              <TextInput
                value={customName}
                onChangeText={setCustomName}
                placeholder="e.g., Special Chocolate"
                placeholderTextColor="#B0A79B"
                style={styles.modalInput}
                autoFocus
                returnKeyType="next"
              />

              <Text style={styles.fieldLabel}>Price (USD)</Text>
              <TextInput
                value={customPrice}
                onChangeText={setCustomPrice}
                placeholder="e.g., 5.99"
                placeholderTextColor="#B0A79B"
                style={styles.modalInput}
                keyboardType="decimal-pad"
                returnKeyType="next"
              />

              <Text style={styles.fieldLabel}>Item Quantity</Text>
              <TextInput
                value={customQuantity}
                onChangeText={setCustomQuantity}
                placeholder="e.g., 4"
                placeholderTextColor="#B0A79B"
                style={styles.modalInput}
                keyboardType="number-pad"
                returnKeyType="done"
                onSubmitEditing={onSubmitCustom}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable onPress={closeCustomForm} style={styles.modalBtnGhost} accessibilityRole="button">
                <Text style={styles.modalBtnGhostText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={onSubmitCustom}
                disabled={busy}
                style={[styles.modalBtnAddItem, busy && { opacity: 0.6 }]}
                accessibilityRole="button"
                accessibilityLabel="Add item">
                {busy ? (
                  <ActivityIndicator color={ChecklistDesign.textPrimary} />
                ) : (
                  <Text style={styles.modalBtnAddItemText}>Add Item</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={successModalOpen}
        animationType="fade"
        transparent
        onRequestClose={onCloseSuccess}>
        <View style={styles.successOverlay}>
          <View style={styles.successCard}>
            <Pressable
              onPress={onCloseSuccess}
              style={styles.successCloseBtn}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close">
              <MaterialIcons name="close" size={24} color={ChecklistDesign.textPrimary} />
            </Pressable>

            <View style={styles.successIconCircle}>
              <MaterialIcons name="check" size={36} color="#1B5E20" />
            </View>
            <Text style={styles.successTitle}>Item Added!</Text>

            <Pressable
              onPress={onUndoSuccess}
              disabled={busy}
              style={styles.undoRow}
              accessibilityRole="button"
              accessibilityLabel="Undo last action">
              <Text style={styles.undoText}>Undo Action</Text>
              <MaterialIcons name="undo" size={20} color={ChecklistDesign.textMuted} />
            </Pressable>

            <Pressable
              onPress={onProceedToChecklist}
              style={({ pressed }) => [styles.proceedButton, pressed && { opacity: 0.92 }]}
              accessibilityRole="button"
              accessibilityLabel="Proceed to Shared Checklist">
              <Text style={styles.proceedButtonText}>Proceed to Shared Checklist</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  content: { paddingHorizontal: 20 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: ChecklistDesign.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: ChecklistDesign.textMuted,
    textAlign: 'center',
    marginBottom: 16,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: ChecklistDesign.card,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: ChecklistDesign.textPrimary,
    paddingVertical: 0,
  },
  banner: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  bannerText: { fontSize: 13, color: '#5C5346', lineHeight: 18 },
  bannerBtn: { alignSelf: 'flex-start' },
  bannerBtnText: { fontSize: 14, fontWeight: '700', color: ChecklistDesign.accentOrange },
  filterBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  filterScrollContent: {
    flexDirection: 'row',
    gap: 10,
    paddingLeft: 10,
    alignItems: 'center',
  },
  filterPill: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: ChecklistDesign.tabInactive,
    maxWidth: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: ChecklistDesign.tabActive,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: ChecklistDesign.textMuted,
  },
  filterTextActive: {
    color: ChecklistDesign.textPrimary,
  },
  categoryMenuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ChecklistDesign.tabInactive,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginRight: 10,
  },
  categoryBadge: {
    position: 'absolute',
    right: -3,
    top: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: ChecklistDesign.accentOrange,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  categoryBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  dropdownBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dropdownCard: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '70%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: ChecklistDesign.textPrimary,
    marginBottom: 12,
  },
  dropdownList: {
    maxHeight: 360,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#C9BBA6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: ChecklistDesign.accentOrange,
    borderColor: ChecklistDesign.accentOrange,
  },
  dropdownItemText: {
    flex: 1,
    fontSize: 15,
    color: ChecklistDesign.textPrimary,
  },
  dropdownActions: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 10,
  },
  dropdownGhostBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: ChecklistDesign.tabInactive,
  },
  dropdownGhostText: {
    color: ChecklistDesign.textMuted,
    fontWeight: '700',
  },
  dropdownPrimaryBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: ChecklistDesign.tanButton,
  },
  dropdownPrimaryText: {
    color: ChecklistDesign.textPrimary,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ChecklistDesign.textPrimary,
    marginTop: 4,
    marginBottom: 12,
  },
  catalogLoading: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyHint: {
    fontSize: 13,
    color: ChecklistDesign.textMuted,
    lineHeight: 18,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  cardWrap: {
    flex: 1,
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  cardWrapFull: {
    flexBasis: '100%',
  },
  card: {
    backgroundColor: ChecklistDesign.card,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 2,
  },
  imagePlaceholder: {
    height: 140,
    backgroundColor: '#E9E2D8',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginTop: 10,
    marginHorizontal: 10,
    borderRadius: 12,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  checkerMini: {
    width: 88,
    height: 88,
    borderRadius: 12,
    backgroundColor: '#D8D0C6',
    opacity: 0.85,
  },
  cardBody: {
    padding: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: ChecklistDesign.textPrimary,
  },
  itemPrice: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '700',
    color: ChecklistDesign.accentOrange,
  },
  addButton: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: ChecklistDesign.tanButton,
    borderRadius: 14,
    paddingVertical: 12,
    minHeight: 44,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: ChecklistDesign.textPrimary,
  },
  customCard: {
    backgroundColor: '#EDE4D6',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#D4B87A',
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  customCardExpanded: {
    minHeight: 360,
  },
  customIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E8C96A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  customTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: ChecklistDesign.textPrimary,
    textAlign: 'center',
  },
  customSubtitle: {
    marginTop: 8,
    fontSize: 13,
    color: ChecklistDesign.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: ChecklistDesign.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    maxHeight: '88%',
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: ChecklistDesign.textPrimary,
    flex: 1,
    paddingRight: 8,
  },
  formScroll: {
    paddingBottom: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: ChecklistDesign.textPrimary,
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E8E0D4',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: ChecklistDesign.textPrimary,
    backgroundColor: '#FAFAFA',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E8E0D4',
  },
  modalBtnGhost: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: ChecklistDesign.tabInactive,
  },
  modalBtnGhostText: {
    fontSize: 16,
    fontWeight: '700',
    color: ChecklistDesign.textMuted,
  },
  modalBtnAddItem: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: ChecklistDesign.tanButton,
    justifyContent: 'center',
    minHeight: 50,
  },
  modalBtnAddItemText: {
    fontSize: 16,
    fontWeight: '800',
    color: ChecklistDesign.textPrimary,
  },
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successCard: {
    backgroundColor: ChecklistDesign.card,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    position: 'relative',
  },
  successCloseBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
    zIndex: 1,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#C8E6C9',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: ChecklistDesign.textPrimary,
    marginBottom: 16,
  },
  undoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
    paddingVertical: 8,
  },
  undoText: {
    fontSize: 15,
    fontWeight: '600',
    color: ChecklistDesign.textMuted,
  },
  proceedButton: {
    width: '100%',
    backgroundColor: ChecklistDesign.tanButton,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  proceedButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: ChecklistDesign.textPrimary,
  },
});
