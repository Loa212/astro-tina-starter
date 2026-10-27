# astro-tina-starter

Starter per siti vetrina (pagine a blocchi + blog + modulo contatti) che un collaboratore non tecnico
può aggiornare da solo, con un CMS **self-hosted** e un solo container da deployare su Coolify.

- **Astro 7** (pagine renderizzate dal server: una modifica salvata nel CMS è online subito) + **Tailwind CSS 4**
- **TinaCMS self-hosted** con *visual editing* da `/admin/index.html` (login username/password, nessun servizio esterno)
- **Multilingua**: inglese (predefinito, URL senza prefisso) e italiano (`/it/…`), una cartella di contenuti per lingua
- **Struttura da landing page**: hero con immagine, numeri chiave, immagine + vantaggi, testimonianze, servizi,
  domande frequenti, ultimi articoli, invito all'azione; tema chiaro e minimale con foto di esempio
- **Blog** ("Journal"): elenco, pagina articolo, bozze, tag, blocco "ultimi articoli"
- **Un solo container** (Express): backend Tina su `/api/tina/*`, Astro per tutto il resto; indice in **SQLite** su volume,
  contenuti salvati come **commit su GitHub**
- **Modulo contatti** → email via **Resend** (niente database), anti-spam honeypot + Turnstile opzionale

## Creare un nuovo sito da questo starter

1. Copia la cartella (senza `node_modules`, `dist`, `.tina`, `.git`) o usala come template GitHub.
2. `pnpm install`, poi cambia: `name` in `package.json`, `site` in `astro.config.mjs`, i colori/font in
   `src/styles/global.css` (blocco `@theme`), logo e immagini in `public/uploads/` (`logo.svg`, `og.jpg` e le foto),
   favicon in `public/`.
3. Contenuti iniziali, una copia per lingua: `content/settings/<lingua>.json` (nome, menu, pulsante in alto, social,
   contatti), `content/pages/<lingua>/*.md`, `content/posts/<lingua>/*.md`. I testi fissi dell'interfaccia (etichette
   del modulo, 404, "Tutti gli articoli"…) sono in `src/lib/i18n.ts`.
4. `pnpm dev` e apri `http://localhost:4321/admin/index.html` per modificare tutto visivamente.
5. Deploy: vedi sotto.

### Lingue
Le lingue sono in `src/lib/i18n.ts` (`locales`): la prima è la predefinita e ha URL senza prefisso (`/about/`), le
altre hanno il prefisso (`/it/about/`). TinaCMS non ha un sistema di traduzioni integrato: si usa una **cartella per
lingua**, come consigliato dalla [guida Tina](https://tina.io/docs/guides/internationalization).

- **Traduzione = stesso nome file** in un'altra cartella (`pages/en/about.md` ↔ `pages/it/about.md`): il selettore
  lingua e i tag `hreflang` collegano le due versioni. Se una traduzione manca, il selettore porta alla home dell'altra lingua.
- I link nei contenuti (menu, pulsanti) si scrivono completi di prefisso: `/it/contact/`.
- Per aggiungere una lingua: il codice in `locales` e `localeMeta`, i testi in `ui`, poi `content/settings/<lingua>.json`
  e le cartelle `content/pages/<lingua>/` e `content/posts/<lingua>/`.

## Per chi aggiorna i contenuti

1. Vai su `https://<dominio>/admin/index.html` e accedi con username e password.
2. A sinistra: **Pages**, **Journal**, **Site settings** (nome, logo, menu, pulsante in alto, social, contatti, piè di
   pagina). Ogni raccolta ha una cartella per lingua: `en` (inglese) e `it` (italiano).
3. Apri una pagina: la vedi come i visitatori. **Clicca su un testo** per modificarlo nel pannello a lato, oppure usa
   la lista **Sections** per aggiungere, spostare o eliminare blocchi.
4. **Journal**: entra nella cartella della lingua, poi *Create New* → titolo, data, sommario, immagine, tag, testo.
   L'indirizzo viene generato dal titolo. Spunta **Draft** per non pubblicare ancora (la bozza si vede solo
   dentro l'editor). Una traduzione si collega all'originale se ha lo stesso nome file.
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

### Makefile
Scorciatoie per tutto quanto sopra: `make` mostra l'elenco dei comandi.
```bash
make env            # crea il .env da .env.example (poi compilalo)
make dev            # = pnpm dev
make start          # build + modalità produzione su http://localhost:3000
make docker-up      # stessa immagine del deploy: build + container su http://localhost:3000, volume per /data
make docker-logs    # log del container · make docker-down lo ferma · make docker-clean rimuove anche volume e immagine
```
Porta diversa: `make docker-up PORT=8080` (aggiorna anche `NEXTAUTH_URL` nel `.env`).

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
  pages/<lingua>/   pagine a blocchi · posts/<lingua>/  articoli · settings/<lingua>.json
tina/               schema CMS (collections/), config.ts, database.ts (SQLite + GitHub), sqlite-eager.ts
server/             Express: backend Tina + Astro + utente iniziale + re-indicizzazione all'avvio
src/components/blocks   un componente per tipo di sezione (hero, stats, feature, testimonials, cards, steps, faq,
                        richText, image, latestPosts, cta, contactList, contactForm)
src/components/islands  regioni rieditabili (pagina, articolo, header, footer)
src/lib/i18n.ts     lingue, URL per lingua, testi fissi dell'interfaccia
src/lib/tina        caricamento dati (databaseClient) e registro isole
src/pages           [...slug].astro (pagine, con o senza prefisso lingua), [...lang]/blog/, [...lang]/thanks.astro,
                    api/contact.ts, tina-island/[name].ts
public/uploads      immagini scelte dal CMS
```

### Immagini di esempio
Le foto in `public/uploads/` vengono da [Unsplash](https://unsplash.com) ([licenza Unsplash](https://unsplash.com/license):
uso libero, anche commerciale, attribuzione non obbligatoria), scaricate da `images.unsplash.com/photo-<id>`:

| File | id |
|---|---|
| `house-dusk.jpg`, `og.jpg` | `1600585154340-be6161a56a0c` |
| `timber-house.jpg` | `1600566753190-17f0baa2a6c3` |
| `project-cedar.jpg` | `1600047509807-ba8f99d2cdde` |
| `project-white.jpg` | `1523217582562-09d0def993a6` |
| `project-duplex.jpg` | `1600563438938-a9a27216b4f5` |
| `studio.jpg` | `1497366811353-6870744d04b2` |
| `staircase.jpg` | `1502005229762-cf1b2da7c5d6` |
| `white-facade.jpg` | `1479839672679-a46483c0e7c8` |
| `angular-building.jpg` | `1487958449943-2429e8be8625` |
| `drawings.jpg` | `1503387762-592deb58ef4e` |
| `timber-interior.jpg` | `1600607687939-ce8a6c25118c` |

Sono segnaposto per la demo ("Halden Studio" è uno studio inventato): sostituiscile con le foto del cliente.

### Aggiungere un tipo di sezione
1. Template in `tina/collections/pages.ts` (campi con lo stesso nome in template diversi devono avere lo stesso tipo).
2. Componente in `src/components/blocks/` con `data-tina-field={tinaField(block, 'campo')}` sugli elementi cliccabili.
3. `case 'PageBlocks<Nome>'` in `BlockRenderer.astro`. Riavvia `pnpm dev` (rigenera `tina/__generated__`).

### Privacy e cookie
La pagina `/privacy/` (`content/pages/<lingua>/privacy.md`, modificabile dal CMS) è linkata dal footer e dal consenso del modulo:
compila i segnaposto **[…]** e falla rivedere a chi ne risponde. Il sito non usa cookie di profilazione né di terze parti,
quindi non serve un banner; se aggiungi analytics o embed esterni, serve un banner con consenso.

### Limiti noti
- **Upload immagini dal CMS**: in self-hosted Tina non ha il CDN media di TinaCloud; il media manager è in sola lettura
  (`static: true`). Le nuove immagini si aggiungono in `public/uploads/` con un commit.
- L'immagine è di 1,6 GB (dipendenze React/Next richieste dai pacchetti Tina).
