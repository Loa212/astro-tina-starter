import { requestWithMetadata } from '@tinacms/astro';
import databaseClient from '../../../tina/__generated__/databaseClient';
import { type Alternates, type Locale, localeOfPath, locales, localizePath } from '../i18n';

/** Pagina della collection `page` (content/pages/<lingua>/<slug>.md). */
export const getPage = (locale: Locale, slug: string) =>
  requestWithMetadata(databaseClient.queries.page({ relativePath: `${locale}/${slug}.md` }));

/** Impostazioni del sito per lingua (content/settings/<lingua>.json). */
export const getSettings = (locale: Locale) =>
  requestWithMetadata(databaseClient.queries.settings({ relativePath: `${locale}.json` }));

/** Articolo del blog (content/posts/<lingua>/<slug>.md). */
export const getPost = (locale: Locale, slug: string) =>
  requestWithMetadata(databaseClient.queries.post({ relativePath: `${locale}/${slug}.md` }));

export type PageResult = Awaited<ReturnType<typeof getPage>>;
export type SettingsResult = Awaited<ReturnType<typeof getSettings>>;
export type PostResult = Awaited<ReturnType<typeof getPost>>;
export type PageData = NonNullable<PageResult['data']['page']>;
export type SettingsData = NonNullable<SettingsResult['data']['settings']>;
export type PostData = NonNullable<PostResult['data']['post']>;

/**
 * Traduzioni di una pagina o di un articolo: una traduzione è un file con lo stesso nome nella
 * cartella di un'altra lingua. Query dirette (senza `requestWithMetadata`), così l'editor non le
 * tratta come documenti della pagina.
 */
export async function getAlternates(kind: 'page' | 'post', slug: string): Promise<Alternates> {
  const found = await Promise.all(
    locales.map(async (locale) => {
      const relativePath = `${locale}/${slug}.md`;
      try {
        if (kind === 'page') {
          await databaseClient.queries.page({ relativePath });
          return [locale, localizePath(slug === 'home' ? '/' : `/${slug}/`, locale)] as const;
        }
        const { data } = await databaseClient.queries.post({ relativePath });
        return data.post.draft ? null : ([locale, localizePath(`/blog/${slug}/`, locale)] as const);
      } catch {
        return null;
      }
    }),
  );
  return Object.fromEntries(found.filter((entry) => entry !== null));
}

export type PostSummary = {
  slug: string;
  href: string;
  title: string;
  date: string;
  description: string | null;
  image: string | null;
  tags: string[];
};

/** Articoli pubblicati in una lingua (bozze escluse), dal più recente. `limit` opzionale. */
export async function listPosts(locale: Locale, limit?: number): Promise<PostSummary[]> {
  const result = await databaseClient.queries.postConnection({ first: 500 });
  const posts = (result.data.postConnection.edges ?? [])
    .map((edge) => edge?.node)
    .filter((node): node is NonNullable<typeof node> => Boolean(node) && !node?.draft)
    .filter((node) => localeOfPath(node._sys.relativePath) === locale)
    .map((node) => ({
      slug: node._sys.filename,
      href: localizePath(`/blog/${node._sys.filename}/`, locale),
      title: node.title,
      date: node.date,
      description: node.description ?? null,
      image: node.image ?? null,
      tags: (node.tags ?? []).filter((t): t is string => Boolean(t)),
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
  return limit ? posts.slice(0, limit) : posts;
}
