FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.20.0 --activate

# ── Builder ─────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/client/package.json packages/client/
COPY packages/server/package.json packages/server/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm --filter client build

# ── Runner ──────────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/client/package.json packages/client/
COPY packages/server/package.json packages/server/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile --prod --filter server --filter shared

COPY packages/server/src packages/server/src
COPY packages/shared packages/shared
COPY --from=builder /app/packages/client/dist packages/client/dist

ENV NODE_ENV=production
EXPOSE 3000
CMD ["pnpm", "start"]
