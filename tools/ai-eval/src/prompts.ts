import { Identification, identificationPrompt, type Language } from '@plantcare/shared';
import { z } from 'zod';

/** The first production prompt (Oct 2026), kept to measure changes against. No analysis step. */
function promptV1(language: Language) {
  const name = language === 'pl' ? 'Polish' : 'English';
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

const SchemaV1 = Identification.omit({ analysis: true });

export const PROMPTS = {
  v1: { prompt: promptV1, schema: z.toJSONSchema(SchemaV1, { target: 'draft-7' }), parse: SchemaV1 },
  v2: {
    prompt: identificationPrompt,
    schema: z.toJSONSchema(Identification, { target: 'draft-7' }),
    parse: Identification,
  },
} as const;

export type PromptVersion = keyof typeof PROMPTS;
