import { BalikBoxLogo } from '@/components/balikbox-logo';
import { syncActiveBoxFromServer } from '@/services/active-box';
import { resolveEmailForSignIn } from '@/services/auth-sign-in';
import { ensureUserBootstrap } from '@/services/auth-bootstrap';
import { supabase } from '@/services/supabase';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LOGO_H = 140;
/** How much of the logo sits under the panel (between LOGO_H/4 and LOGO_H/2 after fine-tune). */
const LOGO_OVERLAP = Math.round(LOGO_H / 3);

/** Same gradient as screen background — panel blends seamlessly when aligned. */
const SCREEN_GRADIENT = ['#E8C56B', '#F4F1EC'] as const;

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();
  /** ~¼ of estimated main panel height (flex area below status bar). */
  const lowerBlockBy = Math.round(screenH * 0.65 * 0.25);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        router.replace('/(tabs)');
      }
    })();
  }, []);

  const handleEmailSignIn = async () => {
    if (!identifier.trim() || !password) {
      Alert.alert('Missing information', 'Enter your email or username and password.');
      return;
    }

    setLoading(true);
    try {
      const email = await resolveEmailForSignIn(identifier);
      if (!email) {
        Alert.alert('Account not found', 'No account matches that email or username.');
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error('Unable to sign in.');

      const authUsername =
        (typeof data.user.user_metadata?.display_name === 'string' && data.user.user_metadata.display_name) ||
        data.user.email?.split('@')[0] ||
        null;
      await ensureUserBootstrap({
        userId: data.user.id,
        username: authUsername,
        displayName: authUsername,
      });
      await syncActiveBoxFromServer(data.user.id);
      router.replace('/(tabs)');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign-in failed. Please try again.';
      Alert.alert('Sign-in error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[...SCREEN_GRADIENT]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.gradient}>
      <View style={[styles.page, { paddingTop: insets.top + 12 }]}>
        <View style={[styles.overlapGroup, { marginTop: lowerBlockBy }]}>
          <View style={styles.logoLayer} pointerEvents="none">
            <BalikBoxLogo width={159} height={LOGO_H} />
          </View>
          <LinearGradient
            colors={[...SCREEN_GRADIENT]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[styles.card, { marginTop: -LOGO_OVERLAP }]}>
            <ScrollView
              style={styles.scrollView}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: 24 + insets.bottom },
              ]}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>

            <Text style={styles.fieldLabel}>Email or Username</Text>
            <View style={styles.inputWrap}>
              <MaterialIcons name="alternate-email" size={22} color="#8A8A8A" />
              <TextInput
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
                autoComplete="username"
                textContentType="username"
                placeholder="Email or username"
                placeholderTextColor="#9A9A9A"
                style={styles.input}
              />
            </View>

            <Text style={styles.fieldLabel}>Password</Text>
            <View style={styles.inputWrap}>
              <MaterialIcons name="lock-outline" size={22} color="#8A8A8A" />
              <TextInput
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                secureTextEntry
                autoComplete="password"
                textContentType="password"
                placeholder="Password"
                placeholderTextColor="#9A9A9A"
                style={styles.input}
              />
            </View>

            <Pressable
              style={styles.forgotRow}
              onPress={() => Alert.alert('Forgot password', 'Password reset from the app is coming soon.')}
              accessibilityRole="button">
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>

            <Pressable
              style={[styles.signInBtn, loading && styles.signInBtnDisabled]}
              disabled={loading}
              onPress={() => void handleEmailSignIn()}
              accessibilityRole="button">
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.signInBtnText}>Sign In</Text>}
            </Pressable>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>{"Don't have an account? "}</Text>
              <Pressable onPress={() => router.push('/sign-up')} accessibilityRole="link">
                <Text style={styles.footerLink}>Sign Up</Text>
              </Pressable>
            </View>
            </ScrollView>
          </LinearGradient>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  page: { flex: 1 },
  overlapGroup: {
    flex: 1,
    width: '100%',
  },
  /**
   * In layout flow so the panel overlap leaves the top half visible.
   * Right-aligned; bottom half sits under the widget (lower z-index).
   */
  logoLayer: {
    zIndex: 1,
    width: '100%',
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  card: {
    zIndex: 2,
    elevation: 3,
    width: '100%',
    flex: 1,
    marginBottom: 0,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    minHeight: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 15,
    color: '#5C5346',
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3A3328',
    marginBottom: 6,
    marginTop: 4,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4DED4',
    paddingHorizontal: 14,
    height: 50,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#2A2A2A',
  },
  forgotRow: { alignSelf: 'flex-end', marginTop: 8, marginBottom: 16 },
  forgotText: { fontSize: 14, color: '#6B5B4A', fontWeight: '600' },
  signInBtn: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#94B2C1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInBtnDisabled: { opacity: 0.55 },
  signInBtnText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  footerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 28,
  },
  footerText: { fontSize: 15, color: '#3A3328' },
  footerLink: { fontSize: 15, fontWeight: '700', color: '#C98A35' },
});
