import { router } from 'expo-router';
import { Alert } from 'react-native';

import { clearActiveBoxStorage } from '@/services/active-box';
import { supabase } from '@/services/supabase';

export async function signOutUser(): Promise<void> {
  await clearActiveBoxStorage();
  const { error } = await supabase.auth.signOut();
  if (error) {
    Alert.alert('Sign out failed', error.message);
    return;
  }
  router.replace('/sign-in');
}
