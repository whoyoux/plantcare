import type { Toxicity, ToxicityLevel } from '@plantcare/shared';
import type { TFunction } from 'i18next';

export const SUBJECTS = ['cats', 'dogs', 'people'] as const;
export type Subject = (typeof SUBJECTS)[number];

/** Any harm counts as toxic: "mild" still means a vet or doctor may be needed. */
export const isHarmful = (level: ToxicityLevel) => level === 'mild' || level === 'toxic';

/** The worst level and who it affects, or null when the plant is safe (or unknown) for everyone. */
export function toxicWarning(toxicity: Toxicity | null | undefined) {
  if (!toxicity) return null;
  const harmed = SUBJECTS.filter((subject) => isHarmful(toxicity[subject]));
  if (harmed.length === 0) return null;
  const level: 'mild' | 'toxic' = harmed.some((subject) => toxicity[subject] === 'toxic') ? 'toxic' : 'mild';
  return { level, harmed };
}

/** "kotów, psów i ludzi" (Hermes has no Intl.ListFormat). */
function joinList(items: string[], and: string) {
  return items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} ${and} ${items.at(-1)}`;
}

/** "Toxic to cats and dogs" / "Silnie trująca dla kotów i psów". */
export function toxicHeadline(warning: NonNullable<ReturnType<typeof toxicWarning>>, t: TFunction) {
  const who = joinList(
    warning.harmed.map((subject) => t(`result.toxicWho.${subject}`)),
    t('result.and'),
  );
  return t(`result.toxicFor.${warning.level}`, { who });
}
