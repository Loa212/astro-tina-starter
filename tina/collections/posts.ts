import type { Collection } from 'tinacms';
import { localeOfPath, localizePath } from '../../src/lib/i18n';

/** "My title, is nice!" → "my-title-is-nice" */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export const posts: Collection = {
  name: 'post',
  label: 'Journal',
  // Una cartella per lingua: content/posts/en/…, content/posts/it/… (stesso nome = traduzione).
  path: 'content/posts',
  format: 'md',
  defaultItem: () => ({ date: new Date().toISOString(), draft: false }),
  ui: {
    router: ({ document }) =>
      localizePath(`/blog/${document._sys.filename}/`, localeOfPath(document._sys.relativePath)),
    // Il nome file (= URL) viene generato dal titolo: l'editor non deve pensarci.
    filename: {
      readonly: true,
      slugify: (values) => slugify((values?.title as string) || 'new-article'),
    },
  },
  fields: [
    { type: 'string', name: 'title', label: 'Title', isTitle: true, required: true },
    {
      type: 'datetime',
      name: 'date',
      label: 'Date',
      required: true,
      ui: { dateFormat: 'DD/MM/YYYY' },
    },
    {
      type: 'string',
      name: 'description',
      label: 'Summary (shown in the list and in search engines)',
      ui: { component: 'textarea' },
    },
    { type: 'image', name: 'image', label: 'Cover image' },
    { type: 'string', name: 'tags', label: 'Tags', list: true },
    { type: 'boolean', name: 'draft', label: 'Draft (hidden from the site)' },
    { type: 'rich-text', name: 'body', label: 'Text', isBody: true },
  ],
};
