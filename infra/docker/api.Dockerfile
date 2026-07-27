# Multi-stage build for @vittamhub/api. Run from the monorepo root:
#   docker build -f infra/docker/api.Dockerfile -t vittamhub-api .

FROM node:20.11-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile --filter @vittamhub/api...
RUN pnpm --filter @vittamhub/api db:generate
RUN pnpm exec turbo run build --filter=@vittamhub/api
# `pnpm deploy` produces a self-contained output directory with real files
# (not workspace symlinks into the pnpm store), which is what a container
# needs -- avoids the whole class of "forgot to copy one more node_modules"
# bugs that manual multi-COPY runtime stages are prone to.
RUN pnpm --filter @vittamhub/api deploy --prod /out
# `pnpm deploy` rebuilds node_modules from package.json's production deps,
# which drops the .prisma/client engine artifact `db:generate` produced
# earlier into this stage's own node_modules -- copy it across rather than
# regenerating (regenerating here would resolve a fresh, unpinned `prisma`
# via npx, since the prod-only prune drops the devDependency).
RUN SRC="$(find -L /repo -type d -path '*/node_modules/.prisma/client' | head -1)" && \
    test -n "$SRC" && \
    for RAW_DEST in $(find /out -type d -path '*/node_modules/@prisma/client'); do \
      DEST_PARENT="$(dirname "$(dirname "$RAW_DEST")")" && \
      echo "copying $SRC -> $DEST_PARENT/.prisma/client" && \
      rm -rf "$DEST_PARENT/.prisma" && \
      mkdir -p "$DEST_PARENT/.prisma" && \
      cp -RL "$SRC" "$DEST_PARENT/.prisma/client"; \
    done && \
    find /out -path '*/.prisma/client/default.js'

FROM node:20.11-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S vittamhub && adduser -S vittamhub -G vittamhub
COPY --from=build /out/dist ./dist
COPY --from=build /out/node_modules ./node_modules
COPY --from=build /out/src/database/prisma ./src/database/prisma
USER vittamhub
EXPOSE 4000
CMD ["node", "dist/src/main.js"]
