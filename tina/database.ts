import { existsSync, mkdirSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { createDatabase, createLocalDatabase } from '@tinacms/datalayer';
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
  return createDatabase({
    authCollection: { admins, allowUnauthenticatedWrites: false },
    gitProvider: new GitHubProvider({
      branch,
      owner: process.env.GITHUB_OWNER || '',
      repo: process.env.GITHUB_REPO || '',
      token: process.env.GITHUB_PERSONAL_ACCESS_TOKEN || '',
    }),
    databaseAdapter: new EagerSqliteLevel<string, Record<string, unknown>>({ filename }),
    namespace: branch,
  });
}

export default isLocal ? createLocalDatabase() : createProductionDatabase();
