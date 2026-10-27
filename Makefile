# Comandi rapidi per lavorare in locale. `make` (o `make help`) mostra l'elenco.
# Le variabili si possono cambiare al volo: `make docker-up PORT=8080`
# (in quel caso aggiorna anche NEXTAUTH_URL nel .env, altrimenti il login del CMS fallisce).

IMAGE     ?= astro-tina-starter:local
CONTAINER ?= astro-tina-starter
VOLUME    ?= astro-tina-data
PORT      ?= 3000
ENV_FILE  ?= .env

.DEFAULT_GOAL := help
.PHONY: help install dev build start check lint format env \
	docker-build docker-up docker-down docker-restart docker-logs docker-shell docker-reset docker-clean

help: ## Mostra questo elenco
	@awk 'BEGIN {FS = ":.*## "} /^[a-zA-Z_-]+:.*## / {printf "  \033[1m%-16s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# --- Sviluppo -----------------------------------------------------------------

install: ## Installa le dipendenze (pnpm)
	pnpm install

dev: ## Sito + CMS locale senza login su http://localhost:4321 (serve un terminale interattivo)
	pnpm dev

build: ## Build di produzione (admin Tina + Astro + server)
	pnpm build

start: build ## Build e avvio in modalità produzione su http://localhost:3000 (usa il .env)
	PORT=$(PORT) pnpm start:local

check: ## Controllo dei tipi (astro check + tsc del server)
	pnpm check

lint: ## Lint con Biome
	pnpm lint

format: ## Formatta il codice con Biome
	pnpm format

env: ## Crea il .env da .env.example (se non esiste già)
	@test -f $(ENV_FILE) && echo "$(ENV_FILE) esiste già, non lo tocco" || (cp .env.example $(ENV_FILE) && echo "Creato $(ENV_FILE): compila almeno TINA_ADMIN_PASSWORD, NEXTAUTH_SECRET e GITHUB_*")

# --- Docker (stessa immagine del deploy su Coolify) ----------------------------

docker-build: ## Costruisce l'immagine Docker
	docker build -t $(IMAGE) .

docker-up: docker-build ## Costruisce e (ri)avvia il container su http://localhost:3000
	@test -f $(ENV_FILE) || (echo "Manca $(ENV_FILE): esegui 'make env' e compilalo" && exit 1)
	-@docker rm -f $(CONTAINER) >/dev/null 2>&1
	docker run -d --name $(CONTAINER) --env-file $(ENV_FILE) -p $(PORT):3000 -v $(VOLUME):/data $(IMAGE)
	@echo "Sito: http://localhost:$(PORT)  ·  CMS: http://localhost:$(PORT)/admin/index.html"

docker-down: ## Ferma e rimuove il container (il volume con DB e utenti resta)
	-docker rm -f $(CONTAINER)

docker-restart: ## Riavvia il container senza ricostruire l'immagine
	docker restart $(CONTAINER)

docker-logs: ## Segue i log del container
	docker logs -f $(CONTAINER)

docker-shell: ## Apre una shell nel container
	docker exec -it $(CONTAINER) sh

docker-reset: docker-down ## Come docker-down, ma cancella anche il volume (DB e utenti del CMS)
	-docker volume rm $(VOLUME)

docker-clean: docker-reset ## Rimuove container, volume e immagine
	-docker rmi $(IMAGE)
