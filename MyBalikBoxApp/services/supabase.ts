import AsyncStorage from '@react-native-async-storage/async-storage';
<<<<<<< HEAD
import { createClient, type SupportedStorage } from '@supabase/supabase-js';
=======
import { createClient } from '@supabase/supabase-js';
>>>>>>> 2c0ea69 (Made changes to dropoff)
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase env missing: set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env',
  );
}

const isServer = typeof window === 'undefined';

/** SSR-safe no-op storage (expo-router static web render has no window). */
const noopAuthStorage: SupportedStorage = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
};

function createAuthStorage(): SupportedStorage {
  // Node SSR — never touch AsyncStorage (it requires `window`).
  if (isServer) {
    return noopAuthStorage;
  }

  if (Platform.OS === 'web') {
    return {
      getItem: (key) => Promise.resolve(window.localStorage.getItem(key)),
      setItem: (key, value) => {
        window.localStorage.setItem(key, value);
        return Promise.resolve();
      },
      removeItem: (key) => {
        window.localStorage.removeItem(key);
        return Promise.resolve();
      },
    };
  }

  return AsyncStorage;
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
<<<<<<< HEAD
    storage: createAuthStorage(),
    autoRefreshToken: !isServer,
    persistSession: !isServer,
    detectSessionInUrl: !isServer && Platform.OS === 'web',
=======
    storage: Platform.OS === 'web' ? (typeof localStorage !== 'undefined' ? localStorage : undefined) : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
>>>>>>> 2c0ea69 (Made changes to dropoff)
  },
});
