import { existsSync } from 'node:fs';
import { mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { BackendAuthProvider } from '@tinacms/datalayer';
import cookieParser from 'cookie-parser';
import express, { type NextFunction, type Request, type Response } from 'express';
import sharp from 'sharp';

/**
 * Media manager del CMS in produzione (il media "repo" di Tina in self-hosted passa da TinaCloud e non funziona).
 * Il client è tina/media-store.ts. Un'immagine caricata:
 * - viene ruotata secondo l'EXIF, ridotta a 2000px, convertita in WebP e ripulita dai metadati (anche il GPS);
 * - va subito nel volume (`uploadsDir`, servito su /uploads), così la si vede senza aspettare la build;
 * - viene committata in public/uploads/ sul repo, così la build successiva la include.
 */

const IMAGE_FILE = /^[a-z0-9][a-z0-9._-]*\.(webp|jpe?g|png|gif|avif)$/;
const MAX_UPLOAD = 25 * 1024 * 1024;

interface GitHubConfig {
  owner: string;
  repo: string;
  branch: string;
  token: string;
}

interface Options {
  authProvider: BackendAuthProvider;
  /** Immagini scritte a runtime (volume persistente). */
  uploadsDir: string;
  /** Immagini arrivate con la build (dist/client/uploads). */
  buildUploadsDir: string;
  /** Assente con TINA_GIT_PROVIDER=filesystem: niente commit. */
  github?: GitHubConfig;
}

function githubContents({ owner, repo, branch, token }: GitHubConfig) {
  const base = `https://api.github.com/repos/${owner}/${repo}/contents/`;
  const headers = {
    authorization: `Bearer ${token}`,
    accept: 'application/vnd.github+json',
    'x-github-api-version': '2022-11-28',
    'user-agent': 'astro-tina-cms',
  };
  const fail = async (r: globalThis.Response) => {
    const body = (await r.json().catch(() => ({}))) as { message?: string };
    return new Error(`GitHub ${r.status}: ${body.message ?? r.statusText}`);
  };
  return {
    async put(path: string, content: Buffer, message: string) {
      const r = await fetch(base + path, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ message, branch, content: content.toString('base64') }),
      });
      if (!r.ok) throw await fail(r);
    },
    async delete(path: string, message: string) {
      const found = await fetch(`${base}${path}?ref=${encodeURIComponent(branch)}`, { headers });
      if (found.status === 404) return;
      if (!found.ok) throw await fail(found);
      const { sha } = (await found.json()) as { sha: string };
      const r = await fetch(base + path, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ message, branch, sha }),
      });
      if (!r.ok) throw await fail(r);
    },
  };
}

function slugify(name: string) {
  return (
    name
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'immagine'
  );
}

const toMedia = (filename: string) => ({
  type: 'file' as const,
  id: filename,
  filename,
  directory: '',
  src: `/uploads/${filename}`,
});

async function filesIn(dir: string) {
  const names = await readdir(dir).catch(() => [] as string[]);
  return Promise.all(
    names
      .filter((name) => IMAGE_FILE.test(name))
      .map(async (name) => ({ name, mtime: (await stat(resolve(dir, name))).mtimeMs })),
  );
}

export function createMediaRouter({ authProvider, uploadsDir, buildUploadsDir, github }: Options) {
  const git = github && githubContents(github);
  const router = express.Router();

  router.use(cookieParser(), async (req: Request, res: Response, next: NextFunction) => {
    // Le modifiche arrivano solo dall'admin, sullo stesso sito.
    const site = req.get('sec-fetch-site');
    if (req.method !== 'GET' && site && site !== 'same-origin') {
      res.status(403).json({ error: 'Richiesta non consentita' });
      return;
    }
    const auth = await authProvider.isAuthorized(req, res);
    if (!auth.isAuthorized) {
      res.status(auth.errorCode).json({ error: 'Accesso scaduto: rientra nell’area riservata' });
      return;
    }
    next();
  });

  router.get('/list', async (req: Request, res: Response) => {
    const offset = Math.max(0, Number(req.query.offset) || 0);
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
    // Prima le più recenti: chi ha appena caricato una foto la trova in cima.
    const byName = new Map<string, number>();
    for (const { name, mtime } of [
      ...(await filesIn(buildUploadsDir)),
      ...(await filesIn(uploadsDir)),
    ]) {
      byName.set(name, Math.max(mtime, byName.get(name) ?? 0));
    }
    const sorted = [...byName].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const page = sorted.slice(offset, offset + limit);
    res.json({
      items: page.map(([name]) => toMedia(name)),
      nextOffset: offset + limit < sorted.length ? offset + limit : undefined,
    });
  });

  router.post(
    '/upload',
    express.raw({ type: () => true, limit: MAX_UPLOAD }),
    async (req: Request, res: Response) => {
      const input = req.body;
      if (!Buffer.isBuffer(input) || input.length === 0) {
        res.status(400).json({ error: 'Nessun file ricevuto' });
        return;
      }
      const format = await sharp(input)
        .metadata()
        .then((m) => m.format)
        .catch(() => undefined);
      if (!format || !['jpeg', 'png', 'webp', 'gif', 'avif', 'tiff'].includes(format)) {
        res
          .status(415)
          .json({ error: 'Formato non supportato: carica una foto JPG, PNG, WebP o GIF' });
        return;
      }
      // Le GIF (spesso animate) restano com'erano; il resto diventa WebP.
      const ext = format === 'gif' ? 'gif' : 'webp';
      const output =
        format === 'gif'
          ? input
          : await sharp(input)
              .rotate()
              .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
              .webp({ quality: 82 })
              .toBuffer();

      const base = slugify(String(req.query.filename ?? '').replace(/\.[^.]*$/, ''));
      let filename = `${base}.${ext}`;
      for (
        let n = 2;
        existsSync(resolve(uploadsDir, filename)) || existsSync(resolve(buildUploadsDir, filename));
        n++
      ) {
        filename = `${base}-${n}.${ext}`;
      }

      await mkdir(uploadsDir, { recursive: true });
      const file = resolve(uploadsDir, filename);
      await writeFile(file, output);
      try {
        await git?.put(
          `public/uploads/${filename}`,
          output,
          `Immagine caricata dal CMS: ${filename}`,
        );
      } catch (err) {
        await rm(file, { force: true });
        console.error('[media] commit dell’immagine fallito:', err);
        res.status(502).json({ error: 'Salvataggio su GitHub non riuscito: riprova tra poco' });
        return;
      }
      res.status(201).json(toMedia(filename));
    },
  );

  router.delete('/:filename', async (req: Request, res: Response) => {
    const filename = String(req.params.filename);
    if (!IMAGE_FILE.test(filename)) {
      res.status(400).json({ error: 'Nome file non valido' });
      return;
    }
    try {
      await git?.delete(`public/uploads/${filename}`, `Immagine eliminata dal CMS: ${filename}`);
    } catch (err) {
      console.error('[media] eliminazione su GitHub fallita:', err);
      res.status(502).json({ error: 'Eliminazione su GitHub non riuscita: riprova tra poco' });
      return;
    }
    // Anche la copia arrivata con la build, così sparisce subito dall'elenco.
    await rm(resolve(uploadsDir, filename), { force: true });
    await rm(resolve(buildUploadsDir, filename), { force: true });
    res.status(204).end();
  });

  router.use(
    (err: Error & { type?: string }, _req: Request, res: Response, _next: NextFunction) => {
      if (err.type === 'entity.too.large') {
        res.status(413).json({ error: 'File troppo grande: massimo 25 MB' });
        return;
      }
      console.error('[media]', err);
      res.status(500).json({ error: 'Errore del server durante il caricamento' });
    },
  );

  return router;
}
