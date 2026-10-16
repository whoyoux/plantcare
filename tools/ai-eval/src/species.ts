/**
 * Test set: popular houseplants (the main use case), plus garden plants, herbs and common wild
 * plants in Poland. `synonyms` lists names a provider may legitimately return for the same species.
 */
export type Species = { name: string; synonyms?: string[] };

export const SPECIES: Species[] = [
  // Houseplants
  { name: 'Monstera deliciosa' },
  { name: 'Epipremnum aureum', synonyms: ['Scindapsus aureus'] },
  { name: 'Philodendron hederaceum', synonyms: ['Philodendron scandens'] },
  { name: 'Ficus lyrata' },
  { name: 'Ficus elastica' },
  { name: 'Dracaena trifasciata', synonyms: ['Sansevieria trifasciata'] },
  { name: 'Zamioculcas zamiifolia' },
  { name: 'Spathiphyllum wallisii', synonyms: ['Spathiphyllum floribundum'] },
  { name: 'Chlorophytum comosum' },
  { name: 'Aloe vera', synonyms: ['Aloe barbadensis'] },
  { name: 'Crassula ovata' },
  { name: 'Goeppertia orbifolia', synonyms: ['Calathea orbifolia'] },
  { name: 'Pilea peperomioides' },
  { name: 'Dieffenbachia seguine' },
  { name: 'Aglaonema commutatum' },
  { name: 'Strelitzia reginae' },
  { name: 'Begonia maculata' },
  { name: 'Peperomia obtusifolia' },
  { name: 'Schefflera arboricola', synonyms: ['Heptapleurum arboricola'] },
  { name: 'Dracaena marginata', synonyms: ['Dracaena reflexa'] },
  { name: 'Nephrolepis exaltata' },
  { name: 'Tradescantia zebrina' },
  { name: 'Maranta leuconeura' },
  { name: 'Hoya carnosa' },
  // Garden, herbs, wild
  { name: 'Hedera helix' },
  { name: 'Lavandula angustifolia' },
  { name: 'Hydrangea macrophylla' },
  { name: 'Ocimum basilicum' },
  { name: 'Salvia rosmarinus', synonyms: ['Rosmarinus officinalis'] },
  { name: 'Taraxacum officinale' },
  { name: 'Bellis perennis' },
  { name: 'Urtica dioica' },
  { name: 'Quercus robur' },
  { name: 'Acer platanoides' },
  { name: 'Betula pendula' },
];

/** First two words, lowercased: genus + species epithet. */
export function binomial(name: string | null | undefined) {
  if (!name) return undefined;
  return name.trim().toLowerCase().split(/\s+/).slice(0, 2).join(' ');
}

export function genusOf(name: string | null | undefined) {
  return binomial(name)?.split(' ')[0];
}

export function matchesSpecies(species: Species, candidate: string | null | undefined) {
  const guess = binomial(candidate);
  return !!guess && [species.name, ...(species.synonyms ?? [])].some((name) => binomial(name) === guess);
}

export function matchesGenus(species: Species, candidate: string | null | undefined) {
  const guess = genusOf(candidate);
  return !!guess && [species.name, ...(species.synonyms ?? [])].some((name) => genusOf(name) === guess);
}
