import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LocalBackendAuthProvider, TinaNodeBackend } from '@tinacms/datalayer';
import cookieParser from 'cookie-parser';
import express, { type Request, type Response } from 'express';
import { AuthJsBackendAuthProvider, TinaAuthJSOptions } from 'tinacms-authjs';
import databaseClient from '../tina/__generated__/databaseClient';
import { ensureIndexed } from './reindex';

const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === 'true';
const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '0.0.0.0';

function requireEnv(...names: string[]) {
  const missing = names.filter((n) => !process.env[n]);
  if (missing.length) {
    throw new Error(`Variabili d'ambiente mancanti: ${missing.join(', ')}`);
  }
}

if (!isLocal) {
  requireEnv('NEXTAUTH_SECRET', 'GITHUB_OWNER', 'GITHUB_REPO', 'GITHUB_PERSONAL_ACCESS_TOKEN');
}

const distDir = fileURLToPath(new URL('.', import.meta.url)); // dist/
const rootDir = resolve(distDir, '..');

const tinaHandler = TinaNodeBackend({
  authProvider: isLocal
    ? LocalBackendAuthProvider()
    : AuthJsBackendAuthProvider({
        authOptions: TinaAuthJSOptions({
          databaseClient,
          secret: process.env.NEXTAUTH_SECRET as string,
        }),
      }),
  databaseClient,
});

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', true);

// Asset statici generati da Astro (include /admin dell'editor e /uploads).
app.use(
  express.static(resolve(distDir, 'client'), {
    index: false,
    etag: true,
    setHeaders: (res, path) => {
      if (path.includes('/_astro/')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=3600');
      }
    },
  }),
);

// Backend TinaCMS: GraphQL (/api/tina/gql) + Auth.js (/api/tina/auth/*).
app.all(
  '/api/tina/*path',
  express.json({ limit: '10mb' }),
  express.urlencoded({ extended: true }),
  cookieParser(),
  async (req: Request, res: Response) => {
    // Express 5 espone `req.query` come getter non scrivibile: Tina/Auth.js vi scrivono `nextauth`,
    // quindi lo sostituiamo con un normale oggetto.
    Object.defineProperty(req, 'query', {
      value: { ...req.query },
      writable: true,
      configurable: true,
    });
    await tinaHandler(req, res);
  },
);

// Tutto il resto: Astro (pagine SSR, /api/contatto, /tina-island/*).
const { handler: astroHandler } = await import(new URL('./server/entry.mjs', import.meta.url).href);
app.use(astroHandler);

/**
 * Utente amministratore iniziale, preso dalle variabili d'ambiente (mai committato).
 * Tina semina la collection utenti solo quando il DB è vuoto: dopo il primo avvio contano
 * username/password salvati nel DB (modificabili dall'admin), non più queste variabili.
 */
function ensureUsersSeed() {
  const file = resolve(rootDir, 'content/users/index.json');
  const password = process.env.TINA_ADMIN_PASSWORD;
  if (!password) {
    if (isLocal || existsSync(file)) return;
    throw new Error('TINA_ADMIN_PASSWORD mancante: serve per creare il primo utente del CMS');
  }
  if (password.length < 12)
    throw new Error('TINA_ADMIN_PASSWORD troppo corta: almeno 12 caratteri');
  const seed = {
    users: [
      {
        username: process.env.TINA_ADMIN_USERNAME || 'admin',
        name: process.env.TINA_ADMIN_NAME || 'Amministratore',
        email: process.env.TINA_ADMIN_EMAIL || '',
        password: { value: password, passwordChangeRequired: false },
      },
    ],
  };
  mkdirSync(resolve(rootDir, 'content/users'), { recursive: true });
  writeFileSync(file, `${JSON.stringify(seed, null, 2)}\n`);
}

try {
  ensureUsersSeed();
  await ensureIndexed(rootDir);
} catch (err) {
  console.error('[tina] avvio fallito:', err);
  process.exit(1);
}

app.listen(port, host, () => {
  console.log(`Server in ascolto su http://${host}:${port} (${isLocal ? 'locale' : 'produzione'})`);
});
