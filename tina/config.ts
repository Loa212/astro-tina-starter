import { defineConfig, LocalAuthProvider } from 'tinacms';
import { TinaUserCollection, UsernamePasswordAuthJSProvider } from 'tinacms-authjs/dist/tinacms';
import { pages } from './collections/pages';
import { posts } from './collections/posts';
import { settings } from './collections/settings';
import { UploadsMediaStore } from './media-store';

const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === 'true';

export default defineConfig({
  // In locale l'admin parla con il server GraphQL di `tinacms dev`; in produzione con il nostro backend.
  contentApiUrlOverride: isLocal ? undefined : '/api/tina/gql',
  authProvider: isLocal ? new LocalAuthProvider() : new UsernamePasswordAuthJSProvider(),
  build: {
    outputFolder: 'admin',
    publicFolder: 'public',
  },
  // In locale le immagini le scrive in public/uploads il CLI di Tina; in produzione il nostro /api/media.
  media: isLocal
    ? { tina: { mediaRoot: 'uploads', publicFolder: 'public' } }
    : { loadCustomStore: async () => UploadsMediaStore },
  schema: {
    collections: [TinaUserCollection, settings, pages, posts],
  },
});
