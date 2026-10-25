import type { SFSymbol } from 'expo-symbols';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { useCSSVariable } from 'uniwind';

function useAccent() {
  const accent = useCSSVariable('--color-accent');
  return typeof accent === 'string' ? accent : undefined;
}

const tips = [
  { key: 'leaf', icon: 'leaf' },
  { key: 'flower', icon: 'camera.macro' },
  { key: 'light', icon: 'sun.max' },
] as const satisfies readonly { key: string; icon: SFSymbol }[];

/** Hints for a photo the model can identify well; sits right under the camera. */
export function PhotoTips() {
  const { t } = useTranslation();
  const accent = useAccent();

  return (
    <View className="gap-2.5">
      <Text className="px-1 font-rounded text-[17px] font-bold text-foreground">{t('identify.tipsTitle')}</Text>
      <View className="flex-row flex-wrap gap-2">
        {tips.map(({ key, icon }) => (
          <View key={key} className="flex-row items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5">
            <SymbolView name={icon} size={15} tintColor={accent} />
            <Text className="text-[14px] font-semibold text-accent">{t(`identify.tips.${key}`)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
