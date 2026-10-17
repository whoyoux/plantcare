import { check, index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

import { user } from './auth';
import { identification } from './identification';

/**
 * A plant the user keeps and waters ("My plants"). Created from an identification; keeps its own
 * copy of the name and photo key so it survives when that identification is removed from History.
 */
export const plant = pgTable(
  'plant',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    identificationId: uuid('identification_id').references(() => identification.id, { onDelete: 'set null' }),
    /** R2 key of the photo; shared with the identification while both exist. */
    imageKey: text('image_key').notNull(),
    name: text('name').notNull(),
    scientificName: text('scientific_name'),
    wateringIntervalDays: integer('watering_interval_days').notNull(),
    lastWateredAt: timestamp('last_watered_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('plant_user_idx').on(table.userId),
    check('plant_watering_interval_range', sql`${table.wateringIntervalDays} between 1 and 60`),
  ],
);
