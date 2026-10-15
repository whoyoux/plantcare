import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import type { FormProps, FormRowProps, FormSectionProps } from './form.types';

export function Form({ children }: FormProps) {
  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-6 px-4 py-6" contentInsetAdjustmentBehavior="automatic">
      {children}
    </ScrollView>
  );
}

function withSeparators(children: ReactNode) {
  const items = Children.toArray(children).filter(isValidElement);
  return items.map((child, index) => (
    <Fragment key={child.key ?? index}>
      {index > 0 && <View className="ml-4 h-px bg-separator" />}
      {child}
    </Fragment>
  ));
}

export function FormSection({ title, footer, children }: FormSectionProps) {
  return (
    <View className="gap-1.5">
      {title && <Text className="px-4 text-[13px] uppercase text-muted">{title}</Text>}
      <View className="overflow-hidden rounded-xl bg-card">{withSeparators(children)}</View>
      {footer && <Text className="px-4 text-[13px] text-muted">{footer}</Text>}
    </View>
  );
}

export function FormRow({ label, value, onPress, disabled = false }: FormRowProps) {
  return (
    <Pressable
      disabled={!onPress || disabled}
      onPress={onPress}
      className={`min-h-11 flex-row items-center justify-between px-4 py-3 active:bg-separator ${disabled ? 'opacity-40' : ''}`}
    >
      <Text className="text-[17px] text-foreground">{label}</Text>
      {value !== undefined && <Text className="text-[17px] text-muted">{value}</Text>}
    </Pressable>
  );
}
