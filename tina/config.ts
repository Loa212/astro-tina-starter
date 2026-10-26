import { defineConfig, LocalAuthProvider } from 'tinacms';
import { TinaUserCollection, UsernamePasswordAuthJSProvider } from 'tinacms-authjs/dist/tinacms';
import { pages } from './collections/pages';
import { posts } from './collections/posts';
import { settings } from './collections/settings';

const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === 'true';

export default defineConfig({
  // In locale l'admin parla con il server GraphQL di `tinacms dev`; in produzione con il nostro backend.
  contentApiUrlOverride: isLocal ? undefined : '/api/tina/gql',
  authProvider: isLocal ? new LocalAuthProvider() : new UsernamePasswordAuthJSProvider(),
  build: {
    outputFolder: 'admin',
    publicFolder: 'public',
  },
  media: {
    tina: {
      mediaRoot: 'uploads',
      publicFolder: 'public',
      static: true,
    },
  },
  schema: {
    collections: [TinaUserCollection, settings, pages, posts],
  },
});
