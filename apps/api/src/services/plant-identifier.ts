import { Identification, identificationJsonSchema, identificationPrompt, type Language } from '@plantcare/shared';

import { AppError } from '../errors';

export type ModelConfig = {
  /** OpenRouter model id. */
  model: string;
  /** Reasoning effort for thinking models; lower is faster. */
  effort?: 'minimal' | 'low';
};

type ChatResponse = { choices?: { message?: { content?: string | null } }[] };

function toBase64(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

/** Some providers wrap JSON in a Markdown fence even in structured-output mode. */
function parseIdentification(content: string) {
  const json = content.trim().replace(/^```(?:json)?\s*|\s*```$/g, '');
  return Identification.safeParse(JSON.parse(json));
}

/**
 * Identifies a plant with a vision model through OpenRouter (an OpenAI-compatible API). Limits
 * live in the API (per user and overall) and on the OpenRouter key (credit limit).
 */
export function createPlantIdentifier(deps: { baseUrl: string; apiKey: string; config: ModelConfig }) {
  async function attempt(photo: Uint8Array, language: Language) {
    const response = await fetch(`${deps.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${deps.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: deps.config.model,
        messages: [
          { role: 'system', content: identificationPrompt(language) },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Identify this plant.' },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${toBase64(photo)}` } },
            ],
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'identification', strict: true, schema: identificationJsonSchema },
        },
        provider: { require_parameters: true },
        ...(deps.config.effort ? { reasoning: { effort: deps.config.effort } } : {}),
      }),
    });
    if (!response.ok) {
      console.error('Model request failed', response.status, await response.text());
      throw new AppError('IDENTIFICATION_FAILED', 502);
    }
    const body = await response.json<ChatResponse>();
    try {
      return parseIdentification(body.choices?.[0]?.message?.content ?? '');
    } catch {
      return null;
    }
  }

  return {
    model: deps.config.model,
    /** Retries once when the model returns output that doesn't match the schema. */
    async identify(photo: Uint8Array, language: Language): Promise<Identification> {
      for (let i = 0; i < 2; i++) {
        const result = await attempt(photo, language);
        if (result?.success) return result.data;
      }
      throw new AppError('IDENTIFICATION_FAILED', 502);
    },
  };
}

export type PlantIdentifier = ReturnType<typeof createPlantIdentifier>;
