import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChecklistDesign } from '@/constants/checklist-design';
import { resolveActiveBoxId } from '@/services/checklist-items';
import { supabase } from '@/services/supabase';

type ChecklistStatRow = {
  quantity: number | null;
  reference_price: number | null;
  status: 'planned' | 'purchased' | 'packed' | 'removed';
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [boxTitle, setBoxTitle] = useState('Family Balikbayan Box');
  const [contributorIds, setContributorIds] = useState<string[]>([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    budgetUsd: 0,
    weightKg: 0,
    pendingItems: 0,
    includedItems: 0,
    progressPercent: 0,
  });

  const loadHome = useCallback(async () => {
    try {
      const boxId = await resolveActiveBoxId();
      if (!boxId) {
        setStats({
          totalItems: 0,
          budgetUsd: 0,
          weightKg: 0,
          pendingItems: 0,
          includedItems: 0,
          progressPercent: 0,
        });
        setContributorIds([]);
        return;
      }

      const [{ data: box, error: boxErr }, { data: members, error: membersErr }, { data: items, error: itemsErr }] =
        await Promise.all([
          supabase.from('boxes').select('title').eq('id', boxId).maybeSingle(),
          supabase.from('box_members').select('user_id').eq('box_id', boxId),
          supabase
            .from('box_checklist_items')
            .select('quantity, reference_price, status')
            .eq('box_id', boxId)
            .neq('status', 'removed'),
        ]);

      if (boxErr) throw boxErr;
      if (membersErr) throw membersErr;
      if (itemsErr) throw itemsErr;

      if (box?.title) setBoxTitle(box.title);

      const rows = (items ?? []) as ChecklistStatRow[];
      const totalItems = rows.reduce((sum, row) => sum + (row.quantity ?? 1), 0);
      const includedItems = rows
        .filter((row) => row.status === 'purchased' || row.status === 'packed')
        .reduce((sum, row) => sum + (row.quantity ?? 1), 0);
      const pendingItems = rows
        .filter((row) => row.status === 'planned')
        .reduce((sum, row) => sum + (row.quantity ?? 1), 0);
      const budgetUsd = rows.reduce(
        (sum, row) => sum + Math.max(0, Number(row.reference_price ?? 0)) * (row.quantity ?? 1),
        0,
      );
      const progressPercent = totalItems > 0 ? Math.round((includedItems / totalItems) * 100) : 0;

      setContributorIds((members ?? []).map((m) => m.user_id).slice(0, 5));
      setStats({
        totalItems,
        budgetUsd,
        weightKg: 0,
        pendingItems,
        includedItems,
        progressPercent,
      });
    } catch (error) {
      console.warn('Home load failed', error);
      setContributorIds([]);
      setStats({
        totalItems: 0,
        budgetUsd: 0,
        weightKg: 0,
        pendingItems: 0,
        includedItems: 0,
        progressPercent: 0,
      });
    }
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await loadHome();
      setLoading(false);
    })();
  }, [loadHome]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHome();
    setRefreshing(false);
  }, [loadHome]);

  const contributorInitials = useMemo(
    () => contributorIds.map((id) => id.slice(0, 1).toUpperCase()),
    [contributorIds],
  );
  const fixedHeaderHeight = 77;
  const headerToWidgetGap = 13;
  const estimatedBottomNavHeight = 112;
  const remainingHeight =
    screenHeight - insets.top - fixedHeaderHeight - estimatedBottomNavHeight - headerToWidgetGap;
  const familyWidgetMinHeight = Math.max(
    248,
    Math.round(Math.max(0, remainingHeight) * 0.5),
  );
  const onPlaceholderPress = useCallback((label: string) => {
    Alert.alert(label, 'Coming soon.');
  }, []);

  return (
    <LinearGradient
      colors={[ChecklistDesign.gradientTop, ChecklistDesign.gradientBottom]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.gradient}>
      <View style={[styles.fixedHeader, { paddingTop: insets.top + 10 }]}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.welcomeTitle}>Welcome back, User!</Text>
            <Text style={styles.welcomeSub}>Enter blurb here</Text>
          </View>
          <Pressable
            onPress={() => onPlaceholderPress('Dropoff Locations')}
            style={styles.locationWrap}
            accessibilityRole="button"
            accessibilityLabel="Dropoff Locations">
            <View style={styles.locationIcon}>
              <MaterialIcons name="add-location-alt" size={20} color={ChecklistDesign.textPrimary} />
            </View>
            <Text style={styles.locationText}>Dropoff Locations</Text>
          </Pressable>
        </View>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + fixedHeaderHeight + headerToWidgetGap, paddingBottom: 120 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={ChecklistDesign.accentOrange}
          />
        }>
        <View style={styles.equalGapSpacer} />
        <View style={[styles.boxPanelOuter, { minHeight: familyWidgetMinHeight }]}>
          <View style={styles.boxPanelInner}>
            <View style={styles.boxHeader}>
              <View style={styles.boxEmojiWrap}>
                <Text style={styles.boxEmoji}>📦</Text>
              </View>
              <View style={styles.boxHeaderTextWrap}>
                <Text style={styles.boxName}>{boxTitle}</Text>
                <View style={styles.chipRow}>
                  <Pressable
                    onPress={() => onPlaceholderPress('Sender Role')}
                    style={[styles.chip, styles.senderChip]}
                    accessibilityRole="button">
                    <MaterialIcons name="favorite" size={14} color={ChecklistDesign.textPrimary} />
                    <Text style={styles.senderChipText}>Sender</Text>
                  </Pressable>
                  <Pressable onPress={() => onPlaceholderPress('Switch Box')} style={styles.chip} accessibilityRole="button">
                    <Text style={styles.chipText}>Switch Box</Text>
                    <Text style={styles.chipArrow}>→</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Packing Progress</Text>
                <Text style={styles.progressCount}>{stats.progressPercent}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${stats.progressPercent}%` }]} />
              </View>
              <View style={styles.statsRow}>
                <View style={styles.statCell}>
                  <Text style={styles.statLabel}>Total Items</Text>
                  <Text style={styles.statValue}>{stats.totalItems}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCell}>
                  <Text style={styles.statLabel}>Budget</Text>
                  <Text style={styles.statValue}>${Math.round(stats.budgetUsd)}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCell}>
                  <Text style={styles.statLabel}>Weight</Text>
                  <Text style={styles.statValue}>{stats.weightKg}kg</Text>
                </View>
              </View>
              <View style={styles.actionRow}>
                <View style={styles.pendingPill}>
                  <View style={styles.dot} />
                  <Text style={styles.pendingText}>{stats.pendingItems} pending items</Text>
                </View>
                <Pressable
                  onPress={() => onPlaceholderPress('Create Box')}
                  style={styles.createBoxButton}
                  accessibilityRole="button">
                  <Text style={styles.createBoxText}>Create Box</Text>
                  <MaterialIcons name="add" size={20} color="#fff" />
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.equalGapSpacer} />
        <View style={styles.contributorsSection}>
          <Text style={styles.sectionTitle}>Contributors</Text>
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={ChecklistDesign.accentOrange} />
            </View>
          ) : contributorInitials.length > 0 ? (
            <View style={styles.contributorsRow}>
              {contributorInitials.map((initial, idx) => (
                <View key={`${initial}-${idx}`} style={styles.contributorWrap}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarInitial}>{initial}</Text>
                  </View>
                  <Text style={styles.avatarName}>{idx === 0 ? 'You' : `Member ${idx + 1}`}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No contributors yet.</Text>
          )}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 14 }]}>Recent Activity</Text>
        <Text style={styles.emptyText}>Activity feed coming soon.</Text>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 5,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(201,166,107,0.92)',
  },
  scroll: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 12,
  },
  equalGapSpacer: {
    height: 13,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#A07C50',
    paddingBottom: 8,
  },
  welcomeTitle: {
    fontSize: 29,
    fontWeight: '700',
    color: ChecklistDesign.textPrimary,
  },
  welcomeSub: {
    marginTop: 2,
    fontSize: 15,
    color: ChecklistDesign.textPrimary,
  },
  locationWrap: {
    alignItems: 'center',
    width: 82,
  },
  locationIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E7D1A8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationText: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    color: ChecklistDesign.textPrimary,
    lineHeight: 14,
  },
  boxPanelOuter: {
    borderRadius: 28,
    backgroundColor: '#B69567',
    padding: 5.5,
    marginBottom: 0,
  },
  boxPanelInner: {
    backgroundColor: '#F3E8D5',
    borderRadius: 24,
    padding: 10,
  },
  boxHeader: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  boxEmojiWrap: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxEmoji: {
    fontSize: 40,
  },
  boxHeaderTextWrap: {
    flex: 1,
  },
  boxName: {
    fontSize: 17,
    fontWeight: '700',
    color: ChecklistDesign.textPrimary,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    backgroundColor: '#EEE2CE',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  senderChip: {
    backgroundColor: '#E8C56B',
  },
  senderChipText: {
    color: ChecklistDesign.textPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  chipText: {
    color: ChecklistDesign.textPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  chipArrow: {
    color: ChecklistDesign.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  progressCard: {
    backgroundColor: '#F0ECE4',
    borderRadius: 20,
    padding: 14,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 23,
    fontWeight: '700',
    color: ChecklistDesign.textPrimary,
  },
  progressCount: {
    fontSize: 22,
    fontWeight: '700',
    color: ChecklistDesign.accentOrange,
  },
  progressTrack: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#DED4C4',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: ChecklistDesign.accentOrange,
  },
  statsRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 13,
    color: '#A59A8A',
    marginBottom: 6,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 29,
    fontWeight: '700',
    color: ChecklistDesign.textPrimary,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: '#D7CCBC',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  pendingPill: {
    flex: 1,
    backgroundColor: '#E8DED0',
    borderRadius: 14,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E8C56B',
  },
  pendingText: {
    fontSize: 15,
    color: '#4D4A43',
  },
  createBoxButton: {
    flex: 1,
    backgroundColor: '#E8B654',
    borderRadius: 20,
    height: 44,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  createBoxText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 30,
    lineHeight: 32,
    fontWeight: '700',
    color: ChecklistDesign.textPrimary,
    marginBottom: 10,
  },
  contributorsSection: {
    marginTop: 0,
  },
  loadingWrap: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  contributorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  contributorWrap: {
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#9A9A9A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarInitial: {
    fontSize: 30,
    fontWeight: '700',
    color: '#EDEDED',
  },
  avatarName: {
    marginTop: 8,
    marginLeft: 10,
    fontSize: 17,
    fontWeight: '600',
    color: '#4D4A43',
  },
  emptyText: {
    fontSize: 14,
    color: ChecklistDesign.textMuted,
    marginBottom: 8,
  },
});
