import type { Lang } from '~/i18n';

/** Interface copy for the home page and site chrome. */
export const ui = {
  pl: {
    nav: { privacy: 'Prywatność', terms: 'Regulamin', support: 'Pomoc', switchLang: 'English' },
    meta: {
      title: 'PlantCare: rozpoznaj roślinę ze zdjęcia',
      description:
        'Zrób zdjęcie liścia, kwiatu lub całej rośliny. PlantCare powie Ci, co to za gatunek i jak o niego dbać.',
    },
    hero: {
      title: 'Co to za roślina?',
      body: 'Zrób zdjęcie liścia, kwiatu lub całej rośliny. PlantCare rozpozna gatunek i podpowie, jak go podlewać, ile potrzebuje światła i w jakiej temperaturze rośnie najlepiej.',
      soon: 'Wkrótce w App Store',
      how: 'Jak to działa',
    },
    specimen: {
      name: 'Monstera dziurawa',
      match: 'Dopasowanie 94%',
      care: 'Pielęgnacja',
      rows: [
        { label: 'Podlewanie', value: 'Co 7–10 dni, gdy wierzch ziemi przeschnie' },
        { label: 'Światło', value: 'Jasne, rozproszone' },
        { label: 'Temperatura', value: '18–27 °C' },
      ],
    },
    steps: {
      title: 'Jak to działa',
      items: [
        {
          title: 'Zrób zdjęcie',
          body: 'Nakieruj aparat na liść, kwiat albo całą roślinę. Możesz też wybrać zdjęcie z biblioteki.',
        },
        {
          title: 'Poznaj gatunek',
          body: 'Dostajesz nazwę polską i łacińską, rodzinę oraz to, jak pewne jest rozpoznanie.',
        },
        {
          title: 'Dbaj o roślinę',
          body: 'Podlewanie, światło i temperatura dla tego gatunku, zapisane w Twojej historii.',
        },
      ],
    },
    privacy: {
      title: 'Twoje zdjęcia są tylko Twoje',
      body: 'Nie pokazujemy reklam i nie śledzimy Cię. Konto razem ze zdjęciami i historią usuniesz w aplikacji jednym przyciskiem.',
      link: 'Polityka prywatności',
    },
    footer: { rights: 'Wszystkie prawa zastrzeżone.' },
    legal: { updated: 'Ostatnia aktualizacja:', back: 'Strona główna' },
    notFound: {
      title: 'Nie ma takiej strony',
      body: 'Sprawdź adres albo wróć na stronę główną.',
      home: 'Strona główna',
    },
  },
  en: {
    nav: { privacy: 'Privacy', terms: 'Terms', support: 'Support', switchLang: 'Polski' },
    meta: {
      title: 'PlantCare: identify plants from a photo',
      description:
        'Take a photo of a leaf, flower or the whole plant. PlantCare tells you what it is and how to care for it.',
    },
    hero: {
      title: 'What plant is this?',
      body: 'Take a photo of a leaf, flower or the whole plant. PlantCare identifies the species and tells you how often to water it, how much light it needs and what temperature suits it best.',
      soon: 'Coming soon to the App Store',
      how: 'How it works',
    },
    specimen: {
      name: 'Swiss cheese plant',
      match: '94% match',
      care: 'Care',
      rows: [
        { label: 'Watering', value: 'Every 7–10 days, when the topsoil is dry' },
        { label: 'Light', value: 'Bright, indirect' },
        { label: 'Temperature', value: '18–27 °C' },
      ],
    },
    steps: {
      title: 'How it works',
      items: [
        {
          title: 'Take a photo',
          body: 'Point the camera at a leaf, a flower or the whole plant, or pick a photo from your library.',
        },
        {
          title: 'Get the species',
          body: 'See the common and Latin name, the plant family and how confident the match is.',
        },
        {
          title: 'Care for it',
          body: 'Watering, light and temperature for that species, saved in your history.',
        },
      ],
    },
    privacy: {
      title: 'Your photos stay yours',
      body: 'No ads and no tracking. Delete your account, photos and history from the app with one button.',
      link: 'Privacy Policy',
    },
    footer: { rights: 'All rights reserved.' },
    legal: { updated: 'Last updated:', back: 'Home' },
    notFound: { title: 'Page not found', body: 'Check the address or go back to the home page.', home: 'Home' },
  },
} satisfies Record<Lang, unknown>;
