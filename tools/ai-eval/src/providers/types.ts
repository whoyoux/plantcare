export type Candidate = { scientificName: string; commonName: string | null; confidence: number };

export type Prediction = {
  /** Most likely first. */
  candidates: Candidate[];
  /** What this call cost, in USD, when known. */
  costUsd: number | null;
};

export type Provider = {
  id: string;
  identify(photo: Buffer): Promise<Prediction>;
};

/** Pl@ntNet and Kindwise bill in EUR. Rough rate, only for comparing orders of magnitude. */
export const EUR_TO_USD = 1.15;
