import {
  Button,
  Form as SwiftUIForm,
  Host,
  Label,
  LabeledContent,
  Section,
  Text,
} from '@expo/ui/swift-ui';
import { disabled, foregroundStyle } from '@expo/ui/swift-ui/modifiers';

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

export function FormRow({ label, value, systemImage, onPress, disabled: isDisabled = false }: FormRowProps) {
  const title = <Label title={label} systemImage={systemImage} />;
  const content = (
    <LabeledContent label={title}>
      <Text modifiers={[foregroundStyle({ type: 'hierarchical', style: 'secondary' })]}>{value ?? ''}</Text>
    </LabeledContent>
  );

  if (!onPress) return content;

  return (
    <Button onPress={onPress} modifiers={[disabled(isDisabled), foregroundStyle({ type: 'hierarchical', style: 'primary' })]}>
      {content}
    </Button>
  );
}
