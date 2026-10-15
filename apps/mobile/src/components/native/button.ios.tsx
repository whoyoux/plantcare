import { Button as SwiftUIButton, Host } from '@expo/ui/swift-ui';
import { buttonStyle, controlSize, disabled, frame, tint } from '@expo/ui/swift-ui/modifiers';
import { useCSSVariable } from 'uniwind';

import type { ButtonProps } from './button.types';

export function Button({ label, onPress, systemImage, variant = 'prominent', disabled: isDisabled = false }: ButtonProps) {
  const accent = useCSSVariable('--color-accent');

  return (
    <Host matchContents={{ vertical: true }}>
      <SwiftUIButton
        label={label}
        systemImage={systemImage}
        onPress={onPress}
        modifiers={[
          buttonStyle(variant === 'prominent' ? 'glassProminent' : 'glass'),
          controlSize('large'),
          frame({ maxWidth: Number.POSITIVE_INFINITY }),
          ...(typeof accent === 'string' ? [tint(accent)] : []),
          disabled(isDisabled),
        ]}
      />
    </Host>
  );
}
