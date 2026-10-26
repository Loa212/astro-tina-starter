# astro-tina-starter – note per chi lavora sul codice

Starter per siti vetrina con blog: Astro 7 (SSR, adapter Node in modalità middleware) + Tailwind v4 +
TinaCMS **self-hosted** (visual editing), servito da un unico processo Express (`server/index.ts`).
Dettagli operativi, deploy e guida per chi modifica i contenuti: `README.md`.

- Contenuti: `content/pages/*.md` (pagine a blocchi), `content/posts/*.md` (blog), `content/settings/site.json`;
  utenti CMS: `content/users/index.json` è generato all'avvio del server da `TINA_ADMIN_*` (gitignored).
- Schema Tina: `tina/collections/{pages,posts,settings}.ts`, `tina/config.ts`; database/indice: `tina/database.ts`
  (sqlite-level con iteratori eager in `tina/sqlite-eager.ts` + provider GitHub).
- UI: `src/components/blocks/*` (un componente per template di sezione), `src/components/islands/*` (regioni
  rieditabili: pagina, articolo, header, footer), registro isole `src/lib/tina/islands.ts`, caricamento dati
  `src/lib/tina/data.ts` (usa `databaseClient`, non `client`).
- Blog: `src/pages/blog/index.astro` (elenco), `src/pages/blog/[slug].astro` (articolo, bozze visibili solo nell'editor),
  blocco `latestPosts` per la home, `PostCard.astro`.
- Modulo contatti: `src/components/blocks/ContactForm.astro` + `src/lib/contatto.ts` + `src/pages/api/contatto.ts` (Resend).
- Comandi: `pnpm dev` (CMS locale senza login, serve un terminale interattivo), `pnpm build`, `pnpm start:local`,
  `pnpm check`, `pnpm lint`.
- Nuovo tipo di sezione: template in `tina/collections/pages.ts` → componente in `src/components/blocks/` → `case` in
  `BlockRenderer.astro`. Campi con lo stesso nome in template diversi devono avere lo stesso tipo GraphQL
  (stesso `required`), altrimenti il codegen fallisce.
