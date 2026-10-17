/**
 * Test set: popular houseplants (the main use case), plus garden plants, herbs and common wild
 * plants in Poland. `synonyms` lists names a provider may legitimately return for the same species.
 */
/**
 * `indoor`: grown in pots, so test photos come from cultivated observations, like the app's users take.
 * `lookalike`: part of a set of species that are easy to confuse with each other (harder test).
 */
export type Species = { name: string; synonyms?: string[]; indoor?: boolean; lookalike?: boolean };

export const SPECIES: Species[] = [
  // Houseplants
  { name: 'Monstera deliciosa', indoor: true },
  { name: 'Epipremnum aureum', synonyms: ['Scindapsus aureus'], indoor: true },
  { name: 'Philodendron hederaceum', synonyms: ['Philodendron scandens'], indoor: true },
  { name: 'Ficus lyrata', indoor: true },
  { name: 'Ficus elastica', indoor: true },
  { name: 'Dracaena trifasciata', synonyms: ['Sansevieria trifasciata'], indoor: true },
  { name: 'Zamioculcas zamiifolia', indoor: true },
  { name: 'Spathiphyllum wallisii', synonyms: ['Spathiphyllum floribundum'], indoor: true },
  { name: 'Chlorophytum comosum', indoor: true },
  { name: 'Aloe vera', synonyms: ['Aloe barbadensis'], indoor: true },
  { name: 'Crassula ovata', indoor: true },
  { name: 'Goeppertia orbifolia', synonyms: ['Calathea orbifolia'], indoor: true },
  { name: 'Pilea peperomioides', indoor: true },
  { name: 'Dieffenbachia seguine', indoor: true },
  { name: 'Aglaonema commutatum', indoor: true },
  { name: 'Strelitzia reginae', indoor: true },
  { name: 'Begonia maculata', indoor: true },
  { name: 'Peperomia obtusifolia', indoor: true },
  { name: 'Schefflera arboricola', synonyms: ['Heptapleurum arboricola'], indoor: true },
  { name: 'Dracaena marginata', synonyms: ['Dracaena reflexa'], indoor: true },
  { name: 'Nephrolepis exaltata', indoor: true },
  { name: 'Tradescantia zebrina', indoor: true },
  { name: 'Maranta leuconeura', indoor: true },
  { name: 'Hoya carnosa', indoor: true },
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
  // Look-alikes: mints and other aromatic Lamiaceae, carrot-family herbs, nettle vs dead-nettle
  { name: 'Mentha spicata', lookalike: true },
  { name: 'Mentha × piperita', synonyms: ['Mentha piperita'], lookalike: true },
  { name: 'Melissa officinalis', lookalike: true },
  { name: 'Nepeta cataria', lookalike: true },
  { name: 'Origanum vulgare', lookalike: true },
  { name: 'Thymus vulgaris', lookalike: true },
  { name: 'Salvia officinalis', lookalike: true },
  { name: 'Petroselinum crispum', lookalike: true },
  { name: 'Coriandrum sativum', lookalike: true },
  { name: 'Lamium album', lookalike: true },
];

/** First two words, lowercased: genus + species epithet. */
export function binomial(name: string | null | undefined) {
  if (!name) return undefined;
  // Hybrids: "Mentha × piperita" and "Mentha x piperita" both mean genus + epithet.
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+[×x]\s+/, ' ')
    .split(/\s+/)
    .slice(0, 2)
    .join(' ');
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
