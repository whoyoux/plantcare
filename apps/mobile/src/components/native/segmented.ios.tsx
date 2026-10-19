import { Host, Picker, Text } from '@expo/ui/swift-ui';
import { pickerStyle, tag } from '@expo/ui/swift-ui/modifiers';

import type { SegmentedProps } from './segmented.types';

/** A native segmented control (UISegmentedControl through SwiftUI). */
export function Segmented<T extends string>({ options, selection, onChange }: SegmentedProps<T>) {
  return (
    <Host matchContents={{ vertical: true }}>
      <Picker selection={selection} onSelectionChange={onChange} modifiers={[pickerStyle('segmented')]}>
        {options.map((option) => (
          <Text key={option.value} modifiers={[tag(option.value)]}>
            {option.label}
          </Text>
        ))}
      </Picker>
    </Host>
  );
}
