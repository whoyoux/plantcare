import type { SFSymbol } from 'expo-symbols';

export type ButtonProps = {
  label: string;
  onPress: () => void;
  /** SF Symbol shown before the label (iOS). */
  systemImage?: SFSymbol;
  variant?: 'prominent' | 'secondary';
  /** `danger` colours a secondary button's label red (destructive actions). */
  tone?: 'accent' | 'danger';
  disabled?: boolean;
};
