import { existsSync, mkdirSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { createDatabase, createLocalDatabase, type GitProvider } from '@tinacms/datalayer';
import { GitHubProvider } from 'tinacms-gitprovider-github';
import { EagerSqliteLevel } from './sqlite-eager';

const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === 'true';
const branch = process.env.GITHUB_BRANCH || 'main';

function createProductionDatabase() {
  // Nel container il DB sta sul volume /data (a meno di un percorso assoluto esplicito in TINA_DB_PATH);
  // in locale e durante la build resta in .tina/. Percorsi relativi in env vengono ignorati apposta:
  // /app non è scrivibile dall'utente del container.
  const fromEnv = process.env.TINA_DB_PATH;
  const filename =
    fromEnv && isAbsolute(fromEnv)
      ? fromEnv
      : existsSync('/data')
        ? '/data/tina.db'
        : resolve('.tina/tina.db');
  mkdirSync(dirname(filename), { recursive: true });
  // Solo gli "admins" possono creare/modificare utenti dal pannello. Elenco di username separati da
  // virgola in TINA_ADMINS; di default l'utente iniziale (TINA_ADMIN_USERNAME, altrimenti "admin").
  const admins = (process.env.TINA_ADMINS || process.env.TINA_ADMIN_USERNAME || 'admin')
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean);
  // Dopo un salvataggio dal CMS il DB non corrisponde più all'impronta dell'ultima indicizzazione:
  // la azzeriamo, così al prossimo avvio si re-indicizza dai file anche se nel frattempo sono tornati
  // identici a prima (git revert, rollback del deploy).
  const github = new GitHubProvider({
    branch,
    owner: process.env.GITHUB_OWNER || '',
    repo: process.env.GITHUB_REPO || '',
    token: process.env.GITHUB_PERSONAL_ACCESS_TOKEN || '',
  });
  const gitProvider: GitProvider = {
    onPut: async (key, value) => {
      await github.onPut(key, value);
      await db.setMetadata(FINGERPRINT_KEY, '');
    },
    onDelete: async (key) => {
      await github.onDelete(key);
      await db.setMetadata(FINGERPRINT_KEY, '');
    },
  };
  const db = createDatabase({
    authCollection: { admins, allowUnauthenticatedWrites: false },
    gitProvider,
    databaseAdapter: new EagerSqliteLevel<string, Record<string, unknown>>({ filename }),
    namespace: branch,
  });
  return db;
}

/** Metadato del DB con l'impronta dei contenuti indicizzati (scritto da server/reindex.ts). */
export const FINGERPRINT_KEY = 'contentFingerprint';

export default isLocal ? createLocalDatabase() : createProductionDatabase();
