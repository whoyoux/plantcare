// Facts used across the site and the legal pages. Fill in before publishing to production.
export const SITE = {
  name: 'PlantCare',
  url: 'https://plantcare.whxx.dev',
  /** Person or company responsible for the app (the data controller). */
  controller: '[DO UZUPEŁNIENIA: imię i nazwisko lub nazwa firmy, adres]',
  contactEmail: '[DO UZUPEŁNIENIA: adres e-mail kontaktowy]',
  /** AI model provider that receives photos for identification (decided with POST /v1/identify). */
  aiProvider: '[DO UZUPEŁNIENIA po wyborze modelu AI]',
  legalUpdated: '2026-10-15',
} as const;
