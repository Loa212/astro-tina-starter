/**
 * Lingue del sito. La prima è quella predefinita: URL senza prefisso (/about/), le altre con il
 * prefisso della lingua (/it/about/). I contenuti stanno in una cartella per lingua
 * (content/pages/<lingua>/, content/posts/<lingua>/, content/settings/<lingua>.json).
 * Per aggiungere una lingua: un codice qui, i testi in `ui` e le cartelle dei contenuti.
 */
export const locales = ['en', 'it'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = locales[0];

export const localeMeta: Record<
  Locale,
  { label: string; htmlLang: string; og: string; date: string }
> = {
  en: { label: 'English', htmlLang: 'en', og: 'en_GB', date: 'en-GB' },
  it: { label: 'Italiano', htmlLang: 'it', og: 'it_IT', date: 'it-IT' },
};

export const isLocale = (value: unknown): value is Locale =>
  typeof value === 'string' && (locales as readonly string[]).includes(value);

/** Lingua di un documento Tina dalla sua cartella: "it/home.md" → "it". */
export function localeOfPath(relativePath: string): Locale {
  const first = relativePath.split('/')[0];
  return isLocale(first) ? first : defaultLocale;
}

/** "/about/" in "it" → "/it/about/"; la lingua predefinita resta senza prefisso. */
export function localizePath(path: string, locale: Locale): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return locale === defaultLocale ? clean : `/${locale}${clean}`;
}

/** Parametro di rotta `[...lang]`: assente → lingua predefinita, "it" → "it", altro → null (404). */
export function localeFromParam(param: string | undefined): Locale | null {
  if (!param) return defaultLocale;
  return isLocale(param) && param !== defaultLocale ? param : null;
}

/** Lingua dal percorso di una richiesta ("/it/blog/" → "it"). */
export function localeFromPathname(pathname: string): Locale {
  const first = pathname.split('/').filter(Boolean)[0];
  return isLocale(first) ? first : defaultLocale;
}

/** URL della stessa pagina nelle altre lingue (solo quelle in cui esiste). */
export type Alternates = Partial<Record<Locale, string>>;

/** Testi fissi dell'interfaccia (quelli dei contenuti si modificano dal CMS). */
const ui = {
  en: {
    skipToContent: 'Skip to content',
    navMain: 'Main',
    menuOpen: 'Open menu',
    menuClose: 'Close menu',
    language: 'Language',
    home: 'Home',
    explore: 'Explore',
    contact: 'Contact',
    privacy: 'Privacy & cookies',
    editorLogin: 'Editor login',
    blogTitle: 'Journal',
    blogIntro: 'Notes on projects, materials and the way we work.',
    blogEmpty: 'Nothing published yet.',
    allPosts: 'All articles',
    backToBlog: 'Journal',
    draft: 'Draft',
    notFoundEyebrow: 'Error 404',
    notFoundTitle: 'Page not found',
    notFoundText: 'The page you are looking for does not exist or has moved.',
    backHome: 'Back to home',
    contactUs: 'Contact us',
    thanksTitle: 'Message sent',
    thanksText: 'Thank you. We will get back to you within two working days.',
    contactKinds: {
      email: 'Email',
      whatsapp: 'WhatsApp',
      phone: 'Phone',
      instagram: 'Instagram',
      facebook: 'Facebook',
      linkedin: 'LinkedIn',
      link: 'Link',
    } as Record<string, string>,
    form: {
      defaultHeading: 'Write to us',
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      message: 'Message',
      consentBefore: 'I have read the ',
      consentLink: 'privacy notice',
      consentAfter: ' and agree to my data being used to answer this request.',
      required:
        'Fields marked * are required. Your message is sent by email and is not stored on the site.',
      submit: 'Send message',
      sending: 'Sending…',
      errorFields: 'Some fields are not valid: check what you entered and send again.',
      errorSend: 'We could not send your message. Please try again shortly.',
      errorNetwork: 'No connection or server error: please try again shortly.',
      checkFields: 'Check the highlighted fields',
      invalidRequest: 'Invalid request',
      fieldRequired: (label: string) => `${label}: required field`,
      invalidEmail: 'Invalid email address',
      messageTooShort: 'Message: write at least 10 characters',
      consentRequired: 'You need to accept the privacy notice',
    },
  },
  it: {
    skipToContent: 'Vai al contenuto',
    navMain: 'Principale',
    menuOpen: 'Apri il menu',
    menuClose: 'Chiudi il menu',
    language: 'Lingua',
    home: 'Home',
    explore: 'Esplora',
    contact: 'Contatti',
    privacy: 'Privacy e cookie',
    editorLogin: 'Area riservata',
    blogTitle: 'Journal',
    blogIntro: 'Appunti su progetti, materiali e sul nostro modo di lavorare.',
    blogEmpty: 'Nessun articolo pubblicato, per ora.',
    allPosts: 'Tutti gli articoli',
    backToBlog: 'Journal',
    draft: 'Bozza',
    notFoundEyebrow: 'Errore 404',
    notFoundTitle: 'Pagina non trovata',
    notFoundText: 'La pagina che cerchi non esiste o è stata spostata.',
    backHome: 'Torna alla home',
    contactUs: 'Contattaci',
    thanksTitle: 'Messaggio inviato',
    thanksText: 'Grazie. Ti risponderemo entro due giorni lavorativi.',
    contactKinds: {
      email: 'Email',
      whatsapp: 'WhatsApp',
      phone: 'Telefono',
      instagram: 'Instagram',
      facebook: 'Facebook',
      linkedin: 'LinkedIn',
      link: 'Link',
    } as Record<string, string>,
    form: {
      defaultHeading: 'Scrivici',
      name: 'Nome',
      email: 'Email',
      phone: 'Telefono',
      message: 'Messaggio',
      consentBefore: 'Ho letto ',
      consentLink: 'l’informativa sulla privacy',
      consentAfter: ' e acconsento al trattamento dei dati per rispondere alla mia richiesta.',
      required:
        'I campi con * sono obbligatori. Il messaggio viene inviato via email e non viene conservato sul sito.',
      submit: 'Invia messaggio',
      sending: 'Invio in corso…',
      errorFields: 'Alcuni campi non sono validi: controlla i dati inseriti e invia di nuovo.',
      errorSend: 'Non siamo riusciti a inviare il messaggio. Riprova tra poco.',
      errorNetwork: 'Connessione assente o errore del server: riprova tra poco.',
      checkFields: 'Controlla i campi evidenziati',
      invalidRequest: 'Richiesta non valida',
      fieldRequired: (label: string) => `${label}: campo obbligatorio`,
      invalidEmail: 'Indirizzo email non valido',
      messageTooShort: 'Messaggio: scrivi almeno 10 caratteri',
      consentRequired: 'Devi accettare il trattamento dei dati',
    },
  },
} satisfies Record<Locale, unknown>;

export type UiStrings = (typeof ui)[Locale];
export const t = (locale: Locale): UiStrings => ui[locale];

export const formatDate = (iso: string, locale: Locale) =>
  new Date(iso).toLocaleDateString(localeMeta[locale].date, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
