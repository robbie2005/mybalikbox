import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { phoneCardFlowStyles as flow } from '@/constants/phone-card-flow';
import { setActiveBoxContext } from '@/services/active-box';
import { joinBoxByCode, normalizeJoinCodeInput } from '@/services/join-box';

type Phase = 'loading' | 'success' | 'error';

export default function BoxJoinedScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ boxCode?: string }>();
  const codeParam = normalizeJoinCodeInput(String(params.boxCode ?? ''));

  const [phase, setPhase] = useState<Phase>('loading');
  const [boxName, setBoxName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const result = await joinBoxByCode(codeParam);
        if (cancelled) return;

        await setActiveBoxContext({
          boxId: result.boxId,
          title: result.title,
          joinCode: result.joinCode,
        });

        setBoxName(result.title);
        setPhase('success');

        await new Promise((r) => setTimeout(r, 1600));
        if (cancelled) return;

        router.replace('/(tabs)');
      } catch (e) {
        if (cancelled) return;
        setErrorMessage(e instanceof Error ? e.message : 'Could not join this box.');
        setPhase('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [codeParam]);

  return (
    <LinearGradient colors={['#E8C56B', '#F4F1EC']} style={flow.gradient}>
      <View style={[flow.page, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 14 }]}>
        <View style={flow.phoneCard}>
          {phase === 'error' ? (
            <>
              <View style={flow.header}>
                <Pressable onPress={() => router.back()} style={flow.backPill} accessibilityRole="button">
                  <MaterialIcons name="arrow-back" size={20} color="#FEFDF9" />
                </Pressable>
                <View style={styles.headerTextWrap}>
                  <Text style={flow.headerTitle}>Couldn&apos;t Join</Text>
                  <Text style={flow.headerSub}>Check the code and try again</Text>
                </View>
              </View>
              <View style={flow.contentFlex}>
                <Text style={styles.bodyText}>{errorMessage}</Text>
              </View>
              <View style={flow.footerWrap}>
                <Pressable
                  style={[flow.footerButton, flow.footerButtonActive]}
                  onPress={() => router.back()}
                  accessibilityRole="button">
                  <Text style={flow.footerButtonText}>Go Back</Text>
                </Pressable>
              </View>
            </>
          ) : phase === 'loading' ? (
            <>
              <View style={flow.headerStacked}>
                <ActivityIndicator size="large" color="#FEFDF9" />
                <Text style={[flow.headerTitleCentered, styles.loadingHeaderTitle]}>Joining box...</Text>
              </View>
              <View style={flow.contentFlex}>
                <Text style={styles.bodyText}>Verifying your code and adding you to the shared box.</Text>
              </View>
            </>
          ) : (
            <>
              <View style={flow.headerStacked}>
                <View style={flow.checkCircle}>
                  <MaterialIcons name="check" size={32} color="#FEFDF9" />
                </View>
                <Text style={flow.headerTitleCentered}>Successfully Joined!</Text>
                <Text style={flow.headerSubCentered}>{boxName}</Text>
              </View>

              <View style={flow.contentFlex}>
                <Text style={styles.bodyText}>
                  You&apos;re now part of this Balikbayan box! You can view and add items to the shared collection.
                </Text>

                <View style={styles.peopleCircle}>
                  <MaterialIcons name="groups" size={40} color="#8A9AA8" />
                </View>

                <View style={styles.loadingRow}>
                  <Text style={styles.loadingText}>Loading box...</Text>
                </View>
              </View>
            </>
          )}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  headerTextWrap: {
    flex: 1,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4A4642',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  peopleCircle: {
    alignSelf: 'center',
    marginTop: 28,
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#E3EEF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingRow: {
    marginTop: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: '#9A8F86',
    fontWeight: '500',
  },
  loadingHeaderTitle: {
    marginTop: 16,
  },
});
