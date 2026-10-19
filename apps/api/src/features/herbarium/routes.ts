import { eq, schema, sql, type Database } from '@plantcare/db';
import { PlantCategory } from '@plantcare/shared';

import { factory } from '../../env';
import { requireUser } from '../../middleware/require-user';
import { buildHerbarium, type BadgeProgress, type HerbariumEntry } from '../../services/herbarium';

/** Photos per species sent with the herbarium (the species card shows a row of them). */
const PHOTOS_PER_SPECIES = 6;

const table = schema.identification;

/** The user's identifications and plant dates, as much of them as the herbarium needs. */
export async function loadHerbariumData(db: Database, userId: string) {
  const [rows, plants] = await Promise.all([
    db
      .select({
        id: table.id,
        createdAt: table.createdAt,
        scientificName: table.scientificName,
        commonName: table.commonName,
        confidence: table.confidence,
        imageKey: table.imageKey,
        family: sql<string | null>`${table.result}->>'family'`,
        category: sql<string | null>`${table.result}->>'category'`,
        toxic: sql<boolean>`coalesce('toxic' in (${table.result}->'toxicity'->>'cats', ${table.result}->'toxicity'->>'dogs', ${table.result}->'toxicity'->>'people'), false)`,
      })
      .from(table)
      .where(eq(table.userId, userId)),
    db.select({ createdAt: schema.plant.createdAt }).from(schema.plant).where(eq(schema.plant.userId, userId)),
  ]);
  const entries: HerbariumEntry[] = rows.map((row) => ({
    ...row,
    category: PlantCategory.safeParse(row.category).data ?? null,
    toxic: Boolean(row.toxic),
  }));
  return { entries, plantDates: plants.map((plant) => plant.createdAt) };
}

export const badgeDto = ({ earnedAt, ...badge }: BadgeProgress) => ({
  ...badge,
  earnedAt: earnedAt?.toISOString() ?? null,
});

export const herbariumRoutes = factory
  .createApp()
  .use(requireUser)
  /** The collection: one entry per species found, families, badges and the next badge to aim for. */
  .get('/', async (c) => {
    const { entries, plantDates } = await loadHerbariumData(c.var.db, c.var.user.id);
    const herbarium = buildHerbarium(entries, plantDates);
    const sign = (key: string) => c.var.photoUrls.sign(key);

    const species = await Promise.all(
      herbarium.species.map(async ({ best, entries: found, firstSeen, lastSeen, ...item }) => ({
        ...item,
        firstSeen: firstSeen.toISOString(),
        lastSeen: lastSeen.toISOString(),
        bestId: best.id,
        imageUrl: await sign(best.imageKey),
        latestId: found[0]!.id,
        photos: await Promise.all(
          found.slice(0, PHOTOS_PER_SPECIES).map(async ({ id, imageKey, createdAt }) => ({
            id,
            imageUrl: await sign(imageKey),
            createdAt: createdAt.toISOString(),
          })),
        ),
      })),
    );

    return c.json({
      speciesCount: species.length,
      familyCount: herbarium.familyCount,
      species,
      badges: herbarium.badges.map(badgeDto),
      next: herbarium.next ? badgeDto(herbarium.next) : null,
    });
  });
