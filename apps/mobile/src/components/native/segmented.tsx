import { Pressable, Text, View } from 'react-native';

import type { SegmentedProps } from './segmented.types';

export function Segmented<T extends string>({ options, selection, onChange }: SegmentedProps<T>) {
  return (
    <View className="flex-row rounded-xl bg-card p-1">
      {options.map((option) => {
        const selected = option.value === selection;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            className={`flex-1 items-center rounded-lg py-1.5 ${selected ? 'bg-background' : ''}`}
          >
            <Text className={`text-[14px] font-semibold ${selected ? 'text-foreground' : 'text-muted'}`}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
