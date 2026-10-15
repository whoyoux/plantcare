import { ContentUnavailableView, Host } from '@expo/ui/swift-ui';

import type { EmptyStateProps } from './empty-state.types';

export function EmptyState({ title, description, systemImage }: EmptyStateProps) {
  return (
    <Host style={{ flex: 1 }}>
      <ContentUnavailableView title={title} description={description} systemImage={systemImage} />
    </Host>
  );
}
