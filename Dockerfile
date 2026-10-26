# Astro (SSR) + TinaCMS self-hosted in un solo container.
# Runtime: node dist/server.mjs (Express: /api/tina → backend Tina, resto → Astro).

FROM node:24-bookworm-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN npm install -g pnpm@11.5.1
WORKDIR /app

# ---- deps: node_modules completo (dev incluse, servono per la build) ----
FROM base AS deps
# toolchain di riserva se manca il prebuilt di better-sqlite3
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ---- build: admin Tina + Astro + server bundle ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# la build non indicizza (--skip-indexing) ma apre comunque il db: usa un file temporaneo
ENV TINA_DB_PATH=/tmp/tina-build.db
RUN pnpm run build

# ---- prod deps: senza devDependencies ----
FROM deps AS prod-deps
RUN pnpm prune --prod

# ---- runner ----
FROM base AS runner
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000 TINA_DB_PATH=/data/tina.db
RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs --home /app app \
  && mkdir -p /data && chown app:nodejs /data
COPY --from=prod-deps --chown=app:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=app:nodejs /app/package.json ./package.json
COPY --from=builder --chown=app:nodejs /app/dist ./dist
COPY --from=builder --chown=app:nodejs /app/content ./content
COPY --from=builder --chown=app:nodejs /app/tina/tina-lock.json ./tina/tina-lock.json
COPY --from=builder --chown=app:nodejs /app/tina/__generated__/_schema.json /app/tina/__generated__/_graphql.json /app/tina/__generated__/_lookup.json ./tina/__generated__/
USER app
VOLUME ["/data"]
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/server.mjs"]
