import {
  Button,
  Form as SwiftUIForm,
  Host,
  Image,
  Label,
  LabeledContent,
  Section,
  Text,
} from '@expo/ui/swift-ui';
import { disabled, foregroundStyle } from '@expo/ui/swift-ui/modifiers';
import { useCSSVariable } from 'uniwind';

import type { FormProps, FormRowProps, FormSectionProps } from './form.types';

export function Form({ children }: FormProps) {
  return (
    <Host style={{ flex: 1 }}>
      <SwiftUIForm>{children}</SwiftUIForm>
    </Host>
  );
}

export function FormSection({ title, footer, children }: FormSectionProps) {
  return (
    <Section title={title} footer={footer ? <Text>{footer}</Text> : undefined}>
      {children}
    </Section>
  );
}

const primary = foregroundStyle({ type: 'hierarchical', style: 'primary' });
const secondary = foregroundStyle({ type: 'hierarchical', style: 'secondary' });

export function FormRow({ label, value, systemImage, onPress, disabled: isDisabled = false }: FormRowProps) {
  const accent = useCSSVariable('--color-accent');
  // Accent icon + primary title, the same whether or not the row is tappable.
  const icon = systemImage ? (
    <Image systemName={systemImage} modifiers={typeof accent === 'string' ? [foregroundStyle(accent)] : []} />
  ) : undefined;
  const content = (
    <LabeledContent label={<Label title={label} icon={icon} modifiers={[primary]} />}>
      <Text modifiers={[secondary]}>{value ?? ''}</Text>
    </LabeledContent>
  );

  if (!onPress) return content;

  return (
    <Button onPress={onPress} modifiers={[disabled(isDisabled), primary]}>
      {content}
    </Button>
  );
}
