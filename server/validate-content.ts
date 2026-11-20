import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Controllo dei contenuti in build (`pnpm build` → `pnpm validate:content`, quindi anche nel Dockerfile):
 * indicizza content/ in un database usa e getta con lo stesso codice che gira all'avvio del server.
 * Se un file non rispetta lo schema (campo rinominato, template rimosso, frontmatter rotto) la build
 * fallisce qui e Coolify non mette online l'immagine: il sito resta sulla versione precedente invece di
 * partire con un DB vuoto.
 */
const dir = mkdtempSync(join(tmpdir(), 'tina-validate-'));
process.env.TINA_DB_PATH = join(dir, 'validate.db');
delete process.env.TINA_PUBLIC_IS_LOCAL; // serve il DB di produzione (sqlite), non quello del CLI di Tina

let failed = false;
const originalWarn = console.warn;
const warnings: unknown[][] = [];
console.warn = (...args: unknown[]) => {
  warnings.push(args);
  originalWarn(...args);
};

try {
  const { ensureIndexed } = await import('./reindex');
  await ensureIndexed(process.cwd());
  const indexWarnings = warnings.filter((w) => String(w[0]).includes('avviso indicizzazione'));
  if (indexWarnings.length > 0) {
    failed = true;
    console.error(
      `\n[validate:content] ${indexWarnings.length} avvisi di indicizzazione: correggi i file in content/ prima del deploy.`,
    );
  } else {
    console.log('[validate:content] tutti i file di content/ rispettano lo schema');
  }
} catch (err) {
  failed = true;
  console.error(
    '\n[validate:content] indicizzazione fallita: un file in content/ non rispetta lo schema.',
  );
  console.error(err);
} finally {
  rmSync(dir, { recursive: true, force: true });
}

process.exit(failed ? 1 : 0);
