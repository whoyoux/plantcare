import '@/global.css';
import '@/i18n';

import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'react-native';

import { authClient } from '@/lib/auth-client';
import { applyStoredTheme } from '@/lib/dev-preferences';
import { queryClient } from '@/lib/query-client';

applyStoredTheme();

// Keep the splash up until we know whether there is a session, so signed-in users never see sign-in.
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { t } = useTranslation();
  const { data: session, isPending } = authClient.useSession();
  const signedIn = Boolean(session);

  useEffect(() => {
    if (!isPending) void SplashScreen.hideAsync();
  }, [isPending]);

  if (isPending) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          {/* The app is for signed-in users only; signing out or deleting the account lands on sign-in. */}
          <Stack.Protected guard={signedIn}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="result"
              options={{
                presentation: 'formSheet',
                sheetAllowedDetents: [0.6, 1],
                sheetGrabberVisible: true,
                sheetCornerRadius: 28,
                headerShown: true,
                headerTransparent: true,
                title: t('result.title'),
                contentStyle: { backgroundColor: 'transparent' },
              }}
            />
          </Stack.Protected>
          {/* After signing in, land on the camera (`/`), not the first tab folder alphabetically. */}
          <Stack.Protected guard={!signedIn} redirectTo="/">
            <Stack.Screen name="sign-in" options={{ animation: 'fade' }} />
          </Stack.Protected>
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
