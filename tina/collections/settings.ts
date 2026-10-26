import type { Collection } from 'tinacms';

export const settings: Collection = {
  name: 'settings',
  label: 'Impostazioni sito',
  path: 'content/settings',
  format: 'json',
  ui: {
    global: true,
    allowedActions: { create: false, delete: false },
  },
  fields: [
    { type: 'string', name: 'siteName', label: 'Nome del sito', required: true },
    { type: 'string', name: 'tagline', label: 'Sottotitolo (comitato)' },
    { type: 'image', name: 'logo', label: 'Logo' },
    {
      type: 'object',
      name: 'nav',
      label: 'Menu di navigazione',
      list: true,
      ui: { itemProps: (item) => ({ label: item?.label || 'Voce di menu' }) },
      fields: [
        { type: 'string', name: 'label', label: 'Testo', required: true },
        { type: 'string', name: 'href', label: 'Link (es. /contatti/)', required: true },
      ],
    },
    {
      type: 'object',
      name: 'social',
      label: 'Social',
      fields: [
        { type: 'string', name: 'instagram', label: 'Instagram (URL)' },
        { type: 'string', name: 'facebook', label: 'Facebook (URL)' },
      ],
    },
    {
      type: 'object',
      name: 'contacts',
      label: 'Contatti',
      fields: [
        {
          type: 'string',
          name: 'whatsapp',
          label: 'WhatsApp (numero con prefisso, es. +393518220443)',
        },
        { type: 'string', name: 'email', label: 'Email' },
      ],
    },
    {
      type: 'string',
      name: 'footerText',
      label: 'Testo a piè di pagina',
      ui: { component: 'textarea' },
    },
  ],
};
