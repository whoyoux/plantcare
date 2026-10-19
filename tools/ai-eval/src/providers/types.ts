export type Candidate = { scientificName: string; commonName: string | null; confidence: number };

export type Prediction = {
  /** Most likely first. */
  candidates: Candidate[];
  /** What this call cost, in USD, when known. */
  costUsd: number | null;
  /** The model's toxicity answer (vision models with the current prompt), kept for review. */
  toxicity?: unknown;
  /** The model's plant category (current prompt), kept for review. */
  category?: unknown;
};

export type Provider = {
  id: string;
  identify(photo: Buffer): Promise<Prediction>;
};

/** Pl@ntNet and Kindwise bill in EUR. Rough rate, only for comparing orders of magnitude. */
export const EUR_TO_USD = 1.15;
