import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import type { SFSymbol } from 'expo-symbols';
import { SymbolView } from 'expo-symbols';
import { useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { Image } from '@/components/image';
import { Button } from '@/components/native/button';
import type { Language } from '@/i18n';
import { ApiError } from '@/lib/api';
import { identifyPhoto, type IdentifyResponse } from '@/lib/identify';
import { historyKeys, useDeleteIdentification, useSavedIdentification } from '@/lib/identifications';

type Result = IdentifyResponse['result'];

const careRows = [
  { key: 'watering', icon: 'drop.fill' },
  { key: 'light', icon: 'sun.max.fill' },
  { key: 'temperature', icon: 'thermometer.medium' },
] as const satisfies readonly { key: keyof NonNullable<Result['care']>; icon: SFSymbol }[];

const KNOWN_ERRORS = ['NOT_A_PLANT', 'DAILY_LIMIT_REACHED', 'RATE_LIMITED'] as const;

/**
 * The result sheet. Opened with `uri` for a new photo (uploads and identifies it), or with `id` for
 * an identification from history.
 */
export default function ResultSheet() {
  const { uri, id } = useLocalSearchParams<{ uri?: string; id?: string }>();
  return id ? <SavedResult id={id} /> : <NewResult uri={uri!} />;
}

function NewResult({ uri }: { uri: string }) {
  const { i18n } = useTranslation();
  const queryClient = useQueryClient();

  // A query (not a mutation) so the sheet survives re-renders without uploading twice.
  const identification = useQuery({
    queryKey: ['identify', uri],
    queryFn: () => identifyPhoto(uri, i18n.language as Language),
    staleTime: Infinity,
    retry: false,
  });

  useEffect(() => {
    if (identification.isSuccess) void queryClient.invalidateQueries({ queryKey: historyKeys.all });
  }, [identification.isSuccess, queryClient]);

  return (
    <Sheet photo={{ uri }}>
      {identification.isPending && <Identifying />}
      {identification.isError && <Failure error={identification.error} onRetry={() => void identification.refetch()} />}
      {identification.data && (
        <>
          <Details result={identification.data.result} />
          <DeleteButton id={identification.data.id} />
        </>
      )}
    </Sheet>
  );
}

function SavedResult({ id }: { id: string }) {
  const saved = useSavedIdentification(id);

  return (
    <Sheet photo={saved.data && { uri: saved.data.imageUrl, cacheKey: id }}>
      {saved.isPending && <ActivityIndicator className="py-6" />}
      {saved.isError && <Failure error={saved.error} onRetry={() => void saved.refetch()} />}
      {saved.data && (
        <>
          <Details result={saved.data.result} />
          <DeleteButton id={id} />
        </>
      )}
    </Sheet>
  );
}

function Sheet({ photo, children }: { photo?: { uri: string; cacheKey?: string }; children: ReactNode }) {
  return (
    <ScrollView contentContainerClassName="gap-6 px-5 pb-10 pt-4" contentInsetAdjustmentBehavior="automatic">
      {photo ? (
        <Image source={photo} contentFit="cover" className="aspect-[4/3] w-full rounded-3xl" />
      ) : (
        <View className="aspect-[4/3] w-full rounded-3xl bg-card" />
      )}
      {children}
    </ScrollView>
  );
}

function DeleteButton({ id }: { id: string }) {
  const { t } = useTranslation();
  const remove = useDeleteIdentification();

  function confirm() {
    Alert.alert(t('result.deleteTitle'), t('result.deleteMessage'), [
      { text: t('result.cancel'), style: 'cancel' },
      {
        text: t('result.deleteConfirm'),
        style: 'destructive',
        onPress: () =>
          remove.mutate(id, {
            onSuccess: () => router.back(),
            onError: () => Alert.alert(t('result.deleteFailed')),
          }),
      },
    ]);
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={confirm}
      disabled={remove.isPending}
      className="items-center rounded-2xl bg-card py-3.5 active:opacity-70"
    >
      <Text className="text-[17px] text-danger">{t('result.delete')}</Text>
    </Pressable>
  );
}

function Identifying() {
  const { t } = useTranslation();
  return (
    <View className="flex-row items-center justify-center gap-3 py-6">
      <ActivityIndicator />
      <Text className="text-[17px] text-muted">{t('result.identifying')}</Text>
    </View>
  );
}

function Failure({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const { t } = useTranslation();
  const code = error instanceof ApiError ? error.code : undefined;
  const known = KNOWN_ERRORS.find((value) => value === code);
  return (
    <View className="gap-4 py-2">
      <Text className="text-center text-[17px] leading-6 text-foreground">
        {known ? t(`result.errors.${known}`) : t('result.errors.generic')}
      </Text>
      {known !== 'DAILY_LIMIT_REACHED' && <Button label={t('result.retry')} onPress={onRetry} variant="secondary" />}
    </View>
  );
}

function Details({ result }: { result: Result }) {
  const { t } = useTranslation();
  const accent = useCSSVariable('--color-accent');
  const tint = typeof accent === 'string' ? accent : undefined;

  return (
    <>
      <View className="gap-1">
        <Text className="font-rounded text-[30px] font-extrabold leading-9 text-foreground">
          {result.commonName ?? result.scientificName}
        </Text>
        <Text className="font-latin text-[19px] italic text-muted">
          {result.scientificName}
          {result.family && <Text className="font-latin text-[15px] not-italic text-muted"> · {result.family}</Text>}
        </Text>
        <View className="mt-2 self-start rounded-full bg-accent-soft px-3 py-1">
          <Text className="text-[13px] font-semibold text-accent">
            {t('result.match', { value: Math.round(result.confidence * 100) })}
          </Text>
        </View>
      </View>

      {result.care && (
        <View className="gap-2">
          <Text className="font-rounded text-[20px] font-bold text-foreground">{t('result.care')}</Text>
          <View className="overflow-hidden rounded-2xl bg-card">
            {careRows.map(({ key, icon }, index) => (
              <View
                key={key}
                className={`flex-row items-center gap-3 px-4 py-3 ${index > 0 ? 'border-t border-separator' : ''}`}
              >
                <SymbolView name={icon} size={22} tintColor={tint} />
                <View className="flex-1">
                  <Text className="text-[13px] text-muted">{t(`result.${key}`)}</Text>
                  <Text className="text-[17px] text-foreground">{result.care?.[key]}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {result.alternatives.length > 0 && (
        <View className="gap-2">
          <Text className="font-rounded text-[20px] font-bold text-foreground">{t('result.alternatives')}</Text>
          <View className="overflow-hidden rounded-2xl bg-card">
            {result.alternatives.map((alternative, index) => (
              <View
                key={alternative.scientificName}
                className={`flex-row items-center justify-between gap-3 px-4 py-3 ${index > 0 ? 'border-t border-separator' : ''}`}
              >
                <View className="flex-1">
                  <Text className="text-[17px] text-foreground">
                    {alternative.commonName ?? alternative.scientificName}
                  </Text>
                  <Text className="font-latin text-[15px] italic text-muted">{alternative.scientificName}</Text>
                </View>
                <Text className="text-[15px] text-muted">{Math.round(alternative.confidence * 100)}%</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </>
  );
}
