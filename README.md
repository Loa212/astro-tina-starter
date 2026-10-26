# astro-tina-starter

Starter per siti vetrina (pagine a blocchi + blog + modulo contatti) che un collaboratore non tecnico
può aggiornare da solo, con un CMS **self-hosted** e un solo container da deployare su Coolify.

- **Astro 7** (pagine renderizzate dal server: una modifica salvata nel CMS è online subito) + **Tailwind CSS 4**
- **TinaCMS self-hosted** con *visual editing* da `/admin/index.html` (login username/password, nessun servizio esterno)
- **Blog**: raccolta articoli con elenco, pagina articolo, bozze, tag, blocco "ultimi articoli"
- **Un solo container** (Express): backend Tina su `/api/tina/*`, Astro per tutto il resto; indice in **SQLite** su volume,
  contenuti salvati come **commit su GitHub**
- **Modulo contatti** → email via **Resend** (niente database), anti-spam honeypot + Turnstile opzionale

## Creare un nuovo sito da questo starter

1. Copia la cartella (senza `node_modules`, `dist`, `.tina`, `.git`) o usala come template GitHub.
2. `pnpm install`, poi cambia: `name` in `package.json`, `site` in `astro.config.mjs`, i colori/font in
   `src/styles/global.css` (blocco `@theme`), logo e immagini in `public/uploads/` (`logo.svg`, `hero.svg`, `og.png`),
   favicon in `public/`.
3. Contenuti iniziali: `content/settings/site.json` (nome, menu, social, contatti), `content/pages/*.md`, `content/posts/*.md`.
4. `pnpm dev` e apri `http://localhost:4321/admin/index.html` per modificare tutto visivamente.
5. Deploy: vedi sotto.

## Per chi aggiorna i contenuti

1. Vai su `https://<dominio>/admin/index.html` e accedi con username e password.
2. A sinistra: **Pagine**, **Blog**, **Impostazioni sito** (nome, logo, menu, social, contatti, piè di pagina).
3. Apri una pagina: la vedi come i visitatori. **Clicca su un testo** per modificarlo nel pannello a lato, oppure usa
   la lista **Sezioni** per aggiungere, spostare o eliminare blocchi.
4. **Blog**: *Create New* → titolo, data, sommario, immagine, tag, testo. L'indirizzo viene generato dal titolo.
   Spunta **Bozza** per non pubblicare ancora (la bozza si vede solo dentro l'editor).
5. **Salva**: la modifica è visibile subito ricaricando la pagina. In sottofondo viene fatto un commit su GitHub
   e il sito si ridistribuisce da solo in 1–3 minuti.
6. **Immagini**: scegli tra quelle in *Media*. Per aggiungerne di nuove chiedi a chi gestisce il codice (vanno in `public/uploads/`).
7. **Utenti**: solo l'amministratore può aggiungerli o modificarli dal menu *Users*.

## Per chi gestisce il codice

### Requisiti
Node ≥ 22, pnpm 11.

### Sviluppo locale (senza login, contenuti letti dai file)
```bash
pnpm install
pnpm dev            # sito: http://localhost:4321  –  CMS: http://localhost:4321/admin/index.html
```
`pnpm dev` esegue `tinacms dev -c "astro dev"` e va lanciato da un terminale interattivo (senza TTY Astro 7 avvia il
dev server in background e `tinacms dev` termina subito).

### Build e prova della modalità produzione in locale
```bash
pnpm build          # tinacms build + astro build + bundle del server in dist/server.mjs
cp .env.example .env   # compila almeno TINA_ADMIN_PASSWORD, NEXTAUTH_SECRET e le variabili GITHUB_*
pnpm start:local    # http://localhost:3000 – login con TINA_ADMIN_USERNAME / TINA_ADMIN_PASSWORD
```
In produzione il server, all'avvio, indicizza `content/` nel database SQLite e **salta** l'indicizzazione se il commit
(`SOURCE_COMMIT`, impostato da Coolify) è già quello indicizzato.

### Variabili d'ambiente
Vedi [`.env.example`](.env.example).

| Variabile | Uso |
|---|---|
| `TINA_PUBLIC_IS_LOCAL` | `true` solo in sviluppo. In produzione `false` o assente |
| `TINA_DB_PATH` | File SQLite dell'indice. Nel container viene usato comunque il volume `/data` |
| `TINA_ADMIN_USERNAME` / `TINA_ADMIN_PASSWORD` / `TINA_ADMIN_EMAIL` | Primo utente del CMS, creato **solo al primo avvio** (DB vuoto). Poi utenti e password vivono nel DB sul volume. Password ≥ 12 caratteri. Mai nel repo |
| `TINA_ADMINS` | Opzionale: username, separati da virgola, che possono gestire gli utenti dal pannello. Default: `TINA_ADMIN_USERNAME` |
| `NEXTAUTH_SECRET` | Segreto sessioni (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | `https://<dominio>/api/tina` (deve corrispondere al dominio, altrimenti il login fallisce) |
| `GITHUB_OWNER` / `GITHUB_REPO` / `GITHUB_BRANCH` | Repo dove Tina committa i contenuti |
| `GITHUB_PERSONAL_ACCESS_TOKEN` | Fine-grained PAT, solo quel repo, **Contents: Read and write** |
| `RESEND_API_KEY`, `MAIL_TO`, `MAIL_FROM` | Invio email del modulo contatti (`MAIL_FROM` su dominio verificato in Resend) |
| `PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Opzionali: Cloudflare Turnstile anti-spam |
| `PUBLIC_SITE_URL` | URL pubblico (canonical, Open Graph) |
| `SITE_NOINDEX` | `true` su un dominio provvisorio: tutte le pagine escono con `noindex` |

### Deploy su Coolify
1. **Repo GitHub** (privato va bene) e **token** fine-grained con *Contents: Read and write* su quel repo.
2. **Coolify** → *New resource* → *Application* → GitHub app → repo, branch `main`.
   - Build pack **Dockerfile** · Port **3000** · dominio
   - **Persistent storage**: volume montato su **`/data`**
   - **Environment variables**: quelle della tabella (non impostare `SOURCE_COMMIT`: lo mette Coolify; `NODE_ENV` idem)
3. **Deploy**, poi `/admin/index.html` con `TINA_ADMIN_USERNAME` / `TINA_ADMIN_PASSWORD`. Da *Users* aggiungi i collaboratori.
4. Al cambio dominio: aggiorna `PUBLIC_SITE_URL`, `NEXTAUTH_URL`, `SITE_NOINDEX`.

Per resettare tutto (utenti compresi): svuota il volume `/data` e ridistribuisci.

### Struttura
```
content/            contenuti (md/json): la fonte di verità, versionata su git
  pages/            pagine a blocchi · posts/  articoli del blog · settings/site.json
tina/               schema CMS (collections/), config.ts, database.ts (SQLite + GitHub), sqlite-eager.ts
server/             Express: backend Tina + Astro + utente iniziale + re-indicizzazione all'avvio
src/components/blocks   un componente per tipo di sezione (hero, richText, steps, cards, cta, contactList, image, contactForm, latestPosts)
src/components/islands  regioni rieditabili (pagina, articolo, header, footer)
src/lib/tina        caricamento dati (databaseClient) e registro isole
src/pages           [...slug].astro (pagine), blog/, api/contatto.ts, grazie.astro, tina-island/[name].ts
public/uploads      immagini scelte dal CMS
```

### Aggiungere un tipo di sezione
1. Template in `tina/collections/pages.ts` (campi con lo stesso nome in template diversi devono avere lo stesso tipo).
2. Componente in `src/components/blocks/` con `data-tina-field={tinaField(block, 'campo')}` sugli elementi cliccabili.
3. `case 'PageBlocks<Nome>'` in `BlockRenderer.astro`. Riavvia `pnpm dev` (rigenera `tina/__generated__`).

### Limiti noti
- **Upload immagini dal CMS**: in self-hosted Tina non ha il CDN media di TinaCloud; il media manager è in sola lettura
  (`static: true`). Le nuove immagini si aggiungono in `public/uploads/` con un commit.
- L'immagine è di 1,6 GB (dipendenze React/Next richieste dai pacchetti Tina).
