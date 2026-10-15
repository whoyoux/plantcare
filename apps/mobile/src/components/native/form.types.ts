import type { ReactNode } from 'react';
import type { SFSymbol } from 'expo-symbols';

export type FormProps = {
  /** Large navigation title. On iOS the form owns its SwiftUI navigation bar, so the title collapses on scroll. */
  title?: string;
  children: ReactNode;
};

export type FormSectionProps = {
  title?: string;
  footer?: string;
  children: ReactNode;
};

export type FormRowProps = {
  label: string;
  value?: string;
  systemImage?: SFSymbol;
  /** Makes the row tappable (shown as a button). */
  onPress?: () => void;
  disabled?: boolean;
  /** Red, destructive action (e.g. delete account). */
  destructive?: boolean;
};

export type FormPickerOption<T extends string> = { value: T; label: string };

export type FormPickerProps<T extends string> = {
  label: string;
  systemImage?: SFSymbol;
  selection: T;
  options: readonly FormPickerOption<T>[];
  onChange: (value: T) => void;
};
