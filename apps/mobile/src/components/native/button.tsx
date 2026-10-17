import { Pressable, Text } from 'react-native';

import type { ButtonProps } from './button.types';

export function Button({ label, onPress, variant = 'prominent', tone = 'accent', disabled = false }: ButtonProps) {
  const prominent = variant === 'prominent';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      className={`items-center rounded-full px-5 py-3.5 active:opacity-70 ${prominent ? 'bg-accent-fill' : 'bg-card'} ${disabled ? 'opacity-40' : ''}`}
    >
      <Text
        className={`text-[17px] font-semibold ${prominent ? 'text-white' : tone === 'danger' ? 'text-danger' : 'text-accent'}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
