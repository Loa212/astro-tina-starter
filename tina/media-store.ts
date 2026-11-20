import type { Media, MediaList, MediaListOptions, MediaStore, MediaUploadOptions } from 'tinacms';

async function parse<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error ?? `Errore ${res.status}`);
  return body as T;
}

/**
 * Media manager in produzione: parla con /api/media del nostro server (server/media.ts), che ottimizza
 * le immagini, le mette sul volume e le committa sul repo. Niente sottocartelle: tutto in /uploads.
 */
export class UploadsMediaStore implements MediaStore {
  accept = 'image/jpeg,image/png,image/webp,image/avif,image/gif';
  maxSize = 25 * 1024 * 1024;

  async persist(files: MediaUploadOptions[]): Promise<Media[]> {
    const uploaded: Media[] = [];
    for (const { file } of files) {
      const res = await fetch(`/api/media/upload?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        body: file,
        headers: { 'content-type': file.type || 'application/octet-stream' },
      });
      uploaded.push(await parse<Media>(res));
    }
    return uploaded;
  }

  async delete(media: Media): Promise<void> {
    await parse(
      await fetch(`/api/media/${encodeURIComponent(media.filename)}`, { method: 'DELETE' }),
    );
  }

  async list(options?: MediaListOptions): Promise<MediaList> {
    if (options?.directory) return { items: [] };
    const params = new URLSearchParams({
      offset: String(options?.offset ?? 0),
      limit: String(options?.limit ?? 50),
    });
    const list = await parse<MediaList>(await fetch(`/api/media/list?${params}`));
    // Miniature: la stessa immagine, la ridimensiona il browser.
    const sizes = options?.thumbnailSizes ?? [];
    return {
      ...list,
      items: list.items.map((m) => ({
        ...m,
        thumbnails: Object.fromEntries(sizes.map(({ w, h }) => [`${w}x${h}`, m.src ?? ''])),
      })),
    };
  }
}
