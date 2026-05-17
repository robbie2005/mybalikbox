import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ACTIVE_BOX_BUDGET_USD_KEY,
  ACTIVE_BOX_CODE_KEY,
  ACTIVE_BOX_TITLE_KEY,
  ACTIVE_BOX_WEIGHT_KG_KEY,
} from '@/constants/first-launch';
import {
  generateRandomJoinCode,
  isJoinCodeComplete,
  normalizeJoinCodeInput,
} from '@/services/join-box';
import { setActiveBoxContext } from '@/services/active-box';
import { finalizeUserBoxSetup, markUserBoxSetupComplete } from '@/services/user-box-setup';
import { supabase } from '@/services/supabase';

function parseOptionalBudgetUsd(raw: string | undefined): number | null {
  if (!raw?.trim()) return null;
  const n = Number(raw.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function parseOptionalWeightKg(raw: string | undefined): number | null {
  if (!raw?.trim()) return null;
  const n = Number(raw.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export default function BoxCreatedScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ boxName?: string; boxCode?: string; budget?: string; weight?: string }>();
  const boxName = params.boxName?.trim() || 'Narvaez Family Box';
  const initialBoxCode = useMemo(() => {
    const fromParams = normalizeJoinCodeInput(params.boxCode ?? '');
    return isJoinCodeComplete(fromParams) ? fromParams : generateRandomJoinCode();
  }, [params.boxCode]);
  const [boxCode, setBoxCode] = useState(initialBoxCode);
  const [isCopied, setIsCopied] = useState(false);

  return (
    <LinearGradient colors={['#E8C56B', '#F4F1EC']} style={styles.gradient}>
      <View style={[styles.page, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 14 }]}>
        <View style={styles.phoneCard}>
          <View style={styles.content}>
            <Text style={styles.title}>Box Created!</Text>
            <Text style={styles.boxName}>{boxName}</Text>

            <Text style={styles.label}>
              Share this code with family and friends so they can join your box:
            </Text>

            <View style={styles.codeCard}>
              <Text style={styles.codeLabel}>YOUR BOX CODE</Text>
              <Text style={styles.codeValue}>{boxCode}</Text>
            </View>

            <Pressable
              style={[styles.copyButton, isCopied ? styles.copyButtonCopied : null]}
              accessibilityRole="button"
              onPress={async () => {
                await Clipboard.setStringAsync(boxCode);
                setIsCopied(true);
              }}>
              {isCopied ? (
                <View style={styles.copySuccessContent}>
                  <MaterialIcons name="check" size={18} color="#FFFFFF" />
                  <Text style={styles.copyButtonText}>Copied to clipboard!</Text>
                </View>
              ) : (
                <Text style={styles.copyButtonText}>Copy Code</Text>
              )}
            </Pressable>

            <Text style={styles.note}>
              {'💡 Anyone with this code can join and contribute to your Balikbayan box. You can find this code later in your box settings.'}
            </Text>
          </View>

          <View style={styles.footerWrap}>
            <Pressable
              style={styles.footerButton}
              accessibilityRole="button"
              onPress={async () => {
                await AsyncStorage.setItem(ACTIVE_BOX_TITLE_KEY, boxName);
                await AsyncStorage.setItem(ACTIVE_BOX_CODE_KEY, boxCode);
                const budgetUsd = parseOptionalBudgetUsd(params.budget);
                const weightKg = parseOptionalWeightKg(params.weight);
                if (budgetUsd != null) {
                  await AsyncStorage.setItem(ACTIVE_BOX_BUDGET_USD_KEY, String(budgetUsd));
                } else {
                  await AsyncStorage.removeItem(ACTIVE_BOX_BUDGET_USD_KEY);
                }
                if (weightKg != null) {
                  await AsyncStorage.setItem(ACTIVE_BOX_WEIGHT_KG_KEY, String(weightKg));
                } else {
                  await AsyncStorage.removeItem(ACTIVE_BOX_WEIGHT_KG_KEY);
                }
                const {
                  data: { user },
                } = await supabase.auth.getUser();
                if (user) {
                  const { boxId, joinCode: savedCode } = await finalizeUserBoxSetup({
                    userId: user.id,
                    title: boxName,
                    joinCode: boxCode,
                    budgetCapUsd: budgetUsd,
                    weightCapKg: weightKg,
                  });
                  setBoxCode(savedCode);
                  await setActiveBoxContext({
                    boxId,
                    title: boxName,
                    joinCode: savedCode,
                  });
                } else {
                  await markUserBoxSetupComplete();
                }
                router.replace('/(tabs)');
              }}>
              <Text style={styles.footerButtonText}>View My Box</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  page: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneCard: {
    width: '96%',
    height: '70%',
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.95)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 20,
    elevation: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 12,
  },
  title: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '800',
    color: '#1F1E1B',
  },
  boxName: {
    marginTop: 8,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    color: '#2E2A26',
  },
  label: {
    marginTop: 20,
    fontSize: 15,
    lineHeight: 22,
    color: '#4A4642',
  },
  codeCard: {
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: '#EFE3D3',
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6F655D',
    letterSpacing: 0.4,
  },
  codeValue: {
    marginTop: 8,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    color: '#2E2A26',
    letterSpacing: 1,
  },
  copyButton: {
    marginTop: 12,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F2994A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyButtonCopied: {
    backgroundColor: '#6AB06A',
  },
  copySuccessContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  copyButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  note: {
    marginTop: 14,
    fontSize: 13,
    lineHeight: 19,
    color: '#6A625B',
  },
  footerWrap: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  footerButton: {
    height: 51,
    borderRadius: 16,
    backgroundColor: '#2F80ED',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 8,
    elevation: 3,
  },
  footerButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
});
