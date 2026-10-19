import type { BadgeId } from '@plantcare/shared';
import type { SFSymbol } from 'expo-symbols';
import type { TFunction } from 'i18next';

import type { Badge } from '@/lib/herbarium';

export const BADGE_SYMBOLS: Record<BadgeId, SFSymbol> = {
  firstLeaf: 'leaf.fill',
  collector: 'square.grid.2x2.fill',
  botanist: 'book.closed.fill',
  herbalist: 'cup.and.saucer.fill',
  forester: 'tree.fill',
  homebody: 'house.fill',
  meadow: 'camera.macro',
  careful: 'exclamationmark.triangle.fill',
  lookalikes: 'arrow.left.arrow.right',
  caretaker: 'drop.fill',
};

const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

/**
 * "Collector II": levelled badges carry a level. By default the one earned (or I while locked);
 * with `upcoming`, the level being worked towards.
 */
export function badgeName(badge: Pick<Badge, 'id' | 'level' | 'maxLevel'>, t: TFunction, upcoming = false) {
  const name = t(`badges.${badge.id}.name`);
  if (badge.maxLevel === 1) return name;
  const level = upcoming ? Math.min(badge.level + 1, badge.maxLevel) : Math.max(badge.level, 1);
  return `${name} ${ROMAN[level - 1] ?? level}`;
}

/** How to earn the badge's next level ("Find 5 trees"). */
export function badgeHint(badge: Pick<Badge, 'id' | 'target'>, t: TFunction) {
  return t(`badges.${badge.id}.hint`, { target: badge.target });
}
