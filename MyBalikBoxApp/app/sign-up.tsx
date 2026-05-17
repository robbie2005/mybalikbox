import { BalikBoxLogo } from '@/components/balikbox-logo';
import { ensureUserBootstrap } from '@/services/auth-bootstrap';
import { isMissingUsernameColumnError } from '@/services/profile-columns';
import { supabase } from '@/services/supabase';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Linking from 'expo-linking';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

WebBrowser.maybeCompleteAuthSession();

/** Match sign-in screen box asset size (159×140 viewBox). */
const LOGO_W = 159;
const LOGO_H = 140;
/** Same as sign-in: ~⅓ of logo height sits under the panel. */
const LOGO_OVERLAP = Math.round(LOGO_H / 3);

const SCREEN_GRADIENT = ['#E8C56B', '#F4F1EC'] as const;

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function hasValidEmailSuffix(value: string): boolean {
  const parts = value.split('@');
  if (parts.length !== 2) return false;
  const domain = parts[1] ?? '';
  const dotIndex = domain.lastIndexOf('.');
  if (dotIndex <= 0 || dotIndex === domain.length - 1) return false;
  const suffix = domain.slice(dotIndex + 1);
  return /^[a-z]{2,}$/i.test(suffix);
}

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken';

function formatSignUpError(step: string, error: unknown): string {
  if (error instanceof TypeError && /network request failed/i.test(error.message)) {
    return `[${step}] Network request failed while contacting Supabase. Check your connection and Supabase settings.`;
  }

  if (error instanceof Error) {
    return `[${step}] ${error.message}`;
  }

  if (error && typeof error === 'object') {
    const maybe = error as { message?: unknown; code?: unknown; details?: unknown; hint?: unknown };
    const message = typeof maybe.message === 'string' ? maybe.message : 'Unknown error';
    const code = typeof maybe.code === 'string' ? ` (code: ${maybe.code})` : '';
    const details = typeof maybe.details === 'string' ? `\nDetails: ${maybe.details}` : '';
    const hint = typeof maybe.hint === 'string' ? `\nHint: ${maybe.hint}` : '';
    return `[${step}] ${message}${code}${details}${hint}`;
  }

  return `[${step}] Sign-up failed. Please try again.`;
}

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();
  const lowerBlockBy = Math.round(screenH * 0.65 * 0.25);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
  const [usernameCheckMessage, setUsernameCheckMessage] = useState('');

  useEffect(() => {
    const cleanUsername = username.trim();
    if (cleanUsername.length < 2) {
      setUsernameStatus('idle');
      setUsernameCheckMessage('');
      return;
    }

    let active = true;
    setUsernameStatus('checking');
    setUsernameCheckMessage('');

    const timer = setTimeout(() => {
      void (async () => {
        try {
          let { data, error } = await supabase
            .from('profiles')
            .select('id')
            .ilike('username', cleanUsername)
            .limit(1);

          if (error && isMissingUsernameColumnError(error)) {
            const legacy = await supabase
              .from('profiles')
              .select('id')
              .ilike('display_name', cleanUsername)
              .limit(1);
            data = legacy.data;
            error = legacy.error;
          }

          if (!active) return;
          if (error) {
            setUsernameStatus('available');
            setUsernameCheckMessage('Could not verify username uniqueness. We will check again on submit.');
            return;
          }
          setUsernameStatus((data?.length ?? 0) > 0 ? 'taken' : 'available');
          setUsernameCheckMessage('');
        } catch {
          if (!active) return;
          setUsernameStatus('available');
          setUsernameCheckMessage('Network issue while checking username. You can still try to sign up.');
        }
      })();
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [username]);

  const canSubmit = useMemo(() => {
    const cleanEmail = email.trim().toLowerCase();
    const emailOk = isValidEmail(cleanEmail) && hasValidEmailSuffix(cleanEmail);
    const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
    return (
      emailOk &&
      username.trim().length >= 2 &&
      usernameStatus === 'available' &&
      password.length > 3 &&
      passwordsMatch
    );
  }, [confirmPassword, email, password, username, usernameStatus]);

  const handleOAuthSignIn = async (provider: 'google' | 'facebook') => {
    setLoading(true);
    const redirectTo = Linking.createURL('auth/callback', { scheme: 'mybalikboxapp' });

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (!data?.url) throw new Error('Unable to start OAuth flow.');

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== 'success' || !result.url) return;

      const callbackUrl = new URL(result.url);
      const code = callbackUrl.searchParams.get('code');
      const oauthError = callbackUrl.searchParams.get('error_description');
      if (oauthError) throw new Error(oauthError);
      if (!code) throw new Error('No OAuth code returned.');

      const { data: exchanged, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) throw exchangeError;
      if (!exchanged?.user) throw new Error('OAuth session was not created.');

      const oauthUsername =
        (typeof exchanged.user.user_metadata?.display_name === 'string' &&
          exchanged.user.user_metadata.display_name) ||
        (typeof exchanged.user.user_metadata?.name === 'string' && exchanged.user.user_metadata.name) ||
        exchanged.user.email?.split('@')[0] ||
        null;
      await ensureUserBootstrap({
        userId: exchanged.user.id,
        username: oauthUsername,
        displayName: oauthUsername,
      });
      router.replace('/(tabs)');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Social sign-in failed. Please try again.';
      Alert.alert('OAuth error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();

    if (!isValidEmail(cleanEmail)) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }
    if (!hasValidEmailSuffix(cleanEmail)) {
      Alert.alert('Invalid email suffix', 'Use an email domain with a valid suffix (example: .com, .net).');
      return;
    }
    if (cleanUsername.length < 2) {
      Alert.alert('Invalid username', 'Username must be at least 2 characters.');
      return;
    }
    if (usernameStatus === 'taken') {
      Alert.alert('Username unavailable', 'That username is already taken. Try another one.');
      return;
    }
    if (password.length <= 3) {
      Alert.alert('Weak password', 'Password must be longer than 3 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Please confirm your password.');
      return;
    }

    setLoading(true);
    let step = 'signUp:create_user';
    try {
      step = 'signUp:create_user';
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { data: { display_name: cleanUsername } },
      });

      if (error) throw error;
      if (!data.user) throw new Error('Unable to create account right now.');

      // If signup doesn't return a session (common when email confirmation is enabled),
      // try immediate password sign-in so dev flows still continue when confirmation is off.
      let signedInUser = data.session?.user ?? null;
      if (!signedInUser) {
        step = 'signUp:sign_in_after_create';
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (!signInError && signInData.user) {
          signedInUser = signInData.user;
        }
      }

      if (signedInUser) {
        step = 'signUp:bootstrap_user';
        await ensureUserBootstrap({
          userId: signedInUser.id,
          username: cleanUsername,
          displayName: cleanUsername,
        });
        step = 'signUp:navigate_home';
        router.replace('/(tabs)');
        return;
      }

      Alert.alert(
        'Account created',
        'Your account was created but automatic sign-in is blocked until email confirmation is complete. Please confirm your email, then sign in.',
      );
    } catch (error) {
      console.error('Sign-up flow failed', { step, error });
      const message = formatSignUpError(step, error);
      Alert.alert('Sign-up error', message);
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
            <BalikBoxLogo width={LOGO_W} height={LOGO_H} />
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
                { paddingBottom: 20 + insets.bottom },
              ]}>
            <Text style={styles.title}>Getting Started</Text>
            <Text style={styles.subtitle}>Creating account to continue</Text>

            <Text style={styles.fieldLabel}>Email</Text>
            <View style={styles.inputWrap}>
              <MaterialIcons name="email" size={22} color="#8A8A8A" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                placeholder="Enter your email"
                placeholderTextColor="#9A9A9A"
                style={styles.input}
              />
            </View>

            <Text style={styles.fieldLabel}>Username</Text>
            <View style={styles.inputWrap}>
              <MaterialIcons name="person-outline" size={22} color="#8A8A8A" />
              <TextInput
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoComplete="username"
                textContentType="username"
                placeholder="Enter your username"
                placeholderTextColor="#9A9A9A"
                style={styles.input}
              />
            </View>
            {username.trim().length >= 2 ? (
              <Text style={styles.usernameHint}>
                {usernameStatus === 'checking'
                  ? 'Checking username...'
                  : usernameStatus === 'taken'
                    ? 'Username is already taken.'
                    : 'Username is available.'}
              </Text>
            ) : null}
            {usernameCheckMessage ? <Text style={styles.usernameWarn}>{usernameCheckMessage}</Text> : null}

            <Text style={styles.fieldLabel}>Password</Text>
            <View style={styles.inputWrap}>
              <MaterialIcons name="lock-outline" size={22} color="#8A8A8A" />
              <TextInput
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                secureTextEntry
                autoComplete="new-password"
                textContentType="newPassword"
                placeholder="Enter your password"
                placeholderTextColor="#9A9A9A"
                style={styles.input}
              />
            </View>

            <Text style={styles.fieldLabel}>Confirm Password</Text>
            <View style={styles.inputWrap}>
              <MaterialIcons name="lock-outline" size={22} color="#8A8A8A" />
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoCapitalize="none"
                secureTextEntry
                autoComplete="new-password"
                textContentType="newPassword"
                placeholder="Confirm your password"
                placeholderTextColor="#9A9A9A"
                style={styles.input}
              />
            </View>

            <Pressable
              style={[styles.signUpBtn, (!canSubmit || loading) && styles.signUpBtnDisabled]}
              disabled={!canSubmit || loading}
              onPress={() => void handleSignUp()}
              accessibilityRole="button">
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.signUpBtnText}>Sign Up</Text>}
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or sign up with</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialRow}>
              <Pressable
                style={styles.socialBtn}
                disabled={loading}
                onPress={() => void handleOAuthSignIn('google')}
                accessibilityRole="button">
                <Text style={styles.socialLetter}>G</Text>
              </Pressable>
              <Pressable
                style={styles.socialBtn}
                disabled={loading}
                onPress={() => void handleOAuthSignIn('facebook')}
                accessibilityRole="button">
                <Text style={styles.socialLetter}>f</Text>
              </Pressable>
            </View>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Pressable onPress={() => router.replace('/sign-in')} accessibilityRole="link">
                <Text style={styles.footerLink}>Sign In</Text>
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
    alignItems: 'stretch',
  },
  logoLayer: {
    zIndex: 1,
    alignSelf: 'flex-end',
    paddingRight: 16,
    alignItems: 'flex-end',
    width: '100%',
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
    paddingTop: 22,
  },
  title: { fontSize: 26, fontWeight: '800', color: '#1A1A1A' },
  subtitle: { marginTop: 4, fontSize: 14, color: '#5C5346', marginBottom: 12 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3A3328',
    marginBottom: 6,
    marginTop: 8,
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
    height: 48,
  },
  input: { flex: 1, fontSize: 16, color: '#2A2A2A' },
  usernameHint: { marginTop: 6, fontSize: 12, color: '#3A3328' },
  usernameWarn: { marginTop: 4, fontSize: 11, color: '#6B5B4A' },
  signUpBtn: {
    marginTop: 18,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#94B2C1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signUpBtnDisabled: { opacity: 0.5 },
  signUpBtnText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
    marginBottom: 12,
  },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: '#C9B8A4' },
  dividerText: { fontSize: 12, color: '#6B5B4A', fontWeight: '600' },
  socialRow: { flexDirection: 'row', gap: 14, justifyContent: 'center' },
  socialBtn: {
    flex: 1,
    maxWidth: 160,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E4DED4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialLetter: { fontSize: 22, fontWeight: '700', color: '#444' },
  footerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 16,
  },
  footerText: { fontSize: 15, color: '#3A3328' },
  footerLink: { fontSize: 15, fontWeight: '700', color: '#C98A35' },
});
