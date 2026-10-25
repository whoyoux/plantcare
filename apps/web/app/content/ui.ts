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
    phone: {
      name: 'Monstera dziurawa',
      match: '94%',
      toxic: 'Trująca',
      toxicFor: 'Trująca dla kotów i psów',
      rows: [
        { label: 'Podlewanie', value: 'Co 7–10 dni' },
        { label: 'Światło', value: 'Jasne, rozproszone' },
      ],
      toxicNote: 'Sok z liści podrażnia usta i żołądek.',
      add: 'Dodaj do moich roślin',
      close: 'Zamknij',
    },
    features: {
      title: 'Wszystko o Twoich roślinach',
      identify: {
        title: 'Rozpoznaj w kilka sekund',
        body: 'Zdjęcie liścia, kwiatu albo całej rośliny. Do trzech zdjęć naraz, gdy gatunki są do siebie podobne.',
        label: 'Mięta zielona · Mentha spicata',
      },
      toxic: {
        title: 'Od razu widać, co jest trujące',
        body: 'Jeśli roślina szkodzi kotom, psom albo ludziom, mówimy to na samej górze, na czerwono.',
        banner: 'Silnie trująca dla kotów',
      },
      herbarium: {
        title: 'Twój zielnik',
        body: 'Każdy rozpoznany gatunek trafia do kolekcji. Zbieraj odznaki: Kolekcjoner, Botanik, Zielarz.',
        label: 'No. 23 · Kolekcjoner II',
      },
      water: {
        title: 'Przypomnienia o podlewaniu',
        body: 'Dodaj roślinę, a telefon przypomni, kiedy ją podlać. Dla każdej rośliny osobno, tylko jeśli chcesz.',
        sample: 'Figowiec · podlej dziś',
      },
      widgets: {
        title: 'Widżety',
        body: '„Do podlania” i zielnik na ekranie głównym i ekranie blokady.',
      },
    },
    video: { title: 'Zobacz w akcji', label: 'Film: jak działa PlantCare' },
    privacy: {
      title: 'Twoje zdjęcia są tylko Twoje',
      body: 'Nie pokazujemy reklam i nie śledzimy Cię. Konto razem ze zdjęciami i historią usuniesz w aplikacji jednym przyciskiem.',
      link: 'Polityka prywatności',
    },
    footer: {
      rights: 'Wszystkie prawa zastrzeżone.',
      photos: 'Zdjęcia roślin: Wikimedia Commons (domena publiczna).',
    },
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
    phone: {
      name: 'Swiss cheese plant',
      match: '94%',
      toxic: 'Toxic',
      toxicFor: 'Toxic to cats and dogs',
      rows: [
        { label: 'Watering', value: 'Every 7–10 days' },
        { label: 'Light', value: 'Bright, indirect' },
      ],
      toxicNote: 'The sap irritates the mouth and stomach.',
      add: 'Add to my plants',
      close: 'Close',
    },
    features: {
      title: 'Everything about your plants',
      identify: {
        title: 'Identify in seconds',
        body: 'A photo of a leaf, a flower or the whole plant. Up to three photos at once when species look alike.',
        label: 'Spearmint · Mentha spicata',
      },
      toxic: {
        title: 'See at once what’s toxic',
        body: 'If a plant can harm cats, dogs or people, we say so right at the top, in red.',
        banner: 'Highly toxic to cats',
      },
      herbarium: {
        title: 'Your herbarium',
        body: 'Every species you identify joins your collection. Earn badges: Collector, Botanist, Herbalist.',
        label: 'No. 23 · Collector II',
      },
      water: {
        title: 'Watering reminders',
        body: 'Add a plant and your phone reminds you when to water it. Per plant, only if you want.',
        sample: 'Fiddle-leaf fig · water today',
      },
      widgets: {
        title: 'Widgets',
        body: '“Water today” and your herbarium on the Home Screen and Lock Screen.',
      },
    },
    video: { title: 'See it in action', label: 'Video: how PlantCare works' },
    privacy: {
      title: 'Your photos stay yours',
      body: 'No ads and no tracking. Delete your account, photos and history from the app with one button.',
      link: 'Privacy Policy',
    },
    footer: {
      rights: 'All rights reserved.',
      photos: 'Plant photos: Wikimedia Commons (public domain).',
    },
    legal: { updated: 'Last updated:', back: 'Home' },
    notFound: { title: 'Page not found', body: 'Check the address or go back to the home page.', home: 'Home' },
  },
} satisfies Record<Lang, unknown>;
