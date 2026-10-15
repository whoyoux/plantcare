import {
  Button,
  Form as SwiftUIForm,
  Host,
  Image,
  Label,
  LabeledContent,
  NavigationStack,
  Picker,
  Section,
  Text,
} from '@expo/ui/swift-ui';
import {
  disabled,
  foregroundStyle,
  navigationBarTitleDisplayMode,
  navigationTitle,
  pickerStyle,
  tag,
} from '@expo/ui/swift-ui/modifiers';
import { useCSSVariable } from 'uniwind';

import type { FormPickerProps, FormProps, FormRowProps, FormSectionProps } from './form.types';

export function Form({ title, children }: FormProps) {
  if (!title) {
    return (
      <Host style={{ flex: 1 }}>
        <SwiftUIForm>{children}</SwiftUIForm>
      </Host>
    );
  }

  // The RN stack header can't follow a SwiftUI scroll view, so the form brings its own native
  // navigation bar: the large title collapses into the glass bar while the list scrolls.
  return (
    <Host style={{ flex: 1 }} ignoreSafeArea="all">
      <NavigationStack>
        <SwiftUIForm modifiers={[navigationTitle(title), navigationBarTitleDisplayMode('large')]}>
          {children}
        </SwiftUIForm>
      </NavigationStack>
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

function RowIcon({ systemImage }: { systemImage: NonNullable<FormRowProps['systemImage']> }) {
  const accent = useCSSVariable('--color-accent');
  return <Image systemName={systemImage} modifiers={typeof accent === 'string' ? [foregroundStyle(accent)] : []} />;
}

export function FormRow({
  label,
  value,
  systemImage,
  onPress,
  disabled: isDisabled = false,
  destructive = false,
}: FormRowProps) {
  // Accent icon + primary title, the same whether or not the row is tappable.
  const content = (
    <LabeledContent
      label={
        <Label
          title={label}
          icon={systemImage ? <RowIcon systemImage={systemImage} /> : undefined}
          modifiers={[primary]}
        />
      }
    >
      <Text modifiers={[secondary]}>{value ?? ''}</Text>
    </LabeledContent>
  );

  if (!onPress) return content;

  if (destructive) {
    return (
      <Button role="destructive" onPress={onPress} modifiers={[disabled(isDisabled)]}>
        <Label title={label} systemImage={systemImage} />
      </Button>
    );
  }

  return (
    <Button onPress={onPress} modifiers={[disabled(isDisabled), primary]}>
      {content}
    </Button>
  );
}

export function FormPicker<T extends string>({ label, systemImage, selection, options, onChange }: FormPickerProps<T>) {
  return (
    <Picker
      label={
        <Label
          title={label}
          icon={systemImage ? <RowIcon systemImage={systemImage} /> : undefined}
          modifiers={[primary]}
        />
      }
      selection={selection}
      onSelectionChange={onChange}
      modifiers={[pickerStyle('menu')]}
    >
      {options.map((option) => (
        <Text key={option.value} modifiers={[tag(option.value)]}>
          {option.label}
        </Text>
      ))}
    </Picker>
  );
}
