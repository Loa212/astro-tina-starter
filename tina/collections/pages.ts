import type { Collection, Template, TinaField } from 'tinacms';
import { localeOfPath, localizePath } from '../../src/lib/i18n';

const buttons: TinaField = {
  type: 'object',
  name: 'buttons',
  label: 'Buttons',
  list: true,
  ui: { itemProps: (item) => ({ label: item?.label || 'Button' }) },
  fields: [
    { type: 'string', name: 'label', label: 'Text', required: true },
    {
      type: 'string',
      name: 'href',
      label: 'Link (e.g. /contact/ or /it/contact/)',
      required: true,
    },
    {
      type: 'string',
      name: 'variant',
      label: 'Style',
      options: [
        { value: 'primary', label: 'Solid (main action)' },
        { value: 'outline', label: 'Outline' },
      ],
    },
  ],
};

const eyebrow: TinaField = { type: 'string', name: 'eyebrow', label: 'Small line above the title' };
const intro: TinaField = {
  type: 'string',
  name: 'intro',
  label: 'Intro text',
  ui: { component: 'textarea' },
};

const hero: Template = {
  name: 'hero',
  label: 'Hero',
  ui: { itemProps: (item) => ({ label: `Hero: ${item?.heading ?? ''}` }) },
  fields: [
    eyebrow,
    { type: 'string', name: 'heading', label: 'Title' },
    { type: 'rich-text', name: 'body', label: 'Text' },
    { type: 'image', name: 'image', label: 'Image (shown beside the text)' },
    { type: 'string', name: 'imageAlt', label: 'Image description (accessibility)' },
    buttons,
    { type: 'string', name: 'note', label: 'Small print under the buttons (e.g. a reassurance)' },
  ],
};

const feature: Template = {
  name: 'feature',
  label: 'Image and text',
  ui: { itemProps: (item) => ({ label: `Image and text: ${item?.heading ?? ''}` }) },
  fields: [
    eyebrow,
    { type: 'string', name: 'heading', label: 'Title' },
    { type: 'rich-text', name: 'body', label: 'Text (lists become a checklist)' },
    { type: 'image', name: 'image', label: 'Image' },
    { type: 'string', name: 'imageAlt', label: 'Image description (accessibility)' },
    {
      type: 'string',
      name: 'imagePosition',
      label: 'Image position',
      options: [
        { value: 'left', label: 'Left' },
        { value: 'right', label: 'Right' },
      ],
    },
    buttons,
  ],
};

const stats: Template = {
  name: 'stats',
  label: 'Key figures',
  ui: { itemProps: () => ({ label: 'Key figures' }) },
  fields: [
    {
      type: 'object',
      name: 'items',
      label: 'Figures',
      list: true,
      ui: {
        itemProps: (item) => ({
          label: `${item?.value ?? ''} ${item?.label ?? ''}`.trim() || 'Figure',
        }),
      },
      fields: [
        { type: 'string', name: 'value', label: 'Figure (e.g. 120+)', required: true },
        { type: 'string', name: 'label', label: 'What it counts', required: true },
      ],
    },
  ],
};

const testimonials: Template = {
  name: 'testimonials',
  label: 'Testimonials',
  ui: { itemProps: (item) => ({ label: `Testimonials: ${item?.heading ?? ''}` }) },
  fields: [
    eyebrow,
    { type: 'string', name: 'heading', label: 'Title' },
    intro,
    {
      type: 'object',
      name: 'items',
      label: 'Testimonials',
      list: true,
      ui: { itemProps: (item) => ({ label: item?.author || 'Testimonial' }) },
      fields: [
        {
          type: 'string',
          name: 'quote',
          label: 'Quote',
          required: true,
          ui: { component: 'textarea' },
        },
        { type: 'string', name: 'author', label: 'Name', required: true },
        { type: 'string', name: 'role', label: 'Project or role' },
        { type: 'image', name: 'image', label: 'Project photo' },
      ],
    },
  ],
};

const richText: Template = {
  name: 'richText',
  label: 'Text',
  ui: { itemProps: (item) => ({ label: `Text: ${item?.heading ?? ''}` }) },
  fields: [
    eyebrow,
    { type: 'string', name: 'heading', label: 'Title' },
    { type: 'rich-text', name: 'body', label: 'Content' },
  ],
};

const steps: Template = {
  name: 'steps',
  label: 'Numbered steps',
  ui: { itemProps: (item) => ({ label: `Steps: ${item?.heading ?? ''}` }) },
  fields: [
    eyebrow,
    { type: 'string', name: 'heading', label: 'Title' },
    intro,
    {
      type: 'object',
      name: 'items',
      label: 'Steps',
      list: true,
      ui: { itemProps: (item) => ({ label: item?.title || 'Step' }) },
      fields: [
        { type: 'string', name: 'title', label: 'Title', required: true },
        { type: 'string', name: 'text', label: 'Text', ui: { component: 'textarea' } },
      ],
    },
  ],
};

const cards: Template = {
  name: 'cards',
  label: 'Columns',
  ui: { itemProps: (item) => ({ label: `Columns: ${item?.heading ?? ''}` }) },
  fields: [
    eyebrow,
    { type: 'string', name: 'heading', label: 'Title' },
    intro,
    {
      type: 'object',
      name: 'items',
      label: 'Columns',
      list: true,
      ui: { itemProps: (item) => ({ label: item?.title || 'Column' }) },
      fields: [
        { type: 'string', name: 'title', label: 'Title', required: true },
        { type: 'string', name: 'text', label: 'Text', ui: { component: 'textarea' } },
        { type: 'image', name: 'image', label: 'Image (optional)' },
      ],
    },
    buttons,
  ],
};

const faq: Template = {
  name: 'faq',
  label: 'Questions and answers',
  ui: { itemProps: (item) => ({ label: `FAQ: ${item?.heading ?? ''}` }) },
  fields: [
    eyebrow,
    { type: 'string', name: 'heading', label: 'Title' },
    intro,
    {
      type: 'object',
      name: 'items',
      label: 'Questions',
      list: true,
      ui: { itemProps: (item) => ({ label: item?.question || 'Question' }) },
      fields: [
        { type: 'string', name: 'question', label: 'Question', required: true },
        { type: 'rich-text', name: 'answer', label: 'Answer' },
      ],
    },
  ],
};

const cta: Template = {
  name: 'cta',
  label: 'Call to action',
  ui: { itemProps: (item) => ({ label: `CTA: ${item?.heading ?? ''}` }) },
  fields: [
    { type: 'string', name: 'heading', label: 'Title' },
    { type: 'string', name: 'text', label: 'Text', ui: { component: 'textarea' } },
    buttons,
  ],
};

const contactList: Template = {
  name: 'contactList',
  label: 'Contact details',
  ui: { itemProps: (item) => ({ label: `Contacts: ${item?.heading ?? ''}` }) },
  fields: [
    { type: 'string', name: 'heading', label: 'Title' },
    intro,
    {
      type: 'object',
      name: 'items',
      label: 'Contacts',
      list: true,
      ui: { itemProps: (item) => ({ label: item?.label || item?.kind || 'Contact' }) },
      fields: [
        {
          type: 'string',
          name: 'kind',
          label: 'Type',
          required: true,
          options: [
            { value: 'email', label: 'Email' },
            { value: 'phone', label: 'Phone' },
            { value: 'whatsapp', label: 'WhatsApp' },
            { value: 'instagram', label: 'Instagram' },
            { value: 'facebook', label: 'Facebook' },
            { value: 'linkedin', label: 'LinkedIn' },
            { value: 'link', label: 'Other link' },
          ],
        },
        { type: 'string', name: 'label', label: 'Text shown', required: true },
        { type: 'string', name: 'href', label: 'Link (https://…, mailto:, tel:)', required: true },
      ],
    },
    { type: 'image', name: 'image', label: 'Image beside the list' },
    { type: 'string', name: 'imageAlt', label: 'Image description (accessibility)' },
  ],
};

const image: Template = {
  name: 'image',
  label: 'Wide image',
  ui: { itemProps: (item) => ({ label: `Image: ${item?.alt ?? ''}` }) },
  fields: [
    { type: 'image', name: 'image', label: 'Image' },
    { type: 'string', name: 'alt', label: 'Description (accessibility)' },
  ],
};

const contactForm: Template = {
  name: 'contactForm',
  label: 'Contact form',
  ui: { itemProps: (item) => ({ label: `Contact form: ${item?.heading ?? ''}` }) },
  fields: [{ type: 'string', name: 'heading', label: 'Title' }, intro],
};

const latestPosts: Template = {
  name: 'latestPosts',
  label: 'Latest articles',
  ui: { itemProps: (item) => ({ label: `Latest articles: ${item?.heading ?? ''}` }) },
  fields: [
    eyebrow,
    { type: 'string', name: 'heading', label: 'Title' },
    intro,
    { type: 'number', name: 'count', label: 'How many articles (default 3)' },
  ],
};

export const pages: Collection = {
  name: 'page',
  label: 'Pages',
  // Una cartella per lingua: content/pages/en/about.md, content/pages/it/about.md (stesso nome = traduzione).
  path: 'content/pages',
  format: 'md',
  ui: {
    router: ({ document }) => {
      const locale = localeOfPath(document._sys.relativePath);
      const slug = document._sys.filename;
      return localizePath(slug === 'home' ? '/' : `/${slug}/`, locale);
    },
  },
  fields: [
    { type: 'string', name: 'title', label: 'Page title (SEO)', isTitle: true, required: true },
    {
      type: 'string',
      name: 'seoDescription',
      label: 'Description (SEO, max 160 characters)',
      ui: { component: 'textarea' },
    },
    {
      type: 'object',
      name: 'blocks',
      label: 'Sections',
      list: true,
      templates: [
        hero,
        stats,
        feature,
        testimonials,
        cards,
        steps,
        faq,
        richText,
        image,
        latestPosts,
        cta,
        contactList,
        contactForm,
      ],
    },
  ],
};
