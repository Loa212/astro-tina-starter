import type { IslandRegistry } from '@tinacms/astro/experimental';
import PageBody from '../../components/islands/PageBody.astro';
import PostBody from '../../components/islands/PostBody.astro';
import SiteFooter from '../../components/islands/SiteFooter.astro';
import SiteHeader from '../../components/islands/SiteHeader.astro';
import {
  getPage,
  getPost,
  getSettings,
  type PageResult,
  type PostResult,
  type SettingsResult,
} from './data';

/**
 * Regioni modificabili dal visual editor. Ogni voce dice al bridge Tina come
 * ricaricare i dati e ri-renderizzare la regione quando l'editor cambia un campo.
 */
export const islands: IslandRegistry = {
  page: {
    fetch: (_request, params) => getPage(params.get('slug') ?? 'home'),
    component: PageBody,
    wrapper: { tag: 'main', className: 'flex-1' },
    propsFromData: (data) => ({ page: (data as PageResult).data?.page }),
  },
  post: {
    fetch: (_request, params) => getPost(params.get('slug') ?? ''),
    component: PostBody,
    wrapper: { tag: 'main', className: 'flex-1' },
    propsFromData: (data) => ({ post: (data as PostResult).data?.post }),
  },
  header: {
    fetch: () => getSettings(),
    component: SiteHeader,
    wrapper: { tag: 'div', className: 'contents' },
    propsFromData: (data) => ({ settings: (data as SettingsResult).data?.settings }),
  },
  footer: {
    fetch: () => getSettings(),
    component: SiteFooter,
    wrapper: { tag: 'div', className: 'contents' },
    propsFromData: (data) => ({ settings: (data as SettingsResult).data?.settings }),
  },
};
