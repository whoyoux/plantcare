import type { Identification } from '@plantcare/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppError } from '../errors';
import { createPlantIdentifier } from './plant-identifier';

const monstera: Identification = {
  analysis: 'Large glossy heart-shaped leaves with deep splits and holes.',
  isPlant: true,
  scientificName: 'Monstera deliciosa',
  commonName: 'Monstera dziurawa',
  family: 'Araceae',
  confidence: 0.94,
  alternatives: [],
  care: { watering: 'Co 7–10 dni', light: 'Jasne, rozproszone', temperature: '18–27 °C', wateringDays: 8 },
  toxicity: { cats: 'mild', dogs: 'mild', people: 'mild', note: 'Sok z liści podrażnia usta i żołądek.' },
};

const reply = (content: string) => Response.json({ choices: [{ message: { content } }] });

function setup(...responses: Response[]) {
  const fetch = vi.fn<typeof globalThis.fetch>();
  for (const response of responses) fetch.mockResolvedValueOnce(response);
  vi.stubGlobal('fetch', fetch);
  const identifier = createPlantIdentifier({
    baseUrl: 'https://openrouter.example/api/v1',
    apiKey: 'key',
    config: { model: 'google/gemini-3.8-flash', effort: 'low' },
  });
  return { fetch, identifier };
}

const photo = new Uint8Array([0xff, 0xd8, 0xff, 0x00]);

afterEach(() => vi.unstubAllGlobals());

describe('createPlantIdentifier', () => {
  it('sends the photo with the schema and prompt in the requested language', async () => {
    const { fetch, identifier } = setup(reply(JSON.stringify(monstera)));

    await expect(identifier.identify(photo, 'pl')).resolves.toEqual(monstera);

    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe('https://openrouter.example/api/v1/chat/completions');
    const body = JSON.parse(init!.body as string) as {
      model: string;
      reasoning: unknown;
      messages: { content: unknown }[];
      response_format: { type: string };
    };
    expect(body.model).toBe('google/gemini-3.8-flash');
    expect(body.reasoning).toEqual({ effort: 'low' });
    expect(body.response_format.type).toBe('json_schema');
    expect(body.messages[0]!.content).toContain('Polish');
    expect(JSON.stringify(body.messages[1]!.content)).toContain('data:image/jpeg;base64,/9j/');
  });

  it('accepts JSON wrapped in a Markdown fence', async () => {
    const { identifier } = setup(reply('```json\n' + JSON.stringify(monstera) + '\n```'));
    await expect(identifier.identify(photo, 'en')).resolves.toEqual(monstera);
  });

  it('retries once when the output does not match the schema', async () => {
    const { fetch, identifier } = setup(reply('{"isPlant": "maybe"}'), reply(JSON.stringify(monstera)));
    await expect(identifier.identify(photo, 'en')).resolves.toEqual(monstera);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('gives up after two bad answers', async () => {
    const { identifier } = setup(reply('not json'), reply('still not json'));
    await expect(identifier.identify(photo, 'en')).rejects.toEqual(new AppError('IDENTIFICATION_FAILED', 502));
  });

  it('fails without retrying when OpenRouter returns an error', async () => {
    const { fetch, identifier } = setup(new Response('upstream down', { status: 503 }));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(identifier.identify(photo, 'en')).rejects.toBeInstanceOf(AppError);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
