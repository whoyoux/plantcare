import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import type { SFSymbol } from 'expo-symbols';
import { SymbolView } from 'expo-symbols';
import { useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import type { Toxicity, ToxicityLevel } from '@plantcare/shared';

import { Image } from '@/components/image';
import { Button } from '@/components/native/button';
import type { Language } from '@/i18n';
import { ApiError } from '@/lib/api';
import { BADGE_SYMBOLS, badgeName } from '@/lib/badges';
import { haptics } from '@/lib/haptics';
import { identifyPhotos, type IdentifyResponse } from '@/lib/identify';
import { useAddPlant } from '@/lib/plants';
import { shareIdentification } from '@/lib/share';
import { historyKeys, useDeleteIdentification, useSavedIdentification } from '@/lib/identifications';

type Result = IdentifyResponse['result'];

const careRows = [
  { key: 'watering', icon: 'drop.fill' },
  { key: 'light', icon: 'sun.max.fill' },
  { key: 'temperature', icon: 'thermometer.medium' },
] as const satisfies readonly { key: keyof NonNullable<Result['care']>; icon: SFSymbol }[];

const safetyRows = [
  { key: 'cats', icon: 'cat.fill' },
  { key: 'dogs', icon: 'dog.fill' },
  { key: 'people', icon: 'figure.and.child.holdinghands' },
] as const satisfies readonly { key: keyof Omit<Toxicity, 'note'>; icon: SFSymbol }[];

/** Text colour per level; the label says it too, so colour is never the only signal. */
const levelColor: Record<ToxicityLevel, string> = {
  safe: 'text-accent',
  mild: 'text-warning',
  toxic: 'text-danger',
  unknown: 'text-muted',
};

const KNOWN_ERRORS = ['NOT_A_PLANT', 'DAILY_LIMIT_REACHED', 'RATE_LIMITED'] as const;

/**
 * The result sheet. Opened with `uri` for a new photo (uploads and identifies it), or with `id` for
 * an identification from history.
 */
export default function ResultSheet() {
  const { photos, id } = useLocalSearchParams<{ photos?: string; id?: string }>();
  return id ? <SavedResult id={id} /> : <NewResult uris={JSON.parse(photos ?? '[]') as string[]} />;
}

function NewResult({ uris }: { uris: string[] }) {
  const uri = uris[0]!;
  const { i18n } = useTranslation();
  const queryClient = useQueryClient();

  // A query (not a mutation) so the sheet survives re-renders without uploading twice.
  const identification = useQuery({
    queryKey: ['identify', ...uris],
    queryFn: () => identifyPhotos(uris, i18n.language as Language),
    staleTime: Infinity,
    retry: false,
  });

  useEffect(() => {
    if (identification.isSuccess) void queryClient.invalidateQueries({ queryKey: historyKeys.all });
  }, [identification.isSuccess, queryClient]);

  // The moment the answer lands (the shutter's own haptic is muted while the camera runs).
  const { status, error } = identification;
  useEffect(() => {
    if (status === 'success') haptics.success();
    if (status === 'error') {
      const code = error instanceof ApiError ? error.code : undefined;
      if (KNOWN_ERRORS.some((known) => known === code)) haptics.warning();
      else haptics.error();
    }
  }, [status, error]);

  return (
    <Sheet photo={{ uri }}>
      {identification.isPending && <Identifying />}
      {identification.isError && <Failure error={identification.error} onRetry={() => void identification.refetch()} />}
      {identification.data && (
        <>
          <Discovery herbarium={identification.data.herbarium} />
          <Details result={identification.data.result} />
          <Disclaimer />
          <Actions id={identification.data.id} photoUri={uri} result={identification.data.result} plantId={null} />
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
          <Disclaimer />
          <Actions id={id} photoUri={saved.data.imageUrl} result={saved.data.result} plantId={saved.data.plantId} />
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

/** Every result is AI output; say so where people read it (see also the Terms of Use). */
function Disclaimer() {
  const { t } = useTranslation();
  const muted = useCSSVariable('--color-muted');

  return (
    <View className="flex-row gap-3 rounded-2xl bg-card px-4 py-3">
      <SymbolView name="sparkles" size={18} tintColor={typeof muted === 'string' ? muted : undefined} />
      <Text className="flex-1 text-[13px] leading-[18px] text-muted">{t('result.disclaimer')}</Text>
    </View>
  );
}

function Actions({
  id,
  photoUri,
  result,
  plantId,
}: {
  id: string;
  photoUri: string;
  result: Result;
  plantId: string | null;
}) {
  const { t } = useTranslation();
  return (
    <View className="gap-2.5">
      <AddPlantButton identificationId={id} plantId={plantId} />
      <Button
        label={t('result.share')}
        systemImage="square.and.arrow.up"
        variant="secondary"
        onPress={() => void shareIdentification({ id, photoUri, result }, t)}
      />
      <DeleteButton id={id} />
    </View>
  );
}

/** Adds the plant to My plants, or shows it's there. Reminders are turned on separately, per plant. */
function AddPlantButton({ identificationId, plantId }: { identificationId: string; plantId: string | null }) {
  const { t } = useTranslation();
  const add = useAddPlant();
  const added = plantId !== null || add.isSuccess;

  if (added) {
    return (
      <Button
        label={t('result.inPlants')}
        systemImage="checkmark.circle.fill"
        variant="secondary"
        onPress={() => {
          router.back();
          router.navigate('/plants');
        }}
      />
    );
  }
  return (
    <Button
      label={t('result.addPlant')}
      systemImage="drop.fill"
      disabled={add.isPending}
      onPress={() =>
        add.mutate(identificationId, {
          onSuccess: haptics.success,
          onError: () => {
            haptics.error();
            Alert.alert(t('result.addFailed'));
          },
        })
      }
    />
  );
}

function DeleteButton({ id }: { id: string }) {
  const { t } = useTranslation();
  const remove = useDeleteIdentification();

  function confirm() {
    haptics.warning();
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
    <Button
      label={t('result.delete')}
      systemImage="trash"
      variant="secondary"
      tone="danger"
      disabled={remove.isPending}
      onPress={confirm}
    />
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

      {/* Results from before the toxicity field have no safety section. */}
      {result.toxicity && <Safety toxicity={result.toxicity} />}

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

function Safety({ toxicity }: { toxicity: Toxicity }) {
  const { t } = useTranslation();
  const muted = useCSSVariable('--color-muted');

  return (
    <View className="gap-2">
      <Text className="font-rounded text-[20px] font-bold text-foreground">{t('result.safety')}</Text>
      <View className="overflow-hidden rounded-2xl bg-card">
        {safetyRows.map(({ key, icon }, index) => (
          <View
            key={key}
            className={`flex-row items-center gap-3 px-4 py-3 ${index > 0 ? 'border-t border-separator' : ''}`}
          >
            <SymbolView name={icon} size={20} tintColor={typeof muted === 'string' ? muted : undefined} />
            <Text className="flex-1 text-[17px] text-foreground">{t(`result.${key}`)}</Text>
            <Text className={`text-[15px] font-semibold ${levelColor[toxicity[key]]}`}>
              {t(`result.toxicity.${toxicity[key]}`)}
            </Text>
          </View>
        ))}
        {toxicity.note && (
          <Text className="border-t border-separator px-4 py-3 text-[15px] leading-5 text-foreground">
            {toxicity.note}
          </Text>
        )}
      </View>
      <View className="flex-row gap-2 px-1">
        <SymbolView name="info.circle" size={15} tintColor={typeof muted === 'string' ? muted : undefined} />
        <Text className="flex-1 text-[13px] leading-[18px] text-muted">{t('result.safetyAdvice')}</Text>
      </View>
    </View>
  );
}

/** "New species in your herbarium · #24", plus any badge it earned. Only for a fresh identification. */
function Discovery({ herbarium }: { herbarium: IdentifyResponse['herbarium'] }) {
  const { t } = useTranslation();
  const accent = useCSSVariable('--color-accent');
  if (!herbarium.newSpecies && herbarium.newBadges.length === 0) return null;
  const tint = typeof accent === 'string' ? accent : undefined;

  return (
    <View className="gap-2 rounded-2xl bg-accent-soft px-4 py-3">
      {herbarium.newSpecies && (
        <View className="flex-row items-center gap-2.5">
          <SymbolView name="sparkles" size={18} tintColor={tint} />
          <Text className="flex-1 text-[15px] font-semibold text-accent">
            {t('herbarium.newSpecies', { number: herbarium.speciesCount })}
          </Text>
        </View>
      )}
      {herbarium.newBadges.map((badge) => (
        <View key={badge.id} className="flex-row items-center gap-2.5">
          <SymbolView name={BADGE_SYMBOLS[badge.id]} size={18} tintColor={tint} />
          <Text className="flex-1 text-[15px] font-semibold text-accent">
            {t('herbarium.newBadge', { name: badgeName(badge, t) })}
          </Text>
        </View>
      ))}
    </View>
  );
}
