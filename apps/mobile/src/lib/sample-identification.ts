import type { Language } from '@/i18n';

// Placeholder until POST /v1/identify exists (step 7).
export const sampleIdentification = {
  scientificName: 'Monstera deliciosa',
  confidence: 94,
  commonName: { en: 'Swiss cheese plant', pl: 'Monstera dziurawa' },
  care: {
    watering: {
      en: 'Every 7–10 days, when the top soil is dry',
      pl: 'Co 7–10 dni, gdy wierzchnia warstwa ziemi przeschnie',
    },
    light: { en: 'Bright, indirect light', pl: 'Jasne, rozproszone światło' },
    temperature: { en: '18–27 °C', pl: '18–27 °C' },
  },
} satisfies {
  scientificName: string;
  confidence: number;
  commonName: Record<Language, string>;
  care: Record<string, Record<Language, string>>;
};
