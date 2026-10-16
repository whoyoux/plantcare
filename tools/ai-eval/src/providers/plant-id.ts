import { EUR_TO_USD, type Provider } from './types.ts';

type Response = {
  result: {
    classification: {
      suggestions: { name: string; probability: number; details?: { common_names?: string[] | null } }[];
    };
  };
};

/** Smallest credit pack: €0.05 per identification. */
const COST_PER_CALL_EUR = 0.05;

/** Kindwise plant.id: a commercial plant classifier with optional details (common names, care). */
export function plantId(apiKey: string): Provider {
  return {
    id: 'plant.id',
    async identify(photo) {
      const params = new URLSearchParams({ details: 'common_names', language: 'pl' });
      const response = await fetch(`https://plant.id/api/v3/identification?${params.toString()}`, {
        method: 'POST',
        headers: { 'Api-Key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: [`data:image/jpeg;base64,${photo.toString('base64')}`], similar_images: false }),
      });
      if (!response.ok) throw new Error(`plant.id ${response.status}: ${await response.text()}`);
      const { result } = (await response.json()) as Response;
      return {
        candidates: result.classification.suggestions.slice(0, 5).map((suggestion) => ({
          scientificName: suggestion.name,
          commonName: suggestion.details?.common_names?.[0] ?? null,
          confidence: suggestion.probability,
        })),
        costUsd: COST_PER_CALL_EUR * EUR_TO_USD,
      };
    },
  };
}
