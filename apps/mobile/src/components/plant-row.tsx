import { Link, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, Text, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import { Image } from '@/components/image';
import { api, ensureOk } from '@/lib/api';
import { historyKeys, useDeleteIdentification, type HistoryItem } from '@/lib/identifications';
import { queryClient } from '@/lib/query-client';
import { shareIdentification } from '@/lib/share';

export function openSaved(id: string) {
  router.push({ pathname: '/result', params: { id } });
}

/**
 * One identification in History: photo, names, match and time. Swipe left to delete; press and
 * hold for the iOS context menu (open, share, delete).
 */
export function PlantRow({ item }: { item: HistoryItem }) {
  const { t, i18n } = useTranslation();
  const remove = useDeleteIdentification();
  const time = new Intl.DateTimeFormat(i18n.language, { hour: 'numeric', minute: '2-digit' }).format(
    new Date(item.createdAt),
  );

  function deleteItem() {
    remove.mutate(item.id, { onError: () => Alert.alert(t('history.deleteFailed')) });
  }

  async function share() {
    // The list only has the summary; the share text needs the care tips from the full result.
    const detail = await queryClient.fetchQuery({
      queryKey: historyKeys.detail(item.id),
      queryFn: async () =>
        (await ensureOk(await api.v1.identifications[':id'].$get({ param: { id: item.id } }))).json(),
    });
    await shareIdentification({ id: item.id, photoUri: detail.imageUrl, result: detail.result }, t);
  }

  return (
    <ReanimatedSwipeable
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      renderRightActions={() => (
        <Pressable
          accessibilityRole="button"
          onPress={deleteItem}
          className="w-24 items-center justify-center bg-danger active:opacity-80"
        >
          <Text className="text-[15px] font-semibold text-white">{t('history.delete')}</Text>
        </Pressable>
      )}
    >
      <Link href={{ pathname: '/result', params: { id: item.id } }} asChild>
        <Link.Trigger>
          <Pressable className="flex-row items-center gap-3 bg-background px-4 py-2.5 active:bg-card">
            <Image
              source={{ uri: item.imageUrl, cacheKey: item.id }}
              contentFit="cover"
              transition={150}
              className="size-14 rounded-xl bg-card"
            />
            <View className="flex-1">
              <Text numberOfLines={1} className="text-[17px] font-semibold text-foreground">
                {item.commonName ?? item.scientificName}
              </Text>
              <Text numberOfLines={1} className="font-latin text-[15px] italic text-muted">
                {item.scientificName}
              </Text>
            </View>
            <View className="items-end gap-1">
              <View className="rounded-full bg-accent-soft px-2 py-0.5">
                <Text className="text-[12px] font-semibold text-accent">
                  {t('history.match', { value: Math.round(item.confidence * 100) })}
                </Text>
              </View>
              <Text className="text-[12px] text-muted">{time}</Text>
            </View>
          </Pressable>
        </Link.Trigger>
        <Link.Menu>
          <Link.MenuAction icon="arrow.up.forward.app" onPress={() => openSaved(item.id)}>
            {t('history.open')}
          </Link.MenuAction>
          <Link.MenuAction icon="square.and.arrow.up" onPress={() => void share()}>
            {t('history.share')}
          </Link.MenuAction>
          <Link.MenuAction icon="trash" destructive onPress={deleteItem}>
            {t('history.delete')}
          </Link.MenuAction>
        </Link.Menu>
      </Link>
    </ReanimatedSwipeable>
  );
}
