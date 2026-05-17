import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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

import { HomeBoxIcon } from '@/components/home-box-icon';
import { lineWeightTotalKg } from '@/constants/box-metrics';
import { ChecklistDesign } from '@/constants/checklist-design';
import { ACTIVE_BOX_CODE_KEY, ACTIVE_BOX_TITLE_KEY } from '@/constants/first-launch';
import { subscribeChecklistChanged } from '@/services/checklist-events';
import { fetchBoxMemberDisplayRows } from '@/services/box-member-display';
import {
  clearActiveBoxStorage,
  resolvePrimaryBoxForUser,
  syncActiveBoxFromServer,
} from '@/services/active-box';
import { supabase } from '@/services/supabase';

type ChecklistStatRow = {
  quantity: number | null;
  reference_price: number | null;
  status: 'planned' | 'purchased' | 'packed' | 'removed';
  weight_kg?: number | null;
};

type Contributor = {
  userId: string;
  displayName: string;
  isSelf: boolean;
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [boxTitle, setBoxTitle] = useState('Family Balikbayan Box');
  const [boxCode, setBoxCode] = useState('');
  const [memberRole, setMemberRole] = useState<'builder' | 'contributor' | null>(null);
  const [showLegacyWidget, setShowLegacyWidget] = useState(false);
  const [welcomeName, setWelcomeName] = useState('User');
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    budgetUsd: 0,
    weightKg: 0,
    pendingItems: 0,
    includedItems: 0,
    progressPercent: 0,
  });

  const loadHome = useCallback(async () => {
    let userId: string | null = null;
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user ?? null;
      userId = user?.id ?? null;

      if (userId && user) {
        const metadataName =
          (typeof user.user_metadata?.display_name === 'string' && user.user_metadata.display_name.trim()) ||
          (typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name.trim()) ||
          null;
        const emailName = user.email?.split('@')[0]?.trim() || null;

        const { data: profile, error: profileErr } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', userId)
          .maybeSingle();

        if (profileErr) {
          console.warn('Profile load failed', profileErr);
        }

        const resolvedName = profile?.display_name?.trim() || metadataName || emailName || 'User';
        setWelcomeName(resolvedName);
      } else {
        setWelcomeName('User');
      }

      const storedBoxTitle = await AsyncStorage.getItem(ACTIVE_BOX_TITLE_KEY);
      const storedBoxCode = await AsyncStorage.getItem(ACTIVE_BOX_CODE_KEY);

      const primary = userId ? await resolvePrimaryBoxForUser(userId) : null;
      const userHasBox = primary !== null;
      setShowLegacyWidget(userHasBox);

      if (!userHasBox || !primary) {
        setStats({
          totalItems: 0,
          budgetUsd: 0,
          weightKg: 0,
          pendingItems: 0,
          includedItems: 0,
          progressPercent: 0,
        });
        setContributors([]);
        setMemberRole(null);
        if (storedBoxTitle?.trim()) {
          setBoxTitle(storedBoxTitle.trim());
        }
        setBoxCode(storedBoxCode?.trim() ?? '');
        return;
      }

      const boxId = primary.boxId;
      setBoxTitle(primary.title);
      setBoxCode(primary.joinCode ?? '');

      if (userId) {
        try {
          await syncActiveBoxFromServer(userId);
        } catch (syncErr) {
          console.warn('Active box sync failed', syncErr);
        }
      }

      if (userId) {
        const { data: membership } = await supabase
          .from('box_members')
          .select('role')
          .eq('box_id', boxId)
          .eq('user_id', userId)
          .maybeSingle();
        const role = membership?.role;
        setMemberRole(role === 'contributor' || role === 'builder' ? role : null);
      } else {
        setMemberRole(null);
      }

      const { data: items, error: itemsErr } = await supabase
        .from('box_checklist_items')
        .select('quantity, reference_price, status')
        .eq('box_id', boxId)
        .neq('status', 'removed');

      if (itemsErr) throw itemsErr;

      const rows = (items ?? []) as ChecklistStatRow[];
      const totalItems = rows.reduce((sum, row) => sum + Number(row.quantity ?? 1), 0);
      const includedItems = rows
        .filter((row) => row.status === 'purchased' || row.status === 'packed')
        .reduce((sum, row) => sum + Number(row.quantity ?? 1), 0);
      const pendingItems = rows
        .filter((row) => row.status === 'planned')
        .reduce((sum, row) => sum + Number(row.quantity ?? 1), 0);
      const budgetSpentUsd = rows.reduce(
        (sum, row) => sum + Math.max(0, Number(row.reference_price ?? 0)) * Number(row.quantity ?? 1),
        0,
      );

      let weightFromItemsKg = 0;
      for (const row of rows) {
        weightFromItemsKg += lineWeightTotalKg({
          weight_kg: row.weight_kg,
          quantity: row.quantity,
        });
      }
      const weightDisplayKg = rows.length ? weightFromItemsKg : 0;

      const progressPercent = totalItems > 0 ? Math.round((includedItems / totalItems) * 100) : 0;

      try {
        const memberRows = await fetchBoxMemberDisplayRows(boxId, userId);
        setContributors(
          memberRows.map((r) => ({
            userId: r.userId,
            displayName: r.displayName,
            isSelf: r.userId === userId,
          })),
        );
      } catch {
        const { data: idsOnly } = await supabase.from('box_members').select('user_id').eq('box_id', boxId);
        setContributors(
          (idsOnly ?? []).map((m) => ({
            userId: m.user_id,
            displayName: m.user_id === userId ? 'You' : 'Member',
            isSelf: m.user_id === userId,
          })),
        );
      }

      setStats({
        totalItems,
        budgetUsd: budgetSpentUsd,
        weightKg: weightDisplayKg,
        pendingItems,
        includedItems,
        progressPercent,
      });
    } catch (error) {
      console.warn('Home load failed', error);
      if (userId) {
        try {
          const fallback = await resolvePrimaryBoxForUser(userId);
          if (fallback) {
            setShowLegacyWidget(true);
            setBoxTitle(fallback.title);
            setBoxCode(fallback.joinCode ?? '');
          }
        } catch {
          // keep setup UI
        }
      }
      setContributors([]);
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

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        setLoading(true);
        await loadHome();
        if (!cancelled) setLoading(false);
      })();
      return () => {
        cancelled = true;
      };
    }, [loadHome]),
  );

  useEffect(() => {
    return subscribeChecklistChanged(() => {
      void loadHome();
    });
  }, [loadHome]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        void loadHome();
      } else {
        setShowLegacyWidget(false);
      }
    });
    return () => subscription.unsubscribe();
  }, [loadHome]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHome();
    setRefreshing(false);
  }, [loadHome]);

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

  const onCopyBoxCode = useCallback(async () => {
    const code = boxCode.trim();
    if (!code) return;
    await Clipboard.setStringAsync(code);
    Alert.alert('Copied', 'Box code copied to clipboard.');
  }, [boxCode]);
  const onSignOut = useCallback(async () => {
    await clearActiveBoxStorage();
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Sign out failed', error.message);
      return;
    }
    router.replace('/sign-in');
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
            <Text style={styles.welcomeTitle}>Welcome back, {welcomeName}!</Text>
            <Text style={styles.welcomeSub}>Ready to pack today?</Text>
          </View>
          <Pressable
            onPress={() => void onSignOut()}
            style={styles.locationWrap}
            accessibilityRole="button"
            accessibilityLabel="Sign out">
            <View style={styles.locationIcon}>
              <MaterialIcons name="logout" size={20} color={ChecklistDesign.textPrimary} />
            </View>
            <Text style={styles.locationText}>Sign Out</Text>
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
        {showLegacyWidget ? (
          <>
            <Pressable
              style={[styles.boxPanelOuter, { minHeight: familyWidgetMinHeight }]}
              onPress={() => router.push('/box-overview')}
              accessibilityRole="button"
              accessibilityLabel="View box overview">
              <View style={styles.boxPanelInner}>
              <View style={styles.boxHeader}>
                <HomeBoxIcon />
                <View style={styles.boxHeaderTextWrap}>
                  <Text style={styles.boxName}>{boxTitle}</Text>
                  <View style={styles.chipRow}>
                    <View
                      style={[styles.chip, styles.senderChip]}
                      accessibilityRole="text">
                      <MaterialIcons
                        name={memberRole === 'contributor' ? 'group' : 'favorite'}
                        size={14}
                        color={ChecklistDesign.textPrimary}
                      />
                      <Text style={styles.senderChipText}>
                        {memberRole === 'contributor' ? 'Contributor' : 'Sender'}
                      </Text>
                    </View>
                    {boxCode.trim() ? (
                      <Pressable
                        onPress={() => void onCopyBoxCode()}
                        style={[styles.chip, styles.boxCodeChip]}
                        accessibilityRole="button"
                        accessibilityLabel={`Box code ${boxCode}. Double tap to copy.`}>
                        <MaterialIcons name="vpn-key" size={14} color={ChecklistDesign.textPrimary} />
                        <Text style={styles.chipText} numberOfLines={1}>
                          {boxCode.trim()}
                        </Text>
                        <MaterialIcons name="content-copy" size={14} color={ChecklistDesign.textMuted} />
                      </Pressable>
                    ) : null}
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
                    <Text style={styles.statLabel}>Est. spend</Text>
                    <Text style={styles.statValue}>${Math.round(stats.budgetUsd)}</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statCell}>
                    <Text style={styles.statLabel}>Weight</Text>
                    <Text style={styles.statValue}>
                      {stats.weightKg % 1 === 0 ? Math.round(stats.weightKg) : Math.round(stats.weightKg * 10) / 10}kg
                    </Text>
                  </View>
                </View>
                <View style={styles.actionRow}>
                  <View style={styles.pendingPill}>
                    <View style={styles.dot} />
                    <Text style={styles.pendingText}>{stats.pendingItems} pending items</Text>
                  </View>
                </View>
              </View>
            </View>
            </Pressable>

            <View style={styles.legacyWidgetActionsRow}>
              <Pressable
                onPress={() => router.push('/create-box')}
                style={styles.legacySideButton}
                accessibilityRole="button">
                <Text style={styles.legacySideButtonText}>Create Box</Text>
                <MaterialIcons name="add" size={18} color="#fff" />
              </Pressable>
              <Pressable
                onPress={() => router.push('/join-box')}
                style={[styles.legacySideButton, styles.legacyJoinButton]}
                accessibilityRole="button">
                <Text style={styles.legacyJoinButtonText}>Join Box</Text>
                <MaterialIcons name="group-add" size={18} color={ChecklistDesign.textPrimary} />
              </Pressable>
            </View>
          </>
        ) : (
          <View style={styles.setupBoxWidget}>
            <View style={styles.setupHeader}>
              <View style={styles.setupHeaderTextWrap}>
                <Text style={styles.setupTitle}>Set Up a Box</Text>
                <Text style={styles.setupSubtitle}>Create a new box or join an existing one</Text>
              </View>
            </View>

            <Pressable
              onPress={() => router.push('/create-box')}
              style={styles.setupActionCard}
              accessibilityRole="button">
              <View style={styles.setupIconWarm}>
                <MaterialIcons name="add" size={26} color="#E0A84A" />
              </View>
              <View style={styles.setupActionTextWrap}>
                <Text style={styles.setupActionTitle}>Create New Box</Text>
                <Text style={styles.setupActionSubtitle}>Start a new Balikbayan box and invite others</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => router.push('/join-box')}
              style={[styles.setupActionCard, styles.setupActionCardCool]}
              accessibilityRole="button">
              <View style={styles.setupIconCool}>
                <MaterialIcons name="add-circle-outline" size={25} color="#8FACB8" />
              </View>
              <View style={styles.setupActionTextWrap}>
                <Text style={styles.setupActionTitle}>Join Existing Box</Text>
                <Text style={styles.setupActionSubtitle}>Enter a box code to join an existing box</Text>
              </View>
            </Pressable>
          </View>
        )}

        <View style={styles.equalGapSpacer} />
        <View style={styles.contributorsSection}>
          <Text style={styles.sectionTitle}>Contributors</Text>
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={ChecklistDesign.accentOrange} />
            </View>
          ) : contributors.length > 0 ? (
            <View style={styles.contributorsRow}>
              {contributors.map((c) => {
                const initial = (c.displayName || '?').slice(0, 1).toUpperCase();
                return (
                  <View key={c.userId} style={styles.contributorWrap}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarInitial}>{initial}</Text>
                    </View>
                    <Text style={styles.avatarName} numberOfLines={1}>
                      {c.isSelf ? 'You' : c.displayName}
                    </Text>
                  </View>
                );
              })}
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
  boxCodeChip: {
    flexShrink: 1,
    maxWidth: '58%',
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
  legacyWidgetActionsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
    marginTop: 10,
    width: '100%',
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
  legacySideButton: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#E8B654',
    borderRadius: 20,
    height: 44,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  legacySideButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  legacyJoinButton: {
    backgroundColor: '#EEE2CE',
    borderWidth: 1.5,
    borderColor: '#C9B8A0',
  },
  legacyJoinButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: ChecklistDesign.textPrimary,
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
  setupBoxWidget: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#FEFDF9',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 6,
  },
  setupHeader: {
    backgroundColor: '#F1C86A',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    minHeight: 98,
  },
  setupHeaderTextWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setupTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 30,
    textAlign: 'center',
  },
  setupSubtitle: {
    marginTop: 4,
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '500',
    textAlign: 'center',
  },
  setupActionCard: {
    marginHorizontal: 14,
    marginTop: 12,
    marginBottom: 2,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#F5C15F',
    backgroundColor: '#FFFDF9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 104,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  setupActionCardCool: {
    borderColor: '#8CB9CC',
    marginBottom: 14,
  },
  setupIconWarm: {
    width: 53,
    height: 53,
    borderRadius: 13.25,
    backgroundColor: '#E8DCC7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setupIconCool: {
    width: 53,
    height: 53,
    borderRadius: 13.25,
    backgroundColor: '#C7D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setupActionTextWrap: {
    flex: 1,
    paddingRight: 8,
  },
  setupActionTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: '#1F1E1B',
  },
  setupActionSubtitle: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 18,
    color: '#625F5C',
    fontWeight: '400',
  },
});
