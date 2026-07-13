# Multi-stage build for @vittamhub/api. Run from the monorepo root:
#   docker build -f infra/docker/api.Dockerfile -t vittamhub-api .

FROM node:20.11-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/api/package.json apps/api/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/utils/package.json packages/utils/package.json
COPY packages/config/package.json packages/config/package.json
RUN pnpm install --frozen-lockfile --filter @vittamhub/api...

FROM base AS build
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/api/node_modules ./apps/api/node_modules
COPY . .
RUN pnpm --filter @vittamhub/api db:generate
RUN pnpm --filter @vittamhub/api build

FROM node:20.11-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S vittamhub && adduser -S vittamhub -G vittamhub
COPY --from=build /repo/apps/api/dist ./dist
COPY --from=build /repo/apps/api/node_modules ./node_modules
COPY --from=build /repo/apps/api/src/database/prisma ./src/database/prisma
USER vittamhub
EXPOSE 4000
CMD ["node", "dist/main.js"]
