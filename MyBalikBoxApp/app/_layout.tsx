import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="sign-up" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="create-box" options={{ headerShown: false }} />
        <Stack.Screen name="join-box" options={{ headerShown: false }} />
        <Stack.Screen name="box-created" options={{ headerShown: false }} />
        <Stack.Screen name="box-joined" options={{ headerShown: false }} />
        <Stack.Screen name="box-overview" options={{ headerShown: false, title: 'Box Overview' }} />
        <Stack.Screen name="box-finalized" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="about-application" options={{ headerShown: false }} />
        <Stack.Screen name="help-faq" options={{ headerShown: false }} />
        <Stack.Screen name="password-page" options={{ headerShown: false }} />
        <Stack.Screen name="account-information" options={{ headerShown: false }} />
        <Stack.Screen name="change-phone" options={{ headerShown: false }} />
        <Stack.Screen name="change-email" options={{ headerShown: false }} />
        <Stack.Screen name="verify-email" options={{ headerShown: false }} />
        <Stack.Screen name="verify-phone" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
