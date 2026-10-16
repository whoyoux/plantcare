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
