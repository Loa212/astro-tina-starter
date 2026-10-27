import type { IslandRegistry } from '@tinacms/astro/experimental';
import PageBody from '../../components/islands/PageBody.astro';
import PostBody from '../../components/islands/PostBody.astro';
import SiteFooter from '../../components/islands/SiteFooter.astro';
import SiteHeader from '../../components/islands/SiteHeader.astro';
import { type Alternates, defaultLocale, isLocale, type Locale, locales } from '../i18n';
import {
  getPage,
  getPost,
  getSettings,
  type PageResult,
  type PostResult,
  type SettingsResult,
} from './data';

const localeParam = (params: URLSearchParams): Locale => {
  const value = params.get('locale');
  return isLocale(value) ? value : defaultLocale;
};

/**
 * Parametri dell'isola header/footer: lingua, percorso corrente e traduzioni della pagina
 * (`alt-<lingua>`), perché quando l'editor ri-renderizza l'isola non c'è la richiesta originale.
 */
export function chromeParams(locale: Locale, path: string, alternates: Alternates) {
  const params: Record<string, string> = { locale, path };
  for (const [l, href] of Object.entries(alternates)) params[`alt-${l}`] = href;
  return params;
}

function chromeProps(data: unknown, params: URLSearchParams) {
  const alternates: Alternates = {};
  for (const l of locales) {
    const href = params.get(`alt-${l}`);
    if (href) alternates[l] = href;
  }
  return {
    settings: (data as SettingsResult).data?.settings,
    locale: localeParam(params),
    path: params.get('path') ?? '/',
    alternates,
  };
}

/**
 * Regioni modificabili dal visual editor. Ogni voce dice al bridge Tina come
 * ricaricare i dati e ri-renderizzare la regione quando l'editor cambia un campo.
 */
export const islands: IslandRegistry = {
  page: {
    fetch: (_request, params) => getPage(localeParam(params), params.get('slug') ?? 'home'),
    component: PageBody,
    wrapper: { tag: 'main', className: 'flex-1' },
    propsFromData: (data) => ({ page: (data as PageResult).data?.page }),
  },
  post: {
    fetch: (_request, params) => getPost(localeParam(params), params.get('slug') ?? ''),
    component: PostBody,
    wrapper: { tag: 'main', className: 'flex-1' },
    propsFromData: (data) => ({ post: (data as PostResult).data?.post }),
  },
  header: {
    fetch: (_request, params) => getSettings(localeParam(params)),
    component: SiteHeader,
    wrapper: { tag: 'div', className: 'contents' },
    propsFromData: chromeProps,
  },
  footer: {
    fetch: (_request, params) => getSettings(localeParam(params)),
    component: SiteFooter,
    wrapper: { tag: 'div', className: 'contents' },
    propsFromData: chromeProps,
  },
};
