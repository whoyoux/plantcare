import { Text, View } from 'react-native';

import type { EmptyStateProps } from './empty-state.types';

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center gap-2 px-8">
      <Text className="text-center text-[22px] font-bold text-foreground">{title}</Text>
      {description && <Text className="text-center text-[15px] text-muted">{description}</Text>}
    </View>
  );
}
