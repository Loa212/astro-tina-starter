import { existsSync, mkdirSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, resolve, sep } from 'node:path';
import { createDatabase, createLocalDatabase, type GitProvider } from '@tinacms/datalayer';
import { GitHubProvider } from 'tinacms-gitprovider-github';
import { EagerSqliteLevel } from './sqlite-eager';

const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === 'true';
const branch = process.env.GITHUB_BRANCH || 'main';

/**
 * Solo per le prove in locale (Docker o `pnpm start:local`): invece di fare un commit su GitHub,
 * ogni salvataggio dal CMS riscrive il file nella cartella del progetto (`content/...`).
 * Si attiva con TINA_GIT_PROVIDER=filesystem; in produzione resta GitHub.
 */
class FilesystemGitProvider implements GitProvider {
  private readonly root: string;

  constructor(root: string) {
    this.root = resolve(root);
  }

  private path(key: string) {
    const file = resolve(this.root, key);
    if (!file.startsWith(this.root + sep)) throw new Error(`Percorso fuori dal progetto: ${key}`);
    return file;
  }

  async onPut(key: string, value: string) {
    const file = this.path(key);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, value);
  }

  async onDelete(key: string) {
    await rm(this.path(key), { force: true });
  }
}

function createGitProvider(): GitProvider {
  if (process.env.TINA_GIT_PROVIDER === 'filesystem')
    return new FilesystemGitProvider(process.cwd());
  return new GitHubProvider({
    branch,
    owner: process.env.GITHUB_OWNER || '',
    repo: process.env.GITHUB_REPO || '',
    token: process.env.GITHUB_PERSONAL_ACCESS_TOKEN || '',
  });
}

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
  // identici a prima (git revert, `git checkout content/` dopo una prova in locale, rollback del deploy).
  const git = createGitProvider();
  const gitProvider: GitProvider = {
    onPut: async (key, value) => {
      await git.onPut(key, value);
      await db.setMetadata(FINGERPRINT_KEY, '');
    },
    onDelete: async (key) => {
      await git.onDelete(key);
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
