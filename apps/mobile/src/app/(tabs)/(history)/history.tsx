import { Stack } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { EmptyState } from '@/components/native/empty-state';

export default function HistoryScreen() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  return (
    <View className="flex-1 bg-background">
      <Stack.SearchBar
        placeholder={t('history.searchPlaceholder')}
        onChangeText={(event) => setQuery(event.nativeEvent.text)}
      />
      {/* The list arrives with the history endpoint (step 8); until then it is always empty. */}
      {query ? (
        <EmptyState title={t('history.noResultsTitle', { query })} systemImage="magnifyingglass" />
      ) : (
        <EmptyState title={t('history.emptyTitle')} description={t('history.emptyDescription')} systemImage="leaf" />
      )}
    </View>
  );
}
