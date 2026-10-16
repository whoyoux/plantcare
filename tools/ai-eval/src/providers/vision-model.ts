import { Identification, identificationJsonSchema } from '@plantcare/shared';

import { plantnetCandidates } from './plantnet.ts';
import { EUR_TO_USD, type Candidate, type Provider } from './types.ts';

const SYSTEM_PROMPT = `You identify plants from photos for a plant care app.
Answer with JSON that matches the schema.
- scientificName: the accepted binomial without author (genus and species). If only the genus is certain, give the genus alone.
- commonName: the common name in Polish, or null if there is none.
- confidence: your calibrated probability (0 to 1) that scientificName is correct.
- alternatives: up to 3 other plausible species, most likely first.
- care: short, practical care guidance in Polish for this species (watering, light, temperature).
If the photo shows no plant, set isPlant to false, the names and care to null and alternatives to [].`;

type ChatResponse = {
  choices: { message: { content: string | null } }[];
  usage?: { cost?: number };
};

async function complete(apiKey: string, model: string, photo: Buffer, hint?: Candidate[]) {
  const text = hint?.length
    ? `A specialist plant classifier suggests (score 0-1):\n${hint
        .map((c) => `- ${c.scientificName} (${c.confidence.toFixed(2)})`)
        .join('\n')}\nUse this as a hint, but trust the photo.`
    : 'Identify this plant.';

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${photo.toString('base64')}` } },
          ],
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'identification', strict: true, schema: identificationJsonSchema },
      },
      // Only route to providers that honour structured output.
      provider: { require_parameters: true },
      usage: { include: true },
    }),
  });
  if (!response.ok) throw new Error(`OpenRouter ${model} ${response.status}: ${await response.text()}`);
  const body = (await response.json()) as ChatResponse;
  const content = body.choices[0]?.message.content ?? '';
  const identification = Identification.parse(JSON.parse(content.replace(/^```(?:json)?\s*|\s*```$/g, '')));
  return { identification, costUsd: body.usage?.cost ?? null };
}

function toCandidates(identification: Identification): Candidate[] {
  if (!identification.isPlant || !identification.scientificName) return [];
  return [
    {
      scientificName: identification.scientificName,
      commonName: identification.commonName,
      confidence: identification.confidence,
    },
    ...identification.alternatives,
  ];
}

/** A general vision model with structured output; also writes the Polish name and care guide. */
export function visionModel(apiKey: string, model: string): Provider {
  return {
    id: model,
    async identify(photo) {
      const { identification, costUsd } = await complete(apiKey, model, photo);
      return { candidates: toCandidates(identification), costUsd };
    },
  };
}

/** Hybrid: Pl@ntNet's top candidates go to the vision model as a hint. */
export function hybrid(keys: { openRouter: string; plantnet: string }, model: string): Provider {
  return {
    id: `plantnet+${model}`,
    async identify(photo) {
      const hint = await plantnetCandidates(keys.plantnet, photo);
      const { identification, costUsd } = await complete(keys.openRouter, model, photo, hint);
      return { candidates: toCandidates(identification), costUsd: (costUsd ?? 0) + 0.005 * EUR_TO_USD };
    },
  };
}
