FROM node:20-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app
COPY . .

FROM base AS builder
RUN pnpm --filter icons-web --prod deploy pruned
RUN mv web/public/icons pruned/public/icons

WORKDIR pruned
RUN pnpm run build

FROM node:20-slim AS runtime

WORKDIR /app
COPY --from=builder /app/pruned/node_modules ./node_modules
COPY --from=builder /app/pruned/dist ./dist
COPY --from=builder /app/pruned/public ./public

ENV HOST=0.0.0.0
ENV PORT=80
EXPOSE 80

CMD node ./dist/server/entry.mjs