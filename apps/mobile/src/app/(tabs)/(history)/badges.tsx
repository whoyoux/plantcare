import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { Medal, ProgressBar } from '@/components/herbarium';
import { badgeHint, badgeName } from '@/lib/badges';
import { useHerbarium, type Badge } from '@/lib/herbarium';

/** Every badge: earned ones with their date, the rest with how to earn them and the progress so far. */
export default function BadgesScreen() {
  const { t } = useTranslation();
  const { data } = useHerbarium();
  if (!data) return <ActivityIndicator className="flex-1 bg-background" />;

  const earned = data.badges.filter((badge) => badge.level > 0);
  const locked = data.badges.filter((badge) => badge.level === 0);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-6 px-4 pb-10 pt-2"
      contentInsetAdjustmentBehavior="automatic"
    >
      {[
        { title: t('herbarium.earnedSection'), badges: earned },
        { title: t('herbarium.lockedSection'), badges: locked },
      ]
        .filter((section) => section.badges.length > 0)
        .map((section) => (
          <View key={section.title} className="gap-2">
            <Text className="px-1 font-rounded text-[20px] font-bold text-foreground">{section.title}</Text>
            <View className="overflow-hidden rounded-2xl bg-card">
              {section.badges.map((badge, index) => (
                <BadgeRow key={badge.id} badge={badge} first={index === 0} />
              ))}
            </View>
          </View>
        ))}
    </ScrollView>
  );
}

function BadgeRow({ badge, first }: { badge: Badge; first: boolean }) {
  const { t, i18n } = useTranslation();
  const maxed = badge.level === badge.maxLevel;
  const date = badge.earnedAt
    ? new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'long' }).format(new Date(badge.earnedAt))
    : null;

  return (
    <View className={`flex-row items-center gap-3 px-4 py-3 ${first ? '' : 'border-t border-separator'}`}>
      <Medal badge={badge} size={44} />
      <View className="flex-1 gap-1">
        <Text className="text-[17px] font-semibold text-foreground">{badgeName(badge, t)}</Text>
        {date && <Text className="text-[13px] text-muted">{t('herbarium.earned', { date })}</Text>}
        {!maxed && (
          <>
            <Text className="text-[13px] text-muted">{badgeHint(badge, t)}</Text>
            <View className="flex-row items-center gap-2">
              <View className="flex-1">
                <ProgressBar value={badge.current / badge.target} />
              </View>
              <Text className="text-[12px] text-muted">
                {t('herbarium.progress', { current: Math.min(badge.current, badge.target), target: badge.target })}
              </Text>
            </View>
          </>
        )}
        {badge.maxLevel > 1 && (
          <Text className="text-[12px] text-muted">
            {t('herbarium.level', { level: badge.level, max: badge.maxLevel })}
          </Text>
        )}
      </View>
    </View>
  );
}
