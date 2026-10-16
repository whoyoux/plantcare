// Downloads a labelled test set from iNaturalist: research-grade observations with an open
// licence, a few photos per species. Run once: `pnpm --filter @plantcare/ai-eval dataset`.
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { SPECIES } from './species.ts';

const PHOTOS_PER_SPECIES = 2;
const DATA_DIR = join(import.meta.dirname, '..', 'data');
const PHOTO_DIR = join(DATA_DIR, 'photos');
const HEADERS = { 'User-Agent': 'PlantCare-eval/0.1 (https://plantcare.whxx.dev)' };

type Observation = {
  id: number;
  uri: string;
  photos: { id: number; url: string; license_code: string | null; attribution: string }[];
};

export type Sample = {
  file: string;
  species: string;
  source: string;
  license: string;
  attribution: string;
};

async function observations(name: string): Promise<Observation[]> {
  const params = new URLSearchParams({
    taxon_name: name,
    quality_grade: 'research',
    photos: 'true',
    photo_license: 'cc0,cc-by,cc-by-nc,cc-by-sa',
    order_by: 'votes',
    per_page: String(PHOTOS_PER_SPECIES * 3),
  });
  const response = await fetch(`https://api.inaturalist.org/v1/observations?${params.toString()}`, {
    headers: HEADERS,
  });
  if (!response.ok) throw new Error(`iNaturalist ${response.status} for ${name}`);
  const { results } = (await response.json()) as { results: Observation[] };
  return results;
}

await mkdir(PHOTO_DIR, { recursive: true });
const samples: Sample[] = [];

for (const species of SPECIES) {
  const picked = (await observations(species.name)).filter((o) => o.photos[0]).slice(0, PHOTOS_PER_SPECIES);
  for (const observation of picked) {
    const photo = observation.photos[0]!;
    // "large" is 1024 px on the long edge, close to what the app will upload.
    const response = await fetch(photo.url.replace('/square.', '/large.'), { headers: HEADERS });
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
