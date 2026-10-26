import { requestWithMetadata } from '@tinacms/astro';
import databaseClient from '../../../tina/__generated__/databaseClient';

/** Pagina della collection `page` (content/pages/<slug>.md). */
export const getPage = (slug: string) =>
  requestWithMetadata(databaseClient.queries.page({ relativePath: `${slug}.md` }));

/** Impostazioni globali (content/settings/site.json). */
export const getSettings = () =>
  requestWithMetadata(databaseClient.queries.settings({ relativePath: 'site.json' }));

/** Articolo del blog (content/posts/<slug>.md). */
export const getPost = (slug: string) =>
  requestWithMetadata(databaseClient.queries.post({ relativePath: `${slug}.md` }));

export type PageResult = Awaited<ReturnType<typeof getPage>>;
export type SettingsResult = Awaited<ReturnType<typeof getSettings>>;
export type PostResult = Awaited<ReturnType<typeof getPost>>;
export type PageData = NonNullable<PageResult['data']['page']>;
export type SettingsData = NonNullable<SettingsResult['data']['settings']>;
export type PostData = NonNullable<PostResult['data']['post']>;

export type PostSummary = {
  slug: string;
  title: string;
  date: string;
  description: string | null;
  image: string | null;
  tags: string[];
};

/** Articoli pubblicati (bozze escluse), dal più recente. `limit` opzionale. */
export async function listPosts(limit?: number): Promise<PostSummary[]> {
  const result = await databaseClient.queries.postConnection({ first: 500 });
  const posts = (result.data.postConnection.edges ?? [])
    .map((edge) => edge?.node)
    .filter((node): node is NonNullable<typeof node> => Boolean(node) && !node?.draft)
    .map((node) => ({
      slug: node._sys.filename,
      title: node.title,
      date: node.date,
      description: node.description ?? null,
      image: node.image ?? null,
      tags: (node.tags ?? []).filter((t): t is string => Boolean(t)),
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
  return limit ? posts.slice(0, limit) : posts;
}

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
