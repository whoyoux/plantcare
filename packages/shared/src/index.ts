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

/** How harmful eating the plant is: from the ASPCA lists and toxicology references, never a guess. */
export const ToxicityLevel = z.enum(['safe', 'mild', 'toxic', 'unknown']);

export const Toxicity = z.object({
  cats: ToxicityLevel,
  dogs: ToxicityLevel,
  people: ToxicityLevel,
  /** Which parts and what happens, in one sentence; null when the plant is safe for all three. */
  note: z.string().nullable(),
});

/**
 * What the model returns for one photo, and what the API stores and sends to the app.
 * Every field is required (nullable where it may be unknown) so it works as a strict JSON schema.
 */
export const Identification = z.object({
  /**
   * What the model saw before naming the plant (leaf shape, margin, stem, flowers, look-alikes
   * ruled out). Written first so the answer follows from the evidence. Older results lack it.
   */
  analysis: z.string(),
  isPlant: z.boolean(),
  scientificName: z.string().nullable(),
  commonName: z.string().nullable(),
  family: z.string().nullable(),
  confidence: z.number().min(0).max(1),
  alternatives: z.array(SpeciesCandidate).max(3),
  care: CareGuide.nullable(),
  /** Null for photos without a plant. Results from before Oct 2026 lack it. */
  toxicity: Toxicity.nullable(),
});

export type SpeciesCandidate = z.infer<typeof SpeciesCandidate>;
export type CareGuide = z.infer<typeof CareGuide>;
export type ToxicityLevel = z.infer<typeof ToxicityLevel>;
export type Toxicity = z.infer<typeof Toxicity>;
export type Identification = z.infer<typeof Identification>;

/** JSON schema for structured model output. */
export const identificationJsonSchema = z.toJSONSchema(Identification, { target: 'draft-7' });

export const LANGUAGES = ['en', 'pl'] as const;
export type Language = (typeof LANGUAGES)[number];

const LANGUAGE_NAMES: Record<Language, string> = { en: 'English', pl: 'Polish' };

/** System prompt for the vision model; names and care text come back in the user's language. */
export function identificationPrompt(language: Language) {
  const name = LANGUAGE_NAMES[language];
  return `You are an expert field botanist. People photograph houseplants, garden plants, herbs and wild plants with their phone, and you identify the plant in the photo for a plant care app.

You may get several photos of the same plant (for example a leaf close-up, a flower and the whole plant). Use the evidence from all of them together.

Work in this order and answer with JSON that matches the schema:
1. analysis (in English, 2-4 sentences): describe only what is visible and diagnostic: leaf shape, tip and base, margin (smooth, toothed, lobed), surface (glossy, hairy, wrinkled), venation, arrangement (opposite, alternate, whorled, rosette), stem (square or round, colour, hairs), flowers or fruit, and growth habit. Then name the closest look-alikes in the same genus or family and the visible trait that separates them (for example spearmint vs peppermint vs lemon balm vs catnip, parsley vs coriander, stinging nettle vs dead-nettle). Decide from these traits, not from which plant is more common.
2. isPlant: false if the photo shows no plant; then set the names, care and toxicity to null and alternatives to [].
3. scientificName: the accepted name without author: genus and species, with × for hybrids (e.g. Mentha × piperita). If only the genus is certain, give the genus alone.
4. commonName: the common name in ${name}, or null if there is none.
5. family: the botanical family.
6. confidence: your calibrated probability (0 to 1) that scientificName is right. When the photo cannot separate two species, keep it at or below 0.6 and put the other one first in alternatives.
7. alternatives: up to 3 other plausible species, most likely first, with common names in ${name}.
8. care: short, practical care guidance in ${name} for this species (watering, light, temperature). care.wateringDays: how many days between waterings suit it as a potted plant (one whole number, 1-60), or null if it is not grown in pots.
9. toxicity: how harmful eating the plant is for cats, dogs and people, judged by the worst likely effect:
   - "safe": listed as non-toxic (ASPCA and toxicology references).
   - "mild": irritation of the mouth, drooling, vomiting or diarrhoea that usually passes without treatment. This covers most plants the ASPCA lists as toxic only for such signs, e.g. calcium-oxalate aroids (Monstera, Epipremnum, Philodendron, Spathiphyllum), Ficus, Dracaena, garden mints, lemon balm, catnip.
   - "toxic": can harm the kidneys, liver, heart or breathing, cause severe swelling, or kill, and needs a vet or doctor, e.g. lilies for cats, Dieffenbachia, ivy, sago palm, oleander, hydrangea.
   - "unknown": you are not sure, or only the genus is known. Never answer "safe" when unsure.
   Give the same levels for the same species every time. toxicity.note: one short sentence in ${name} saying which parts are harmful and what they cause, or null when all three are "safe".`;
}
