import { Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, SectionList, Text, View } from 'react-native';

import { Button } from '@/components/native/button';
import { EmptyState } from '@/components/native/empty-state';
import { PlantRow } from '@/components/plant-row';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useHistory } from '@/lib/identifications';
import { groupByDay } from '@/lib/sections';

export default function HistoryScreen() {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState('');
  const search = useDebouncedValue(query.trim());
  const history = useHistory(search);
  const items = useMemo(() => history.data?.pages.flatMap((page) => page.items) ?? [], [history.data]);
  const sections = useMemo(
    () =>
      groupByDay(items, i18n.language, {
        today: t('history.sections.today'),
        yesterday: t('history.sections.yesterday'),
        thisWeek: t('history.sections.thisWeek'),
      }),
    [items, i18n.language, t],
  );
  // Only a pull-to-refresh shows the spinner, not the quiet refetch when the screen opens.
  const [pulling, setPulling] = useState(false);

  async function refresh() {
    setPulling(true);
    await history.refetch();
    setPulling(false);
  }

  // The list must be the screen's first view so iOS collapses the large title and search bar on scroll.
  return (
    <>
      <Stack.SearchBar
        placeholder={t('history.searchPlaceholder')}
        onChangeText={(event) => setQuery(event.nativeEvent.text)}
      />
      <SectionList
        className="flex-1 bg-background"
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PlantRow item={item} />}
        renderSectionHeader={({ section }) => (
          <View className="bg-background px-4 pb-1.5 pt-4">
            <Text className="font-rounded text-[15px] font-bold text-muted">{section.title}</Text>
          </View>
        )}
        stickySectionHeadersEnabled
        contentInsetAdjustmentBehavior="automatic"
        // Fill the screen only for the empty state; otherwise a short list would still scroll.
        contentContainerClassName={`pb-8 ${items.length ? '' : 'grow'}`}
        onEndReached={() => {
          if (history.hasNextPage && !history.isFetchingNextPage) void history.fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        refreshing={pulling}
        onRefresh={() => void refresh()}
        ListFooterComponent={history.isFetchingNextPage ? <ActivityIndicator className="py-4" /> : undefined}
        ListEmptyComponent={
          history.isPending ? (
            <ActivityIndicator className="py-10" />
          ) : history.isError ? (
            <View className="flex-1 gap-4 px-6 pt-10">
              <EmptyState title={t('history.loadFailed')} systemImage="exclamationmark.triangle" />
              <Button label={t('history.retry')} variant="secondary" onPress={() => void history.refetch()} />
            </View>
          ) : search ? (
            <EmptyState title={t('history.noResultsTitle', { query: search })} systemImage="magnifyingglass" />
          ) : (
            <EmptyState
              title={t('history.emptyTitle')}
              description={t('history.emptyDescription')}
              systemImage="leaf"
            />
          )
        }
      />
    </>
  );
}
