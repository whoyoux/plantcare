import { bigserial, index, jsonb, pgTable, real, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { user } from './auth';

/** One photo identification. `result` holds the full model output (validated in packages/shared). */
export const identification = pgTable(
  'identification',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    /** R2 object key of the uploaded photo. */
    imageKey: text('image_key').notNull(),
    /** Language the model answered in (en | pl); old entries keep their original language. */
    language: text('language').notNull(),
    scientificName: text('scientific_name').notNull(),
    // Null when the species has no common name in that language.
    commonName: text('common_name'),
    confidence: real('confidence').notNull(),
    model: text('model').notNull(),
    result: jsonb('result').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  // Serves the history list.
  (table) => [index('identification_user_created_idx').on(table.userId, table.createdAt.desc())],
);

/**
 * One call to the identification model, plant or not. The daily limit counts these, so photos
 * without a plant (which leave no identification) still use up the allowance.
 */
export const identifyAttempt = pgTable(
  'identify_attempt',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('identify_attempt_user_created_idx').on(table.userId, table.createdAt)],
);
