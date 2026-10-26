import type { Collection, Template, TinaField } from 'tinacms';

const buttons: TinaField = {
  type: 'object',
  name: 'buttons',
  label: 'Pulsanti',
  list: true,
  ui: { itemProps: (item) => ({ label: item?.label || 'Pulsante' }) },
  fields: [
    { type: 'string', name: 'label', label: 'Testo', required: true },
    { type: 'string', name: 'href', label: 'Link', required: true },
    {
      type: 'string',
      name: 'variant',
      label: 'Stile',
      options: [
        { value: 'primary', label: 'Giallo (principale)' },
        { value: 'outline', label: 'Solo contorno' },
      ],
    },
  ],
};

const hero: Template = {
  name: 'hero',
  label: 'Intestazione (hero)',
  ui: { itemProps: (item) => ({ label: `Hero: ${item?.heading ?? ''}` }) },
  fields: [
    { type: 'string', name: 'eyebrow', label: 'Riga sopra il titolo' },
    { type: 'string', name: 'heading', label: 'Titolo' },
    { type: 'rich-text', name: 'body', label: 'Testo' },
    { type: 'image', name: 'image', label: 'Immagine / logo' },
    buttons,
  ],
};

const richText: Template = {
  name: 'richText',
  label: 'Testo',
  ui: { itemProps: (item) => ({ label: `Testo: ${item?.heading ?? ''}` }) },
  fields: [
    { type: 'string', name: 'heading', label: 'Titolo' },
    { type: 'rich-text', name: 'body', label: 'Contenuto' },
  ],
};

const steps: Template = {
  name: 'steps',
  label: 'Passaggi numerati',
  ui: { itemProps: (item) => ({ label: `Passaggi: ${item?.heading ?? ''}` }) },
  fields: [
    { type: 'string', name: 'heading', label: 'Titolo' },
    {
      type: 'object',
      name: 'items',
      label: 'Passaggi',
      list: true,
      ui: { itemProps: (item) => ({ label: item?.title || 'Passaggio' }) },
      fields: [
        { type: 'string', name: 'title', label: 'Titolo', required: true },
        { type: 'string', name: 'text', label: 'Testo', ui: { component: 'textarea' } },
      ],
    },
  ],
};

const cards: Template = {
  name: 'cards',
  label: 'Schede',
  ui: { itemProps: (item) => ({ label: `Schede: ${item?.heading ?? ''}` }) },
  fields: [
    { type: 'string', name: 'heading', label: 'Titolo' },
    { type: 'string', name: 'intro', label: 'Sottotitolo' },
    {
      type: 'object',
      name: 'items',
      label: 'Schede',
      list: true,
      ui: { itemProps: (item) => ({ label: item?.title || 'Scheda' }) },
      fields: [
        { type: 'string', name: 'title', label: 'Titolo', required: true },
        { type: 'string', name: 'text', label: 'Testo', ui: { component: 'textarea' } },
      ],
    },
  ],
};

const cta: Template = {
  name: 'cta',
  label: 'Invito all’azione',
  ui: { itemProps: (item) => ({ label: `CTA: ${item?.heading ?? ''}` }) },
  fields: [
    { type: 'string', name: 'heading', label: 'Titolo' },
    { type: 'string', name: 'text', label: 'Testo', ui: { component: 'textarea' } },
    buttons,
  ],
};

const contactList: Template = {
  name: 'contactList',
  label: 'Elenco contatti',
  ui: { itemProps: (item) => ({ label: `Contatti: ${item?.heading ?? ''}` }) },
  fields: [
    { type: 'string', name: 'heading', label: 'Titolo' },
    { type: 'string', name: 'intro', label: 'Testo introduttivo', ui: { component: 'textarea' } },
    {
      type: 'object',
      name: 'items',
      label: 'Contatti',
      list: true,
      ui: { itemProps: (item) => ({ label: item?.label || item?.kind || 'Contatto' }) },
      fields: [
        {
          type: 'string',
          name: 'kind',
          label: 'Tipo',
          required: true,
          options: [
            { value: 'whatsapp', label: 'WhatsApp' },
            { value: 'email', label: 'Email' },
            { value: 'facebook', label: 'Facebook' },
            { value: 'instagram', label: 'Instagram' },
            { value: 'phone', label: 'Telefono' },
            { value: 'link', label: 'Altro link' },
          ],
        },
        { type: 'string', name: 'label', label: 'Testo mostrato', required: true },
        { type: 'string', name: 'href', label: 'Link (https://…, mailto:, tel:)', required: true },
      ],
    },
    { type: 'image', name: 'image', label: 'Immagine a lato' },
    { type: 'string', name: 'imageAlt', label: 'Descrizione immagine' },
  ],
};

const image: Template = {
  name: 'image',
  label: 'Immagine',
  ui: { itemProps: (item) => ({ label: `Immagine: ${item?.alt ?? ''}` }) },
  fields: [
    { type: 'image', name: 'image', label: 'Immagine' },
    { type: 'string', name: 'alt', label: 'Descrizione (accessibilità)' },
  ],
};

const contactForm: Template = {
  name: 'contactForm',
  label: 'Modulo contatti',
  ui: { itemProps: (item) => ({ label: `Modulo contatti: ${item?.heading ?? ''}` }) },
  fields: [
    { type: 'string', name: 'heading', label: 'Titolo' },
    { type: 'string', name: 'intro', label: 'Testo introduttivo', ui: { component: 'textarea' } },
  ],
};

const latestPosts: Template = {
  name: 'latestPosts',
  label: 'Ultimi articoli del blog',
  ui: { itemProps: (item) => ({ label: `Ultimi articoli: ${item?.heading ?? ''}` }) },
  fields: [
    { type: 'string', name: 'heading', label: 'Titolo' },
    { type: 'string', name: 'intro', label: 'Testo introduttivo' },
    { type: 'number', name: 'count', label: 'Quanti articoli mostrare (default 3)' },
  ],
};

export const pages: Collection = {
  name: 'page',
  label: 'Pagine',
  path: 'content/pages',
  format: 'md',
  ui: {
    router: ({ document }) =>
      document._sys.filename === 'home' ? '/' : `/${document._sys.filename}/`,
  },
  fields: [
    { type: 'string', name: 'title', label: 'Titolo pagina (SEO)', isTitle: true, required: true },
    {
      type: 'string',
      name: 'seoDescription',
      label: 'Descrizione (SEO, max 160 caratteri)',
      ui: { component: 'textarea' },
    },
    {
      type: 'object',
      name: 'blocks',
      label: 'Sezioni',
      list: true,
      templates: [hero, richText, steps, cards, cta, contactList, image, contactForm, latestPosts],
    },
  ],
};
