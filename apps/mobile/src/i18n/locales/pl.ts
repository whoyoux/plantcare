import type { Translations } from '../types';
import type en from './en';

const pl: Translations<typeof en> = {
  tabs: {
    identify: 'Rozpoznaj',
    history: 'Historia',
    settings: 'Ustawienia',
  },
  identify: {
    heading: 'Co to za roślina?',
    description: 'Zrób zdjęcie liścia, kwiatu lub całej rośliny, aby poznać jej nazwę i zasady pielęgnacji.',
    takePhoto: 'Zrób zdjęcie',
    chooseFromLibrary: 'Wybierz z biblioteki',
    cameraUnavailable: 'Aparat jest niedostępny. Sprawdź dostęp do aparatu w Ustawieniach.',
  },
  result: {
    title: 'Wynik',
    match: 'Dopasowanie {{value}}%',
    care: 'Pielęgnacja',
    watering: 'Podlewanie',
    light: 'Światło',
    temperature: 'Temperatura',
    sampleNotice: 'Przykładowy wynik. Prawdziwe rozpoznawanie pojawi się w kolejnym kroku.',
  },
  history: {
    title: 'Historia',
    searchPlaceholder: 'Szukaj roślin',
    emptyTitle: 'Brak roślin',
    emptyDescription: 'Tutaj pojawią się rozpoznane rośliny.',
    noResultsTitle: 'Brak wyników dla „{{query}}”',
    plantCount_one: '{{count}} roślina',
    plantCount_few: '{{count}} rośliny',
    plantCount_many: '{{count}} roślin',
    plantCount_other: '{{count}} rośliny',
  },
  settings: {
    title: 'Ustawienia',
    account: 'Konto',
    signIn: 'Zaloguj się przez Apple',
    comingSoon: 'Wkrótce',
    general: 'Ogólne',
    language: 'Język',
    languageFooter: 'Aplikacja używa języka iPhone’a. Możesz go zmienić dla PlantCare w Ustawieniach iOS.',
    about: 'O aplikacji',
    version: 'Wersja',
    developer: 'Deweloperskie',
    developerFooter: 'Tylko w buildach development i preview.',
    appearance: 'Wygląd',
    system: 'Systemowy',
    light: 'Jasny',
    dark: 'Ciemny',
    variant: 'Wariant',
    runtimeVersion: 'Wersja runtime',
    channel: 'Kanał aktualizacji',
  },
  languages: {
    en: 'English',
    pl: 'Polski',
  },
};

export default pl;
