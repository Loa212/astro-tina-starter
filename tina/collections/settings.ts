import type { Collection } from 'tinacms';

export const settings: Collection = {
  name: 'settings',
  label: 'Site settings',
  // Un file per lingua: content/settings/en.json, content/settings/it.json.
  path: 'content/settings',
  format: 'json',
  ui: {
    global: true,
    allowedActions: { create: false, delete: false },
  },
  fields: [
    { type: 'string', name: 'siteName', label: 'Site name', required: true },
    { type: 'string', name: 'tagline', label: 'Tagline' },
    { type: 'image', name: 'logo', label: 'Logo' },
    {
      type: 'object',
      name: 'nav',
      label: 'Navigation menu',
      list: true,
      ui: { itemProps: (item) => ({ label: item?.label || 'Menu item' }) },
      fields: [
        { type: 'string', name: 'label', label: 'Text', required: true },
        {
          type: 'string',
          name: 'href',
          label: 'Link (e.g. /contact/ or /it/contact/)',
          required: true,
        },
      ],
    },
    {
      type: 'object',
      name: 'cta',
      label: 'Header button',
      fields: [
        { type: 'string', name: 'label', label: 'Text' },
        { type: 'string', name: 'href', label: 'Link' },
      ],
    },
    {
      type: 'object',
      name: 'social',
      label: 'Social',
      fields: [
        { type: 'string', name: 'instagram', label: 'Instagram (URL)' },
        { type: 'string', name: 'facebook', label: 'Facebook (URL)' },
        { type: 'string', name: 'linkedin', label: 'LinkedIn (URL)' },
      ],
    },
    {
      type: 'object',
      name: 'contacts',
      label: 'Contacts',
      fields: [
        { type: 'string', name: 'email', label: 'Email' },
        { type: 'string', name: 'phone', label: 'Phone (as shown, e.g. +39 02 1234 5678)' },
        {
          type: 'string',
          name: 'whatsapp',
          label: 'WhatsApp (number with country code, e.g. +393518220443)',
        },
        { type: 'string', name: 'address', label: 'Address', ui: { component: 'textarea' } },
      ],
    },
    {
      type: 'string',
      name: 'footerText',
      label: 'Footer text',
      ui: { component: 'textarea' },
    },
  ],
};
