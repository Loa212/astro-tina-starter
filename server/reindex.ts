import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { createSchema, FilesystemBridge } from '@tinacms/graphql';
import database, { FINGERPRINT_KEY } from '../tina/database';

/**
 * Indicizza i file di `content/` (quelli dentro l'immagine) nel database SQLite.
 *
 * Il DB vive su un volume persistente, quindi:
 * - gli utenti (collection "detached") vengono seminati solo la prima volta e poi restano;
 * - i contenuti vengono re-indicizzati solo se i file dell'immagine sono cambiati rispetto all'ultima
 *   indicizzazione (impronta di content/ + schema), così un nuovo deploy viene sempre indicizzato
 *   anche se SOURCE_COMMIT manca o è impostato a mano;
 * - ogni salvataggio dal CMS azzera l'impronta (tina/database.ts): al riavvio successivo il DB torna
 *   allineato ai file, anche se questi sono stati riportati com'erano prima del salvataggio.
 */
export async function ensureIndexed(rootPath = process.cwd()): Promise<void> {
  const db = await database;
  const generated = resolve(rootPath, 'tina/__generated__');
  const fingerprint = await contentFingerprint(resolve(rootPath, 'content'), generated);
  const commit = (process.env.SOURCE_COMMIT || '').slice(0, 7);

  const last = await db.getMetadata(FINGERPRINT_KEY);
  if (last === fingerprint) {
    console.log(
      `[tina] contenuti già indicizzati (${fingerprint.slice(0, 12)}${commit ? `, commit ${commit}` : ''}), salto`,
    );
    return;
  }

  const [schemaJson, graphqlJson] = await Promise.all([
    readFile(resolve(generated, '_schema.json'), 'utf8').then(JSON.parse),
    readFile(resolve(generated, '_graphql.json'), 'utf8').then(JSON.parse),
  ]);

  // `_graphql.json` è il documento GraphQL (AST) che Tina salva nel DB e compila a ogni richiesta.
  const tinaSchema = await createSchema({ schema: schemaJson });
  db.bridge = new FilesystemBridge(rootPath);

  const started = Date.now();
  const { warnings } = await db.indexContent({ graphQLSchema: graphqlJson, tinaSchema });
  for (const w of warnings ?? []) console.warn('[tina] avviso indicizzazione:', w);
  await db.setMetadata(FINGERPRINT_KEY, fingerprint);
  console.log(
    `[tina] contenuti indicizzati in ${Date.now() - started}ms (${fingerprint.slice(0, 12)}${commit ? `, commit ${commit}` : ''})`,
  );
}

/** SHA-256 di percorsi e contenuti di content/ (esclusi gli utenti, gestiti a parte) + schema generato. */
async function contentFingerprint(contentDir: string, generatedDir: string): Promise<string> {
  const hash = createHash('sha256');
  const files = (await walk(contentDir))
    .filter((f) => !relative(contentDir, f).startsWith('users/'))
    .sort();
  for (const file of files) {
    hash.update(relative(contentDir, file));
    hash.update('\0');
    hash.update(await readFile(file));
    hash.update('\0');
  }
  hash.update(await readFile(join(generatedDir, '_schema.json')));
  return hash.digest('hex');
}

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const out: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}
