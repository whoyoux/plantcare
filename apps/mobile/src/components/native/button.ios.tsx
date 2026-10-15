import { Host, Label, Button as SwiftUIButton } from '@expo/ui/swift-ui';
import { buttonStyle, controlSize, disabled, frame, tint } from '@expo/ui/swift-ui/modifiers';
import { useCSSVariable } from 'uniwind';

import type { ButtonProps } from './button.types';

export function Button({ label, onPress, systemImage, variant = 'prominent', disabled: isDisabled = false }: ButtonProps) {
  const accent = useCSSVariable('--color-accent');

  return (
    <Host matchContents={{ vertical: true }}>
      <SwiftUIButton
        onPress={onPress}
        modifiers={[
          buttonStyle(variant === 'prominent' ? 'glassProminent' : 'glass'),
          controlSize('large'),
          ...(typeof accent === 'string' ? [tint(accent)] : []),
          disabled(isDisabled),
        ]}
      >
        {/* The frame goes on the label so the glass background spans the full width. */}
        <Label title={label} systemImage={systemImage} modifiers={[frame({ maxWidth: Number.POSITIVE_INFINITY })]} />
      </SwiftUIButton>
    </Host>
  );
}
