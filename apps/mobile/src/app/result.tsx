import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import type { SFSymbol } from 'expo-symbols';
import { SymbolView } from 'expo-symbols';
import { useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Toxicity, ToxicityLevel } from '@plantcare/shared';

import { Image } from '@/components/image';
import { ParallaxHero, useParallaxScroll } from '@/components/parallax';
import { GlassCircle, PhotoLabel, PillButton, useColor } from '@/components/photo-ui';
import type { Language } from '@/i18n';
import { ApiError } from '@/lib/api';
import { BADGE_SYMBOLS, badgeName } from '@/lib/badges';
import { haptics } from '@/lib/haptics';
import { identifyPhotos, type IdentifyResponse } from '@/lib/identify';
import { useAddPlant } from '@/lib/plants';
import { shareIdentification } from '@/lib/share';
import { historyKeys, useDeleteIdentification, useSavedIdentification } from '@/lib/identifications';
import { SUBJECTS, toxicHeadline, toxicWarning } from '@/lib/toxicity';

type Result = IdentifyResponse['result'];

/** Height of the photo at the top; the details card overlaps its bottom edge. */
const HERO_HEIGHT = 470;

const careRows = [
  { key: 'watering', icon: 'drop.fill' },
  { key: 'light', icon: 'sun.max.fill' },
  { key: 'temperature', icon: 'thermometer.medium' },
] as const satisfies readonly { key: keyof NonNullable<Result['care']>; icon: SFSymbol }[];

const subjectIcons: Record<(typeof SUBJECTS)[number], SFSymbol> = {
  cats: 'cat.fill',
  dogs: 'dog.fill',
  people: 'figure.and.child.holdinghands',
};

/** Text colour per level; the label says it too, so colour is never the only signal. */
const levelColor: Record<ToxicityLevel, string> = {
  safe: 'text-accent',
  mild: 'text-danger',
  toxic: 'text-danger',
  unknown: 'text-muted',
};

const KNOWN_ERRORS = ['NOT_A_PLANT', 'DAILY_LIMIT_REACHED', 'RATE_LIMITED'] as const;

/**
 * The result screen: the photo edge to edge, the details on a card over its lower edge. Opened
 * with `photos` for new photos (uploads and identifies them), or with `id` for one from history.
 */
export default function ResultScreen() {
  const { photos, id } = useLocalSearchParams<{ photos?: string; id?: string }>();
  return id ? <SavedResult id={id} /> : <NewResult uris={JSON.parse(photos ?? '[]') as string[]} />;
}

function NewResult({ uris }: { uris: string[] }) {
  const uri = uris[0]!;
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();

  // A query (not a mutation) so the screen survives re-renders without uploading twice.
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

  const data = identification.data;
  return (
    <Layout
      photo={{ uri }}
      toxicity={data?.result.toxicity}
      share={data ? () => void shareIdentification({ id: data.id, photoUri: uri, result: data.result }, t) : undefined}
    >
      {identification.isPending && <Identifying />}
      {identification.isError && <Failure error={identification.error} onRetry={() => void identification.refetch()} />}
      {data && (
        <>
          <Discovery herbarium={data.herbarium} />
          <Details result={data.result} />
          <Actions id={data.id} plantId={null} />
        </>
      )}
    </Layout>
  );
}

function SavedResult({ id }: { id: string }) {
  const { t } = useTranslation();
  const saved = useSavedIdentification(id);
  const data = saved.data;

  return (
    <Layout
      photo={data && { uri: data.imageUrl, cacheKey: id }}
      toxicity={data?.result.toxicity}
      share={data ? () => void shareIdentification({ id, photoUri: data.imageUrl, result: data.result }, t) : undefined}
    >
      {saved.isPending && <ActivityIndicator className="py-6" />}
      {saved.isError && <Failure error={saved.error} onRetry={() => void saved.refetch()} />}
      {data && (
        <>
          <Details result={data.result} />
          <Actions id={id} plantId={data.plantId} />
        </>
      )}
    </Layout>
  );
}

function Layout({
  photo,
  toxicity,
  share,
  children,
}: {
  photo?: { uri: string; cacheKey?: string };
  toxicity?: Toxicity | null;
  share?: () => void;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const warning = toxicWarning(toxicity);
  const { ref: scrollRef, offset: scrollOffset } = useParallaxScroll();

  return (
    <View className="flex-1 bg-card">
      <Animated.ScrollView ref={scrollRef} contentInsetAdjustmentBehavior="never" style={{ flex: 1 }}>
        <ParallaxHero
          offset={scrollOffset}
          height={HERO_HEIGHT}
          photo={photo && <Image source={photo} contentFit="cover" style={{ width: '100%', height: '100%' }} />}
        >
          {warning && (
            <View className="absolute bottom-12 left-4">
              <PhotoLabel tone="danger">{t(`result.toxicity.${warning.level}`)}</PhotoLabel>
            </View>
          )}
        </ParallaxHero>
        <View className="-mt-8 min-h-[400px] gap-6 rounded-t-[30px] bg-card px-5 pb-12 pt-6">{children}</View>
      </Animated.ScrollView>
      <View
        pointerEvents="box-none"
        className="absolute left-4 right-4 flex-row justify-between"
        style={{ top: insets.top + 8 }}
      >
        <GlassCircle icon="xmark" label={t('result.close')} onPress={() => router.back()} />
        {share && <GlassCircle icon="square.and.arrow.up" label={t('result.share')} onPress={share} />}
      </View>
    </View>
  );
}

function Actions({ id, plantId }: { id: string; plantId: string | null }) {
  return (
    <View className="gap-2.5">
      <AddPlantButton identificationId={id} plantId={plantId} />
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
      <PillButton
        label={t('result.inPlants')}
        icon="checkmark.circle.fill"
        variant="secondary"
        onPress={() => {
          router.back();
          router.navigate('/plants');
        }}
      />
    );
  }
  return (
    <PillButton
      label={t('result.addPlant')}
      icon="drop.fill"
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
    <PillButton
      label={t('result.delete')}
      icon="trash"
      variant="danger"
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
      {known !== 'DAILY_LIMIT_REACHED' && (
        <PillButton label={t('result.retry')} onPress={onRetry} variant="secondary" />
      )}
    </View>
  );
}

function Details({ result }: { result: Result }) {
  const { t } = useTranslation();
  const accent = useColor('--color-accent');

  return (
    <>
      <View className="flex-row items-start gap-3">
        <View className="flex-1 gap-1">
          <Text className="text-[30px] font-bold leading-9 tracking-tight text-foreground">
            {result.commonName ?? result.scientificName}
          </Text>
          <Text className="font-latin text-[17px] italic text-muted">
            {result.scientificName}
            {result.family && <Text className="text-[15px] not-italic text-muted"> · {result.family}</Text>}
          </Text>
        </View>
        <View
          accessibilityLabel={t('result.match', { value: Math.round(result.confidence * 100) })}
          className="mt-1.5 rounded-full bg-accent-soft px-3 py-1.5"
        >
          <Text className="text-[13px] font-bold text-accent">
            {t('result.confidence', { value: Math.round(result.confidence * 100) })}
          </Text>
        </View>
      </View>

      {/* Toxicity first: anyone who reads one thing on this screen should read this. */}
      {result.toxicity && <Safety toxicity={result.toxicity} />}

      {result.care && (
        <View className="overflow-hidden rounded-2xl bg-elevated">
          {careRows.map(({ key, icon }, index) => (
            <View
              key={key}
              className={`flex-row items-center gap-3 px-4 py-3 ${index > 0 ? 'border-t border-separator' : ''}`}
            >
              <SymbolView name={icon} size={20} tintColor={accent} />
              <View className="flex-1">
                <Text className="text-[13px] text-muted">{t(`result.${key}`)}</Text>
                <Text className="text-[16px] text-foreground">{result.care?.[key]}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {result.alternatives.length > 0 && (
        <View className="gap-2">
          <Text className="text-[17px] font-bold text-foreground">{t('result.alternatives')}</Text>
          <View className="overflow-hidden rounded-2xl bg-elevated">
            {result.alternatives.map((alternative, index) => (
              <View
                key={alternative.scientificName}
                className={`flex-row items-center justify-between gap-3 px-4 py-3 ${index > 0 ? 'border-t border-separator' : ''}`}
              >
                <View className="flex-1">
                  <Text className="text-[16px] text-foreground">
                    {alternative.commonName ?? alternative.scientificName}
                  </Text>
                  <Text className="font-latin text-[14px] italic text-muted">{alternative.scientificName}</Text>
                </View>
                <Text className="text-[15px] text-muted">{Math.round(alternative.confidence * 100)}%</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <Text className="text-[13px] leading-[18px] text-muted">{t('result.disclaimer')}</Text>
    </>
  );
}

/**
 * Toxic plants get a solid red banner saying who they harm, before anything else; the per-subject
 * levels and the model's note follow. Safe plants get one quiet line.
 */
function Safety({ toxicity }: { toxicity: Toxicity }) {
  const { t } = useTranslation();
  const muted = useColor('--color-muted');
  const accent = useColor('--color-accent');
  const warning = toxicWarning(toxicity);
  const allSafe = SUBJECTS.every((subject) => toxicity[subject] === 'safe');

  if (allSafe) {
    return (
      <View className="flex-row items-center gap-2.5 rounded-2xl bg-accent-soft px-4 py-3">
        <SymbolView name="checkmark.shield.fill" size={20} tintColor={accent} />
        <Text className="flex-1 text-[15px] font-semibold text-accent">{t('result.safeForAll')}</Text>
      </View>
    );
  }

  return (
    <View className="gap-2">
      {warning && (
        <View accessibilityRole="alert" className="gap-1.5 rounded-2xl bg-danger-fill px-4 py-3.5">
          <View className="flex-row items-center gap-2.5">
            <SymbolView name="exclamationmark.triangle.fill" size={22} tintColor="white" />
            <Text className="flex-1 text-[17px] font-bold text-white">{toxicHeadline(warning, t)}</Text>
          </View>
          {toxicity.note && <Text className="text-[15px] leading-5 text-white">{toxicity.note}</Text>}
        </View>
      )}
      <View className="flex-row gap-2">
        {SUBJECTS.map((subject) => (
          <View key={subject} className="flex-1 items-center gap-1 rounded-2xl bg-elevated px-2 py-3">
            <SymbolView name={subjectIcons[subject]} size={20} tintColor={muted} />
            <Text className="text-[13px] text-muted">{t(`result.${subject}`)}</Text>
            <Text className={`text-center text-[14px] font-bold ${levelColor[toxicity[subject]]}`}>
              {t(`result.toxicity.${toxicity[subject]}`)}
            </Text>
          </View>
        ))}
      </View>
      {!warning && toxicity.note && <Text className="text-[14px] leading-5 text-foreground">{toxicity.note}</Text>}
      <View className="flex-row gap-2 px-1">
        <SymbolView name="info.circle" size={15} tintColor={muted} />
        <Text className="flex-1 text-[13px] leading-[18px] text-muted">{t('result.safetyAdvice')}</Text>
      </View>
    </View>
  );
}

/** "New species in your herbarium · #24", plus any badge it earned. Only for a fresh identification. */
function Discovery({ herbarium }: { herbarium: IdentifyResponse['herbarium'] }) {
  const { t } = useTranslation();
  const accent = useColor('--color-accent');
  if (!herbarium.newSpecies && herbarium.newBadges.length === 0) return null;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        router.back();
        router.navigate({ pathname: '/history', params: { view: 'herbarium', at: String(Date.now()) } });
      }}
      className="gap-2 rounded-2xl bg-accent-soft px-4 py-3 active:opacity-80"
    >
      {herbarium.newSpecies && (
        <View className="flex-row items-center gap-2.5">
          <SymbolView name="leaf.fill" size={18} tintColor={accent} />
          <Text className="flex-1 text-[15px] font-semibold text-accent">
            {t('herbarium.newSpecies', { number: herbarium.speciesCount })}
          </Text>
        </View>
      )}
      {herbarium.newBadges.map((badge) => (
        <View key={badge.id} className="flex-row items-center gap-2.5">
          <SymbolView name={BADGE_SYMBOLS[badge.id]} size={18} tintColor={accent} />
          <Text className="flex-1 text-[15px] font-semibold text-accent">
            {t('herbarium.newBadge', { name: badgeName(badge, t) })}
          </Text>
        </View>
      ))}
    </Pressable>
  );
}
