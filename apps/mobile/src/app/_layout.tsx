import '@/global.css';
import '@/i18n';

import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { authClient } from '@/lib/auth-client';
import { applyStoredTheme } from '@/lib/dev-preferences';
import { queryClient } from '@/lib/query-client';

applyStoredTheme();

// Keep the splash up until we know whether there is a session, so signed-in users never see sign-in.
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { data: session, isPending } = authClient.useSession();
  const signedIn = Boolean(session);
  // Only the first session check hides the app (behind the splash). Better Auth reports
  // `isPending` again on every refetch while signed out (after signing out, while signing in);
  // hiding then made the screen flash.
  const [loaded, setLoaded] = useState(false);
  if (!isPending && !loaded) setLoaded(true);

  useEffect(() => {
    if (loaded) void SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            {/* The app is for signed-in users only; signing out or deleting the account lands on sign-in. */}
            <Stack.Protected guard={signedIn}>
              <Stack.Screen name="(tabs)" />
              {/* Full height so the photo can run edge to edge; swipe down still dismisses it. */}
              <Stack.Screen name="result" options={{ presentation: 'modal' }} />
              {/* Opened from the gear on Home; the SwiftUI form draws its own title bar. */}
              <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
            </Stack.Protected>
            {/* After signing in, land on the camera (`/`), not the first tab folder alphabetically. */}
            <Stack.Protected guard={!signedIn} redirectTo="/">
              <Stack.Screen name="sign-in" options={{ animation: 'fade' }} />
            </Stack.Protected>
          </Stack>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
