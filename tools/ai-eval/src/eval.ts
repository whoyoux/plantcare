// Compares plant identification options on the iNaturalist test set: accuracy, latency, cost.
//   pnpm --filter @plantcare/ai-eval eval [--only plantnet,google/gemini-3.8-flash] [--limit 10]
// Keys come from tools/ai-eval/.env.local (see .env.example); providers without a key are skipped.
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

import type { Sample } from './dataset.ts';
import { plantId } from './providers/plant-id.ts';
import { plantnet } from './providers/plantnet.ts';
import type { Prediction, Provider } from './providers/types.ts';
import { hybrid, visionModel, type ModelOptions } from './providers/vision-model.ts';
import { matchesGenus, matchesSpecies, SPECIES } from './species.ts';

/** Vision models to try: fast/cheap tiers from each lab, plus one larger model as a quality ceiling. */
const MODELS: ModelOptions[] = [
  { model: 'google/gemini-3.8-flash' },
  { model: 'google/gemini-3.8-flash', effort: 'low' },
  { model: 'google/gemini-3.5-flash-lite' },
  { model: 'openai/gpt-5.6-luna', effort: 'low' },
  { model: 'anthropic/claude-haiku-5.5' },
  { model: 'anthropic/claude-sonnet-5.5' },
];
const HYBRID_MODEL: ModelOptions = { model: 'google/gemini-3.8-flash', effort: 'low' };
const CONCURRENCY = 4;

const ROOT = join(import.meta.dirname, '..');
const envFile = join(ROOT, '.env.local');
if (existsSync(envFile)) process.loadEnvFile(envFile);

const { values: args } = parseArgs({
  options: { only: { type: 'string' }, limit: { type: 'string' } },
});

const { OPENROUTER_API_KEY, PLANTNET_API_KEY, PLANT_ID_API_KEY } = process.env;
const providers: Provider[] = [
  ...(PLANTNET_API_KEY ? [plantnet(PLANTNET_API_KEY)] : []),
  ...(PLANT_ID_API_KEY ? [plantId(PLANT_ID_API_KEY)] : []),
  ...(OPENROUTER_API_KEY ? MODELS.map((model) => visionModel(OPENROUTER_API_KEY, model)) : []),
  ...(OPENROUTER_API_KEY && PLANTNET_API_KEY
    ? [hybrid({ openRouter: OPENROUTER_API_KEY, plantnet: PLANTNET_API_KEY }, HYBRID_MODEL)]
    : []),
].filter((provider) => !args.only || args.only.split(',').includes(provider.id));

if (providers.length === 0) {
  console.error('No providers to run. Add keys to tools/ai-eval/.env.local (see .env.example).');
  process.exit(1);
}

const samples = (JSON.parse(await readFile(join(ROOT, 'data', 'samples.json'), 'utf8')) as Sample[]).slice(
  0,
  args.limit ? Number(args.limit) : undefined,
);

type Row = {
  provider: string;
  file: string;
  species: string;
  ms: number;
  error?: string;
  prediction?: Prediction;
  top1: boolean;
  top3: boolean;
  genus: boolean;
};

async function run(provider: Provider, sample: Sample): Promise<Row> {
  const species = SPECIES.find((s) => s.name === sample.species)!;
  const photo = await readFile(join(ROOT, 'data', 'photos', sample.file));
  const started = performance.now();
  try {
    const prediction = await provider.identify(photo);
    const names = prediction.candidates.map((c) => c.scientificName);
    return {
      provider: provider.id,
      file: sample.file,
      species: sample.species,
      ms: performance.now() - started,
      prediction,
      top1: matchesSpecies(species, names[0]),
      top3: names.slice(0, 3).some((name) => matchesSpecies(species, name)),
      genus: matchesGenus(species, names[0]),
    };
  } catch (error) {
    return {
      provider: provider.id,
      file: sample.file,
      species: sample.species,
      ms: performance.now() - started,
      error: error instanceof Error ? error.message : String(error),
      top1: false,
      top3: false,
      genus: false,
    };
  }
}

/** Runs tasks with a fixed number in flight, keeping the input order. */
async function pool<T>(tasks: (() => Promise<T>)[], size: number) {
  const results: T[] = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (next < tasks.length) {
        const index = next++;
        results[index] = await tasks[index]!();
      }
    }),
  );
  return results;
}

const rows: Row[] = [];
for (const provider of providers) {
  process.stdout.write(`${provider.id} … `);
  const results = await pool(
    samples.map((sample) => () => run(provider, sample)),
    CONCURRENCY,
  );
  rows.push(...results);
  const errors = results.filter((row) => row.error);
  console.log(`done${errors.length ? ` (${errors.length} errors, first: ${errors[0]!.error})` : ''}`);
}

const percent = (part: number, total: number) => `${total ? Math.round((part / total) * 100) : 0}%`;
const quantile = (values: number[], q: number) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] ?? 0;
};

const table = [
  '| Provider | Species (top 1) | Species (top 3) | Genus | Median | p90 | Cost / 1000 photos | Errors |',
  '| --- | --- | --- | --- | --- | --- | --- | --- |',
  ...providers.map((provider) => {
    const own = rows.filter((row) => row.provider === provider.id);
    const ok = own.filter((row) => !row.error);
    const costs = ok.map((row) => row.prediction?.costUsd).filter((cost) => cost != null);
    const cost = costs.length ? `$${((costs.reduce((a, b) => a + b, 0) / costs.length) * 1000).toFixed(2)}` : 'n/a';
    const ms = ok.map((row) => row.ms);
    return [
      provider.id,
      percent(own.filter((r) => r.top1).length, own.length),
      percent(own.filter((r) => r.top3).length, own.length),
      percent(own.filter((r) => r.genus).length, own.length),
      `${(quantile(ms, 0.5) / 1000).toFixed(1)} s`,
      `${(quantile(ms, 0.9) / 1000).toFixed(1)} s`,
      cost,
      String(own.length - ok.length),
    ].join(' | ');
  }),
].map((line) => (line.startsWith('| ') ? line : `| ${line} |`));

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
await mkdir(join(ROOT, 'results'), { recursive: true });
await writeFile(join(ROOT, 'results', `${stamp}.json`), JSON.stringify(rows, null, 2));
await writeFile(join(ROOT, 'results', `${stamp}.md`), `${samples.length} photos\n\n${table.join('\n')}\n`);

console.log(`\n${samples.length} photos\n\n${table.join('\n')}\n\nDetails: results/${stamp}.json`);
