// Downloads a labelled test set from iNaturalist: research-grade observations with an open
// licence, a few photos per species. Run once: `pnpm --filter @plantcare/ai-eval dataset`.
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { SPECIES, type Species } from './species.ts';

const PHOTOS_PER_SPECIES = 2;
const DATA_DIR = join(import.meta.dirname, '..', 'data');
const PHOTO_DIR = join(DATA_DIR, 'photos');
const HEADERS = { 'User-Agent': 'PlantCare-eval/0.1 (https://plantcare.whxx.dev)' };

type Observation = {
  id: number;
  uri: string;
  photos: { id: number; url: string; license_code: string | null; attribution: string }[];
};

/** iNaturalist sometimes drops connections; retry with a pause. */
async function get(url: string, attempts = 4): Promise<Response> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fetch(url, { headers: HEADERS });
    } catch (error) {
      if (attempt >= attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
    }
  }
}

export type Sample = {
  file: string;
  species: string;
  source: string;
  license: string;
  attribution: string;
};

async function observations(species: Species): Promise<Observation[]> {
  const params = new URLSearchParams({
    taxon_name: species.name,
    photos: 'true',
    photo_license: 'cc0,cc-by,cc-by-nc,cc-by-sa',
    // Recent everyday photos, not the most-voted ones (those skew towards flowers and rarities).
    order_by: 'created_at',
    per_page: String(PHOTOS_PER_SPECIES * 3),
    // Potted plants are "captive" on iNaturalist and can't be research grade; require the
    // community to agree with the ID instead.
    ...(species.indoor ? { captive: 'true', identifications: 'most_agree' } : { quality_grade: 'research' }),
  });
  const response = await get(`https://api.inaturalist.org/v1/observations?${params.toString()}`);
  if (!response.ok) throw new Error(`iNaturalist ${response.status} for ${species.name}`);
  const { results } = (await response.json()) as { results: Observation[] };
  return results;
}

await rm(PHOTO_DIR, { recursive: true, force: true });
await mkdir(PHOTO_DIR, { recursive: true });
const samples: Sample[] = [];

for (const species of SPECIES) {
  const picked = (await observations(species)).filter((o) => o.photos[0]).slice(0, PHOTOS_PER_SPECIES);
  for (const observation of picked) {
    const photo = observation.photos[0]!;
    // "large" is 1024 px on the long edge, close to what the app will upload.
    const response = await get(photo.url.replace('/square.', '/large.'));
    if (!response.ok) continue;
    const file = `${species.name.replace(/\s+/g, '-').toLowerCase()}-${observation.id}.jpg`;
    await writeFile(join(PHOTO_DIR, file), Buffer.from(await response.arrayBuffer()));
    samples.push({
      file,
      species: species.name,
      source: observation.uri,
      license: photo.license_code ?? 'unknown',
      attribution: photo.attribution,
    });
  }
  console.log(`${species.name}: ${picked.length}`);
  // iNaturalist asks API clients to stay around one request per second.
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

await writeFile(join(DATA_DIR, 'samples.json'), JSON.stringify(samples, null, 2));
console.log(`\n${samples.length} photos in ${PHOTO_DIR}`);
