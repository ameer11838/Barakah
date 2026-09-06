import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
  useFonts,
} from '@expo-google-fonts/dm-sans';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';

import { ToastHost } from '@/components/ToastHost';
import { useTheme } from '@/lib/theme';
import { ensureNotificationPermission } from '@/lib/notify';
import { useBarakahStore } from '@/store/barakahStore';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });
  const setHydrated = useBarakahStore((s) => s.setHydrated);
  const { palette: c } = useTheme();

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      setHydrated(true);
      SplashScreen.hideAsync();
    }
  }, [loaded, setHydrated]);

  // Ask once, at launch. A refusal is a normal answer — notices still land in
  // the in-app feed, so nothing downstream depends on this succeeding.
  useEffect(() => {
    void ensureNotificationPermission();
  }, []);

  if (!loaded) return null;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {/* 'auto' inverts the bar contents against the active scheme, so this
          stays correct when the user flips the theme without a reload. */}
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="request" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="request/[id]" options={{ presentation: 'card', headerShown: false }} />
        <Stack.Screen name="partners" options={{ presentation: 'card', headerShown: false }} />
        <Stack.Screen name="help-settings" options={{ presentation: 'card', headerShown: false }} />
        <Stack.Screen
          name="notifications"
          options={{ presentation: 'card', headerShown: false }}
        />
      </Stack>
      <ToastHost />
    </View>
  );
}
