import type { Lang } from '~/i18n';
import { SITE } from '~/site';

export type Block = string | { list: string[] };
export type LegalDoc = {
  title: string;
  description: string;
  intro: string;
  sections: { heading: string; blocks: Block[] }[];
};

/*
 * Written from what the app actually does (see apps/api and apps/mobile). Keep in sync when data
 * handling changes, and have it reviewed by someone who knows GDPR before the App Store release.
 */

const privacyPl: LegalDoc = {
  title: 'Polityka prywatności',
  description: 'Jakie dane zbiera PlantCare, po co, gdzie je przechowujemy i jak je usunąć.',
  intro:
    'PlantCare to aplikacja, która rozpoznaje rośliny ze zdjęć i podpowiada, jak o nie dbać. Ta polityka opisuje, jakie dane przy tym przetwarzamy, w jakim celu i jakie masz prawa.',
  sections: [
    {
      heading: 'Kto odpowiada za Twoje dane',
      blocks: [
        `Administratorem danych jest ${SITE.controller}. W sprawach prywatności napisz na ${SITE.contactEmail}.`,
      ],
    },
    {
      heading: 'Jakie dane przetwarzamy',
      blocks: [
        {
          list: [
            'Dane konta. Logujesz się przez Apple albo Google. Dostajemy od nich identyfikator konta, adres e-mail (przy Apple może to być ukryty adres przekierowujący) oraz imię, jeśli je udostępnisz. Przy logowaniu przez Apple przechowujemy też token odświeżania od Apple, który służy wyłącznie do odłączenia aplikacji od Twojego Apple ID, gdy usuniesz konto.',
            'Dane sesji. Po zalogowaniu zapisujemy token sesji, jej datę ważności oraz adres IP i nazwę urządzenia (user agent), z których się zalogowałeś.',
            'Zdjęcia roślin. Zdjęcia, które zrobisz albo wybierzesz do rozpoznania, wysyłamy na nasz serwer i przechowujemy, żeby pokazać je w Twojej historii. Przed wysłaniem aplikacja zmniejsza zdjęcie i usuwa z niego metadane, takie jak lokalizacja.',
            'Wyniki rozpoznań. Nazwa gatunku, wskazówki pielęgnacyjne, język odpowiedzi i data rozpoznania.',
          ],
        },
        'Nie zbieramy Twojej lokalizacji, kontaktów ani innych danych z telefonu. Aparat jest używany tylko wtedy, gdy robisz zdjęcie rośliny. Nie wyświetlamy reklam, nie używamy narzędzi analitycznych ani śledzących i nie sprzedajemy danych.',
      ],
    },
    {
      heading: 'Po co i na jakiej podstawie',
      blocks: [
        {
          list: [
            'Prowadzenie konta, rozpoznawanie roślin i przechowywanie historii: to usługa, o którą prosisz (art. 6 ust. 1 lit. b RODO).',
            'Bezpieczeństwo, ochrona przed nadużyciami i dzienne limity rozpoznań: nasz prawnie uzasadniony interes (art. 6 ust. 1 lit. f RODO).',
          ],
        },
      ],
    },
    {
      heading: 'Rozpoznawanie przez sztuczną inteligencję',
      blocks: [
        `Żeby rozpoznać roślinę, wysyłamy zdjęcie do modelu sztucznej inteligencji (${SITE.aiProvider}) przez Cloudflare AI Gateway. Model dostaje tylko zdjęcie i instrukcję, bez Twojego imienia ani adresu e-mail. Wynik może być błędny, więc traktuj go jako wskazówkę.`,
      ],
    },
    {
      heading: 'Komu powierzamy dane',
      blocks: [
        'Korzystamy z dostawców, którzy przetwarzają dane w naszym imieniu i tylko w zakresie potrzebnym do działania aplikacji:',
        {
          list: [
            'Cloudflare, Inc.: serwery API, przechowywanie zdjęć (Cloudflare R2) i pośredniczenie w zapytaniach do modelu AI.',
            'Neon, Inc.: baza danych z kontami, sesjami i historią rozpoznań, na serwerach AWS we Frankfurcie (Niemcy).',
            `Dostawca modelu AI: ${SITE.aiProvider}, wyłącznie do analizy zdjęcia.`,
            'Apple i Google: logowanie. Przy logowaniu obowiązują też ich własne zasady prywatności.',
          ],
        },
        'Część dostawców ma siedzibę w USA. Przekazanie danych poza Europejski Obszar Gospodarczy opiera się na unijno-amerykańskich ramach ochrony danych (Data Privacy Framework) lub standardowych klauzulach umownych.',
      ],
    },
    {
      heading: 'Jak długo przechowujemy dane',
      blocks: [
        'Dane przechowujemy, dopóki masz konto. Gdy usuniesz konto w aplikacji (Ustawienia → Usuń konto), od razu usuwamy Twoje zdjęcia, historię rozpoznań, sesje i dane konta. Konta założone przez Apple dodatkowo odłączamy od Twojego Apple ID. Kopie zapasowe bazy danych są nadpisywane w ciągu 6 godzin, więc po tym czasie dane znikają całkowicie.',
      ],
    },
    {
      heading: 'Twoje prawa',
      blocks: [
        'Masz prawo dostępu do swoich danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, przeniesienia oraz sprzeciwu wobec przetwarzania opartego na naszym prawnie uzasadnionym interesie. Konto i wszystkie dane usuniesz samodzielnie w aplikacji. W pozostałych sprawach napisz do nas.',
        'Możesz też złożyć skargę do Prezesa Urzędu Ochrony Danych Osobowych (uodo.gov.pl).',
      ],
    },
    {
      heading: 'Dzieci',
      blocks: ['PlantCare jest przeznaczony dla osób, które mają co najmniej 16 lat.'],
    },
    {
      heading: 'Zmiany',
      blocks: [
        'Jeśli zmienimy sposób przetwarzania danych, zaktualizujemy tę stronę i datę na górze. O ważnych zmianach poinformujemy w aplikacji.',
      ],
    },
  ],
};

const privacyEn: LegalDoc = {
  title: 'Privacy Policy',
  description: 'What data PlantCare collects, why, where we store it and how to delete it.',
  intro:
    'PlantCare is an app that identifies plants from photos and tells you how to care for them. This policy explains what data we process to do that, why, and what rights you have.',
  sections: [
    {
      heading: 'Who is responsible for your data',
      blocks: [`The data controller is ${SITE.controller}. For privacy questions, email ${SITE.contactEmail}.`],
    },
    {
      heading: 'What data we process',
      blocks: [
        {
          list: [
            'Account data. You sign in with Apple or Google. They give us your account identifier, email address (with Apple this can be a private relay address) and your name if you choose to share it. When you sign in with Apple we also keep a refresh token from Apple, used only to disconnect the app from your Apple ID when you delete your account.',
            'Session data. When you sign in we store a session token, its expiry, and the IP address and device name (user agent) you signed in from.',
            'Plant photos. Photos you take or choose for identification are sent to our server and stored so you can see them in your history. Before uploading, the app downsizes the photo and removes its metadata, such as location.',
            'Identification results. The species name, care tips, the language of the answer and the date.',
          ],
        },
        'We do not collect your location, contacts or other data from your phone. The camera is only used when you photograph a plant. We show no ads, use no analytics or tracking tools, and do not sell data.',
      ],
    },
    {
      heading: 'Why, and on what legal basis',
      blocks: [
        {
          list: [
            'Running your account, identifying plants and keeping your history: the service you ask for (Art. 6(1)(b) GDPR).',
            'Security, abuse prevention and daily identification limits: our legitimate interest (Art. 6(1)(f) GDPR).',
          ],
        },
      ],
    },
    {
      heading: 'Identification by artificial intelligence',
      blocks: [
        `To identify a plant, we send the photo to an AI model (${SITE.aiProvider}) through Cloudflare AI Gateway. The model receives only the photo and an instruction, never your name or email. Results can be wrong, so treat them as guidance.`,
      ],
    },
    {
      heading: 'Who processes data for us',
      blocks: [
        'We use providers that process data on our behalf, only as far as needed to run the app:',
        {
          list: [
            'Cloudflare, Inc.: API servers, photo storage (Cloudflare R2) and routing requests to the AI model.',
            'Neon, Inc.: the database with accounts, sessions and identification history, on AWS servers in Frankfurt, Germany.',
            `AI model provider: ${SITE.aiProvider}, only to analyse the photo.`,
            'Apple and Google: sign-in. Their own privacy policies also apply when you sign in.',
          ],
        },
        'Some providers are based in the US. Transfers outside the European Economic Area rely on the EU–US Data Privacy Framework or standard contractual clauses.',
      ],
    },
    {
      heading: 'How long we keep data',
      blocks: [
        'We keep your data for as long as you have an account. When you delete your account in the app (Settings → Delete Account), we immediately delete your photos, identification history, sessions and account data. For accounts created with Apple, we also disconnect the app from your Apple ID. Database backups are overwritten within 6 hours, after which the data is gone completely.',
      ],
    },
    {
      heading: 'Your rights',
      blocks: [
        'You have the right to access, correct and delete your data, to restrict its processing, to data portability, and to object to processing based on our legitimate interest. You can delete your account and all data yourself in the app. For anything else, email us.',
        'You can also lodge a complaint with your data protection authority (in Poland: the President of the Personal Data Protection Office, uodo.gov.pl).',
      ],
    },
    { heading: 'Children', blocks: ['PlantCare is intended for people aged 16 and over.'] },
    {
      heading: 'Changes',
      blocks: [
        'If we change how we process data, we will update this page and the date at the top. We will announce significant changes in the app.',
      ],
    },
  ],
};

const termsPl: LegalDoc = {
  title: 'Regulamin',
  description: 'Zasady korzystania z aplikacji PlantCare.',
  intro: 'Ten regulamin opisuje zasady korzystania z aplikacji PlantCare. Korzystając z aplikacji, akceptujesz go.',
  sections: [
    {
      heading: 'Usługodawca',
      blocks: [`Aplikację udostępnia ${SITE.controller}. Kontakt: ${SITE.contactEmail}.`],
    },
    {
      heading: 'Co robi PlantCare',
      blocks: [
        'PlantCare rozpoznaje rośliny na zdjęciach przy pomocy sztucznej inteligencji, podaje nazwę gatunku i wskazówki pielęgnacyjne oraz przechowuje historię Twoich rozpoznań.',
      ],
    },
    {
      heading: 'Konto',
      blocks: [
        'Do korzystania z aplikacji potrzebne jest konto, które zakładasz, logując się przez Apple albo Google. Musisz mieć co najmniej 16 lat. Odpowiadasz za działania wykonane z Twojego konta.',
      ],
    },
    {
      heading: 'Wyniki rozpoznań',
      blocks: [
        'Rozpoznania i wskazówki pielęgnacyjne tworzy automatycznie model sztucznej inteligencji. Mogą być błędne lub niepełne, nawet przy wysokim procencie dopasowania, który jest tylko szacunkiem modelu. Traktuj je jako wskazówkę, a nie pewną informację, i w ważnych sprawach sprawdź je w innym źródle.',
        {
          list: [
            'Nie jedz roślin i nie używaj ich jako leków na podstawie wyniku z aplikacji.',
            'Nie oceniaj na podstawie aplikacji, czy roślina jest bezpieczna dla dzieci lub zwierząt.',
            'W razie podejrzenia zatrucia zadzwoń pod numer alarmowy 112.',
          ],
        },
      ],
    },
    {
      heading: 'Zasady korzystania',
      blocks: [
        {
          list: [
            'Przesyłaj tylko zdjęcia roślin, do których masz prawo.',
            'Nie przesyłaj zdjęć osób ani treści niezgodnych z prawem.',
            'Nie próbuj obchodzić limitów, zakłócać działania usługi ani automatycznie wysyłać zapytań.',
          ],
        },
        'Możemy ograniczyć liczbę rozpoznań dziennie i zablokować konto, które łamie te zasady.',
      ],
    },
    {
      heading: 'Twoje zdjęcia',
      blocks: [
        'Zdjęcia pozostają Twoje. Udzielasz nam zgody na ich przechowywanie i przetwarzanie wyłącznie w celu działania aplikacji, w tym analizy przez model AI. Zgoda wygasa, gdy usuniesz konto.',
      ],
    },
    {
      heading: 'Dostępność i odpowiedzialność',
      blocks: [
        'Staramy się, żeby aplikacja działała bez przerw, ale nie gwarantujemy tego. Możemy zmieniać funkcje aplikacji. Nie odpowiadamy za szkody wynikające z polegania na wynikach rozpoznań, w granicach dopuszczonych przez prawo. Nie wyłącza to praw, które przysługują Ci jako konsumentowi.',
      ],
    },
    {
      heading: 'Usunięcie konta',
      blocks: [
        'Możesz w każdej chwili usunąć konto w aplikacji (Ustawienia → Usuń konto). Usuwamy wtedy wszystkie Twoje dane, zgodnie z polityką prywatności.',
      ],
    },
    {
      heading: 'Zmiany i prawo właściwe',
      blocks: [
        'O zmianach regulaminu poinformujemy w aplikacji. Regulamin podlega prawu polskiemu, z zachowaniem praw konsumenta wynikających z prawa kraju, w którym mieszkasz.',
      ],
    },
  ],
};

const termsEn: LegalDoc = {
  title: 'Terms of Use',
  description: 'The rules for using the PlantCare app.',
  intro: 'These terms set out the rules for using the PlantCare app. By using the app, you accept them.',
  sections: [
    { heading: 'Provider', blocks: [`The app is provided by ${SITE.controller}. Contact: ${SITE.contactEmail}.`] },
    {
      heading: 'What PlantCare does',
      blocks: [
        'PlantCare identifies plants in photos using artificial intelligence, gives you the species name and care tips, and keeps a history of your identifications.',
      ],
    },
    {
      heading: 'Your account',
      blocks: [
        'You need an account, which you create by signing in with Apple or Google. You must be at least 16. You are responsible for activity on your account.',
      ],
    },
    {
      heading: 'Identification results',
      blocks: [
        'Identifications and care tips are generated automatically by an artificial intelligence model. They can be wrong or incomplete, even when the match percentage is high, since that number is only the model’s own estimate. Treat them as guidance, not certainty, and check another source when it matters.',
        {
          list: [
            'Do not eat plants or use them as medicine based on a result from the app.',
            'Do not rely on the app to decide whether a plant is safe for children or pets.',
            'If you suspect poisoning, call your local emergency number (112 in the EU).',
          ],
        },
      ],
    },
    {
      heading: 'Acceptable use',
      blocks: [
        {
          list: [
            'Only upload photos of plants that you have the right to use.',
            'Do not upload photos of people or unlawful content.',
            'Do not try to bypass limits, disrupt the service or send automated requests.',
          ],
        },
        'We may limit the number of daily identifications and suspend accounts that break these rules.',
      ],
    },
    {
      heading: 'Your photos',
      blocks: [
        'Your photos remain yours. You allow us to store and process them only to run the app, including analysis by an AI model. This permission ends when you delete your account.',
      ],
    },
    {
      heading: 'Availability and liability',
      blocks: [
        'We aim to keep the app running without interruption but cannot guarantee it. We may change the app’s features. To the extent permitted by law, we are not liable for damage resulting from relying on identification results. This does not affect your statutory consumer rights.',
      ],
    },
    {
      heading: 'Deleting your account',
      blocks: [
        'You can delete your account at any time in the app (Settings → Delete Account). We then delete all your data as described in the Privacy Policy.',
      ],
    },
    {
      heading: 'Changes and governing law',
      blocks: [
        'We will announce changes to these terms in the app. These terms are governed by Polish law, without affecting the consumer protections of the country where you live.',
      ],
    },
  ],
};

const supportPl: LegalDoc = {
  title: 'Pomoc',
  description: 'Odpowiedzi na częste pytania o PlantCare i kontakt.',
  intro: `Masz pytanie albo coś nie działa? Napisz na ${SITE.contactEmail}. Odpowiadamy zwykle w ciągu kilku dni.`,
  sections: [
    {
      heading: 'Jak usunąć konto?',
      blocks: ['W aplikacji otwórz Ustawienia i wybierz Usuń konto. Usuniemy od razu konto, zdjęcia i całą historię.'],
    },
    {
      heading: 'Dlaczego trzeba się zalogować?',
      blocks: ['Logowanie pozwala zapisać historię Twoich roślin i chronić usługę przed nadużyciami.'],
    },
    {
      heading: 'Rozpoznanie jest błędne. Co zrobić?',
      blocks: [
        'Zrób kolejne zdjęcie z bliska, najlepiej samego liścia albo kwiatu, w dobrym świetle. Model czasem się myli, zwłaszcza przy młodych roślinach.',
      ],
    },
    {
      heading: 'W jakich językach działa aplikacja?',
      blocks: ['Po polsku i po angielsku, zgodnie z językiem telefonu.'],
    },
  ],
};

const supportEn: LegalDoc = {
  title: 'Support',
  description: 'Answers to common questions about PlantCare, and how to reach us.',
  intro: `Have a question or something isn't working? Email ${SITE.contactEmail}. We usually reply within a few days.`,
  sections: [
    {
      heading: 'How do I delete my account?',
      blocks: [
        'In the app, open Settings and choose Delete Account. We immediately delete your account, photos and all history.',
      ],
    },
    {
      heading: 'Why do I need to sign in?',
      blocks: ['Signing in lets us keep your plant history and protect the service from abuse.'],
    },
    {
      heading: 'The identification is wrong. What can I do?',
      blocks: [
        'Take another photo up close, ideally of a single leaf or flower in good light. The model sometimes gets it wrong, especially with young plants.',
      ],
    },
    {
      heading: 'Which languages does the app support?',
      blocks: ['Polish and English, following your phone’s language.'],
    },
  ],
};

export const legal = {
  privacy: { pl: privacyPl, en: privacyEn },
  terms: { pl: termsPl, en: termsEn },
  support: { pl: supportPl, en: supportEn },
} satisfies Record<string, Record<Lang, LegalDoc>>;
