import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createSchema, FilesystemBridge } from '@tinacms/graphql';
import database from '../tina/database';

/**
 * Indicizza i file di `content/` (quelli dentro l'immagine) nel database SQLite.
 *
 * Il DB vive su un volume persistente, quindi:
 * - gli utenti (collection "detached") vengono seminati solo la prima volta e poi restano;
 * - i contenuti vengono re-indicizzati a ogni avvio, a meno che il commit dell'immagine
 *   (SOURCE_COMMIT, impostato da Coolify) sia già quello indicizzato. Così un container vecchio
 *   che si riavvia non sovrascrive una modifica appena salvata dal CMS.
 */
export async function ensureIndexed(rootPath = process.cwd()): Promise<void> {
  const sha = process.env.SOURCE_COMMIT || process.env.GIT_SHA || '';
  const db = await database;

  if (sha) {
    const last = await db.getMetadata('lastSha');
    if (last === sha) {
      console.log(`[tina] indice già aggiornato al commit ${sha.slice(0, 7)}, salto`);
      return;
    }
  }

  const generated = resolve(rootPath, 'tina/__generated__');
  const [schemaJson, graphqlJson] = await Promise.all([
    readFile(resolve(generated, '_schema.json'), 'utf8').then(JSON.parse),
    readFile(resolve(generated, '_graphql.json'), 'utf8').then(JSON.parse),
  ]);

  // `_graphql.json` è il documento GraphQL (AST) che Tina salva nel DB e compila a ogni richiesta.
  const tinaSchema = await createSchema({ schema: schemaJson });
  const graphQLSchema = graphqlJson;
  db.bridge = new FilesystemBridge(rootPath);

  const started = Date.now();
  const { warnings } = await db.indexContent({ graphQLSchema, tinaSchema });
  for (const w of warnings ?? []) console.warn('[tina] avviso indicizzazione:', w);
  if (sha) await db.setMetadata('lastSha', sha);
  console.log(
    `[tina] contenuti indicizzati in ${Date.now() - started}ms${sha ? ` (commit ${sha.slice(0, 7)})` : ''}`,
  );
}
