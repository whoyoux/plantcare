import type { ComponentProps } from 'react';
import type { Stack } from 'expo-router';

type ScreenOptions = NonNullable<ComponentProps<typeof Stack>['screenOptions']>;

/** iOS large titles with a transparent (glass) header; shared by every tab's stack. */
export const largeTitleScreenOptions = {
  headerLargeTitleEnabled: true,
  headerTransparent: true,
  headerShadowVisible: false,
  headerLargeTitleShadowVisible: false,
  headerBackButtonDisplayMode: 'minimal',
} satisfies ScreenOptions;
