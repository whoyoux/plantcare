// Generates icon artwork candidates the SnapAI way (https://github.com/betomoedano/snapai):
// SnapAI builds the enhanced, style-aware prompt; the image itself comes from OpenRouter's
// Image API, because SnapAI only speaks OpenAI's /images/generations.
//
// Setup: put OPENROUTER_API_KEY=... in apps/mobile/.env.icons.local (gitignored).
// Run:   pnpm --filter @plantcare/mobile icons:artwork -- --prompt "..." [--style glassy] [--n 3]
// Then copy the chosen candidate to assets/icons/source/artwork.png and run `pnpm icons`.
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const { values } = parseArgs({
  options: {
    prompt: { type: 'string' },
    style: { type: 'string', default: 'glassy' },
    n: { type: 'string', default: '3' },
    model: { type: 'string', default: 'openai/gpt-image-1' },
  },
});

if (!values.prompt) throw new Error('Missing --prompt');
const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) throw new Error('Missing OPENROUTER_API_KEY (set it in apps/mobile/.env.icons.local)');

const preview = execFileSync(
  'npx',
  ['-y', 'snapai@1', 'icon', '--prompt', values.prompt, '--style', values.style, '--model', 'gpt-1.5', '--background', 'transparent', '--prompt-only'],
  { encoding: 'utf8' },
);
const marker = 'Final prompt (sent to the model):';
const prompt = preview.slice(preview.indexOf(marker) + marker.length).trim();
if (!preview.includes(marker) || !prompt) throw new Error('Could not read the SnapAI prompt');

const response = await fetch('https://openrouter.ai/api/v1/images', {
  method: 'POST',
  headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: values.model,
    prompt,
    n: Number(values.n),
    aspect_ratio: '1:1',
    quality: 'high',
    background: 'transparent',
    output_format: 'png',
  }),
});
if (!response.ok) throw new Error(`OpenRouter ${response.status}: ${await response.text()}`);
const { data, usage } = await response.json();

const dir = join(root, 'assets/icons/source/candidates');
await mkdir(dir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
for (const [index, image] of data.entries()) {
  const file = join(dir, `${stamp}-${index + 1}.png`);
  await writeFile(file, Buffer.from(image.b64_json, 'base64'));
  console.log(file);
}
if (usage?.cost !== undefined) console.log(`Cost: $${usage.cost}`);
