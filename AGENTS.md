# astro-tina-starter – note per chi lavora sul codice

Starter per siti vetrina con blog: Astro 7 (SSR, adapter Node in modalità middleware) + Tailwind v4 +
TinaCMS **self-hosted** (visual editing), servito da un unico processo Express (`server/index.ts`).
Dettagli operativi, deploy e guida per chi modifica i contenuti: `README.md`.

- Lingue: `src/lib/i18n.ts` (`locales`, la prima è la predefinita senza prefisso URL; le altre `/it/…`), più i testi
  fissi dell'interfaccia (`t(locale)`). Una cartella di contenuti per lingua; traduzione = stesso nome file.
- Contenuti: `content/pages/<lingua>/*.md` (pagine a blocchi), `content/posts/<lingua>/*.md` (blog),
  `content/settings/<lingua>.json`; utenti CMS: `content/users/index.json` è generato all'avvio del server da
  `TINA_ADMIN_*` (gitignored).
- Schema Tina: `tina/collections/{pages,posts,settings}.ts`, `tina/config.ts`; database/indice: `tina/database.ts`
  (sqlite-level con iteratori eager in `tina/sqlite-eager.ts` + provider GitHub).
- UI: `src/components/blocks/*` (un componente per template di sezione), `src/components/islands/*` (regioni
  rieditabili: pagina, articolo, header, footer), registro isole `src/lib/tina/islands.ts` (header/footer ricevono
  lingua, percorso e traduzioni come parametri), caricamento dati `src/lib/tina/data.ts` (usa `databaseClient`, non `client`).
- Rotte: `src/pages/[...slug].astro` (pagine, prefisso lingua opzionale), `src/pages/[...lang]/blog/{index,[slug]}.astro`,
  `src/pages/[...lang]/thanks.astro`; `[...lang]` vuoto = lingua predefinita. Le bozze sono visibili solo nell'editor.
- Modulo contatti: `src/components/blocks/ContactForm.astro` + `src/lib/contact.ts` + `src/pages/api/contact.ts` (Resend);
  il campo nascosto `_lang` sceglie lingua di errori e redirect.
- Comandi: `pnpm dev` (CMS locale senza login, serve un terminale interattivo), `pnpm build`, `pnpm start:local`,
  `pnpm check`, `pnpm lint`; scorciatoie e Docker locale nel `Makefile` (`make` per l'elenco, `make docker-up`).
- Nuovo tipo di sezione: template in `tina/collections/pages.ts` → componente in `src/components/blocks/` → `case` in
  `BlockRenderer.astro`. Campi con lo stesso nome in template diversi devono avere lo stesso tipo GraphQL
  (stesso `required`), altrimenti il codegen fallisce.
