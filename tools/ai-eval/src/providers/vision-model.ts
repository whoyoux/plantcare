import { PROMPTS, type PromptVersion } from '../prompts.ts';

import { plantnetCandidates } from './plantnet.ts';
import { EUR_TO_USD, type Candidate, type Provider } from './types.ts';

type ChatResponse = {
  choices: { message: { content: string | null } }[];
  usage?: { cost?: number };
};

export type ModelOptions = {
  model: string;
  /** Reasoning effort for thinking models; omit for the model default. */ effort?: 'minimal' | 'low';
  /** Prompt and schema version (see prompts.ts). */
  prompt?: PromptVersion;
};

async function complete(
  apiKey: string,
  { model, effort, prompt = 'v2' }: ModelOptions,
  photo: Buffer,
  hint?: Candidate[],
) {
  const version = PROMPTS[prompt];
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
        { role: 'system', content: version.prompt('pl') },
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
        json_schema: { name: 'identification', strict: true, schema: version.schema },
      },
      // Only route to providers that honour structured output.
      provider: { require_parameters: true },
      ...(effort ? { reasoning: { effort } } : {}),
      usage: { include: true },
    }),
  });
  if (!response.ok) throw new Error(`OpenRouter ${model} ${response.status}: ${await response.text()}`);
  const body = (await response.json()) as ChatResponse;
  const content = body.choices[0]?.message.content ?? '';
  const identification = version.parse.parse(JSON.parse(content.replace(/^```(?:json)?\s*|\s*```$/g, '')));
  return { identification, costUsd: body.usage?.cost ?? null };
}

function toCandidates(identification: {
  isPlant: boolean;
  scientificName: string | null;
  commonName: string | null;
  confidence: number;
  alternatives: Candidate[];
}): Candidate[] {
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
const label = ({ model, effort, prompt = 'v2' }: ModelOptions) =>
  `${model}${effort ? ` (${effort})` : ''} · prompt ${prompt}`;

export function visionModel(apiKey: string, options: ModelOptions): Provider {
  return {
    id: label(options),
    async identify(photo) {
      const { identification, costUsd } = await complete(apiKey, options, photo);
      return { candidates: toCandidates(identification), costUsd };
    },
  };
}

/** Hybrid: Pl@ntNet's top candidates go to the vision model as a hint. */
export function hybrid(keys: { openRouter: string; plantnet: string }, options: ModelOptions): Provider {
  return {
    id: `plantnet + ${label(options)}`,
    async identify(photo) {
      const hint = await plantnetCandidates(keys.plantnet, photo);
      const { identification, costUsd } = await complete(keys.openRouter, options, photo, hint);
      return { candidates: toCandidates(identification), costUsd: (costUsd ?? 0) + 0.005 * EUR_TO_USD };
    },
  };
}
