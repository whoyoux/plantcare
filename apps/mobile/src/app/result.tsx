import { useLocalSearchParams } from 'expo-router';
import type { SFSymbol } from 'expo-symbols';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { Image } from '@/components/image';
import type { Language } from '@/i18n';
import { sampleIdentification as sample } from '@/lib/sample-identification';

const careRows = [
  { key: 'watering', icon: 'drop.fill' },
  { key: 'light', icon: 'sun.max.fill' },
  { key: 'temperature', icon: 'thermometer.medium' },
] as const satisfies readonly { key: keyof typeof sample.care; icon: SFSymbol }[];

export default function ResultSheet() {
  const { uri } = useLocalSearchParams<{ uri?: string }>();
  const { t, i18n } = useTranslation();
  const language = i18n.language as Language;
  const accent = useCSSVariable('--color-accent');
  const tint = typeof accent === 'string' ? accent : undefined;

  return (
    <ScrollView contentContainerClassName="gap-6 px-5 pb-10 pt-4" contentInsetAdjustmentBehavior="automatic">
      {uri && <Image source={{ uri }} contentFit="cover" className="aspect-[4/3] w-full rounded-3xl" />}

      <View className="gap-1">
        <Text className="text-[28px] font-bold text-foreground">{sample.commonName[language]}</Text>
        <Text className="text-[17px] italic text-muted">{sample.scientificName}</Text>
        <View className="mt-2 self-start rounded-full bg-accent-soft px-3 py-1">
          <Text className="text-[13px] font-semibold text-accent">{t('result.match', { value: sample.confidence })}</Text>
        </View>
      </View>

      <View className="gap-2">
        <Text className="text-[20px] font-semibold text-foreground">{t('result.care')}</Text>
        <View className="overflow-hidden rounded-2xl bg-card">
          {careRows.map(({ key, icon }, index) => (
            <View key={key} className={`flex-row items-center gap-3 px-4 py-3 ${index > 0 ? 'border-t border-separator' : ''}`}>
              <SymbolView name={icon} size={22} tintColor={tint} />
              <View className="flex-1">
                <Text className="text-[13px] text-muted">{t(`result.${key}`)}</Text>
                <Text className="text-[17px] text-foreground">{sample.care[key][language]}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <Text className="text-center text-[13px] text-muted">{t('result.sampleNotice')}</Text>
    </ScrollView>
  );
}
