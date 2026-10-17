import { Host, Label, Button as SwiftUIButton } from '@expo/ui/swift-ui';
import { buttonStyle, controlSize, disabled, frame, tint } from '@expo/ui/swift-ui/modifiers';
import { useCSSVariable } from 'uniwind';

import type { ButtonProps } from './button.types';

export function Button({
  label,
  onPress,
  systemImage,
  variant = 'prominent',
  tone = 'accent',
  disabled: isDisabled = false,
}: ButtonProps) {
  // Filled buttons need a darker green than the accent so their white label stays readable.
  const fill = useCSSVariable('--color-accent-fill');
  const accent = useCSSVariable('--color-accent');
  const danger = useCSSVariable('--color-danger');
  const color = variant === 'prominent' ? fill : tone === 'danger' ? danger : accent;

  return (
    <Host matchContents={{ vertical: true }}>
      <SwiftUIButton
        onPress={onPress}
        modifiers={[
          buttonStyle(variant === 'prominent' ? 'glassProminent' : 'glass'),
          controlSize('large'),
          ...(typeof color === 'string' ? [tint(color)] : []),
          disabled(isDisabled),
        ]}
      >
        {/* The frame goes on the label so the glass background spans the full width. */}
        <Label title={label} systemImage={systemImage} modifiers={[frame({ maxWidth: Number.POSITIVE_INFINITY })]} />
      </SwiftUIButton>
    </Host>
  );
}
