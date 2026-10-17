// Single module on purpose: Node (type stripping), Metro and Workers all import it without a build step.
import { z } from 'zod';

/** A candidate species. Scientific names are binomials without the author, e.g. "Monstera deliciosa". */
export const SpeciesCandidate = z.object({
  scientificName: z.string(),
  commonName: z.string().nullable(),
  confidence: z.number().min(0).max(1),
});

export const CareGuide = z.object({
  watering: z.string(),
  light: z.string(),
  temperature: z.string(),
  /** Days between waterings for a typical potted specimen; drives reminders. Older results lack it. */
  wateringDays: z.number().int().min(1).max(60).nullable(),
});

/**
 * What the model returns for one photo, and what the API stores and sends to the app.
 * Every field is required (nullable where it may be unknown) so it works as a strict JSON schema.
 */
export const Identification = z.object({
  isPlant: z.boolean(),
  scientificName: z.string().nullable(),
  commonName: z.string().nullable(),
  family: z.string().nullable(),
  confidence: z.number().min(0).max(1),
  alternatives: z.array(SpeciesCandidate).max(3),
  care: CareGuide.nullable(),
});

export type SpeciesCandidate = z.infer<typeof SpeciesCandidate>;
export type CareGuide = z.infer<typeof CareGuide>;
export type Identification = z.infer<typeof Identification>;

/** JSON schema for structured model output. */
export const identificationJsonSchema = z.toJSONSchema(Identification, { target: 'draft-7' });

export const LANGUAGES = ['en', 'pl'] as const;
export type Language = (typeof LANGUAGES)[number];

const LANGUAGE_NAMES: Record<Language, string> = { en: 'English', pl: 'Polish' };

/** System prompt for the vision model; names and care text come back in the user's language. */
export function identificationPrompt(language: Language) {
  const name = LANGUAGE_NAMES[language];
  return `You identify plants from photos for a plant care app.
Answer with JSON that matches the schema.
- scientificName: the accepted binomial without author (genus and species). If only the genus is certain, give the genus alone.
- commonName: the common name in ${name}, or null if there is none.
- confidence: your calibrated probability (0 to 1) that scientificName is correct.
- alternatives: up to 3 other plausible species, most likely first, with common names in ${name}.
- care: short, practical care guidance in ${name} for this species (watering, light, temperature).
- care.wateringDays: how many days between waterings suit this species as a potted plant (one whole number, 1-60), or null if it is not grown in pots.
If the photo shows no plant, set isPlant to false, the names and care to null and alternatives to [].`;
}
