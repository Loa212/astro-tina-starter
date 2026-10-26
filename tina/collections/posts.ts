import type { Collection } from 'tinacms';

/** "Il mio titolo, è bello!" → "il-mio-titolo-e-bello" */
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
  label: 'Blog',
  path: 'content/posts',
  format: 'md',
  defaultItem: () => ({ date: new Date().toISOString(), draft: false }),
  ui: {
    router: ({ document }) => `/blog/${document._sys.filename}/`,
    // Il nome file (= URL) viene generato dal titolo: l'editor non deve pensarci.
    filename: {
      readonly: true,
      slugify: (values) => slugify((values?.title as string) || 'nuovo-articolo'),
    },
  },
  fields: [
    { type: 'string', name: 'title', label: 'Titolo', isTitle: true, required: true },
    {
      type: 'datetime',
      name: 'date',
      label: 'Data',
      required: true,
      ui: { dateFormat: 'DD/MM/YYYY' },
    },
    {
      type: 'string',
      name: 'description',
      label: 'Sommario (mostrato nell’elenco e nei motori di ricerca)',
      ui: { component: 'textarea' },
    },
    { type: 'image', name: 'image', label: 'Immagine di copertina' },
    { type: 'string', name: 'tags', label: 'Tag', list: true },
    { type: 'boolean', name: 'draft', label: 'Bozza (non visibile sul sito)' },
    { type: 'rich-text', name: 'body', label: 'Testo', isBody: true },
  ],
};
