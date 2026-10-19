import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, SectionList, Text, View } from 'react-native';

import { HerbariumView } from '@/components/herbarium';
import { Button } from '@/components/native/button';
import { EmptyState } from '@/components/native/empty-state';
import { Segmented } from '@/components/native/segmented';
import { PlantRow } from '@/components/plant-row';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useHistory } from '@/lib/identifications';
import { groupByDay } from '@/lib/sections';

type HistoryView = 'history' | 'herbarium';

/** History and the Herbarium share the tab: a switcher on top, one search bar for both. */
export default function HistoryScreen() {
  const { t } = useTranslation();
  // `at` changes with every link from the home card, so it reopens the herbarium each time.
  const params = useLocalSearchParams<{ view?: string; at?: string }>();
  const linked: HistoryView = params.view === 'herbarium' ? 'herbarium' : 'history';
  // The user's pick holds until the next link arrives (a new `at`).
  const [choice, setChoice] = useState<{ at?: string; view: HistoryView }>({ at: params.at, view: linked });
  const view = choice.at === params.at ? choice.view : linked;
  const setView = (next: HistoryView) => setChoice({ at: params.at, view: next });
  const [query, setQuery] = useState('');
  const search = useDebouncedValue(query.trim());

  const switcher = (
    <View className="px-4">
      <Segmented
        options={[
          { value: 'history', label: t('herbarium.viewHistory') },
          { value: 'herbarium', label: t('herbarium.viewHerbarium') },
        ]}
        selection={view}
        onChange={setView}
      />
    </View>
  );

  return (
    <>
      <Stack.SearchBar
        placeholder={t('history.searchPlaceholder')}
        onChangeText={(event) => setQuery(event.nativeEvent.text)}
      />
      {view === 'history' ? (
        <HistoryList search={search} header={switcher} />
      ) : (
        <HerbariumView search={search} header={switcher} />
      )}
    </>
  );
}

function HistoryList({ search, header }: { search: string; header: ReactNode }) {
  const { t, i18n } = useTranslation();
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

  // Empty and error states are static screens: an empty list stretched to the screen height
  // would still scroll by the large title and tab bar insets (and that minimizes the tab bar).
  if (!history.isPending && items.length === 0) {
    return (
      <View className="flex-1 bg-background">
        <View className="pt-2">{header}</View>
        <View className="flex-1">
          {history.isError ? (
            <View className="flex-1 gap-4 px-6">
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
          )}
        </View>
      </View>
    );
  }

  // The list must be the screen's first view so iOS collapses the large title and search bar on scroll.
  return (
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
      contentContainerClassName="pb-8"
      onEndReached={() => {
        if (history.hasNextPage && !history.isFetchingNextPage) void history.fetchNextPage();
      }}
      onEndReachedThreshold={0.5}
      refreshing={pulling}
      onRefresh={() => void refresh()}
      ListFooterComponent={history.isFetchingNextPage ? <ActivityIndicator className="py-4" /> : undefined}
      ListHeaderComponent={<View className="pb-1 pt-2">{header}</View>}
      ListEmptyComponent={history.isPending ? <ActivityIndicator className="py-10" /> : undefined}
    />
  );
}
