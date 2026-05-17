import { HAS_COMPLETED_FIRST_LAUNCH_KEY } from '@/constants/first-launch';
import { supabase } from '@/services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function FirstLaunchGateScreen() {
  const insets = useSafeAreaInsets();
  const [booting, setBooting] = useState(true);
  const [showGetStarted, setShowGetStarted] = useState(false);

  const runBootstrap = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      router.replace('/(tabs)');
      return;
    }

    const hasSeen = await AsyncStorage.getItem(HAS_COMPLETED_FIRST_LAUNCH_KEY);
    if (hasSeen === 'true') {
      router.replace('/sign-in');
      return;
    }

    setShowGetStarted(true);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await runBootstrap();
      } finally {
        setBooting(false);
      }
    })();
  }, [runBootstrap]);

  const onGetStarted = async () => {
    await AsyncStorage.setItem(HAS_COMPLETED_FIRST_LAUNCH_KEY, 'true');
    router.replace('/sign-in');
  };

  if (booting) {
    return (
      <LinearGradient colors={['#E8C56B', '#F4F1EC']} style={styles.gradient}>
        <View style={[styles.loadingWrap, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color="#2E2A26" />
        </View>
      </LinearGradient>
    );
  }

  if (!showGetStarted) {
    return (
      <LinearGradient colors={['#E8C56B', '#F4F1EC']} style={styles.gradient}>
        <View style={[styles.loadingWrap, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color="#2E2A26" />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#E8C56B', '#F4F1EC']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.gradient}>
      <View style={[styles.page, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.centerBlock}>
          <Text style={styles.brandTitle}>MyBalikBox</Text>
          <Text style={styles.tagline}>Sending love, one box at a time.</Text>
        </View>

        <Pressable style={styles.primaryButton} onPress={onGetStarted} accessibilityRole="button">
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  page: {
    flex: 1,
    marginHorizontal: 20,
    borderRadius: 42,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  centerBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 40,
    fontWeight: '800',
    color: '#2E2A26',
    textAlign: 'center',
  },
  tagline: {
    marginTop: 12,
    fontSize: 18,
    color: '#2E2A26',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  primaryButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: '#E8B654',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 12,
    elevation: 5,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
  },
});
