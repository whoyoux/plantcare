import { EUR_TO_USD, type Candidate, type Provider } from './types.ts';

type Response = {
  results: {
    score: number;
    species: { scientificNameWithoutAuthor: string; commonNames: string[] };
  }[];
};

/** Pro plan rate (the free plan is 500/day, non-commercial use needs checking). */
const COST_PER_CALL_EUR = 0.005;

/** Pl@ntNet: a dedicated plant classifier. Fast and cheap, but only names, no care guidance. */
export async function plantnetCandidates(apiKey: string, photo: Buffer): Promise<Candidate[]> {
  const form = new FormData();
  form.append('images', new Blob([new Uint8Array(photo)], { type: 'image/jpeg' }), 'photo.jpg');
  form.append('organs', 'auto');
  const params = new URLSearchParams({ 'api-key': apiKey, lang: 'pl', 'nb-results': '5' });
  const response = await fetch(`https://my-api.plantnet.org/v2/identify/all?${params.toString()}`, {
    method: 'POST',
    body: form,
  });
  // 404 means "species not found", which is a valid (empty) answer.
  if (response.status === 404) return [];
  if (!response.ok) throw new Error(`Pl@ntNet ${response.status}: ${await response.text()}`);
  const { results } = (await response.json()) as Response;
  return results.map((result) => ({
    scientificName: result.species.scientificNameWithoutAuthor,
    commonName: result.species.commonNames[0] ?? null,
    confidence: result.score,
  }));
}

export function plantnet(apiKey: string): Provider {
  return {
    id: 'plantnet',
    async identify(photo) {
      return { candidates: await plantnetCandidates(apiKey, photo), costUsd: COST_PER_CALL_EUR * EUR_TO_USD };
    },
  };
}
