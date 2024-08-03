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

FROM nginx:alpine AS runtime
COPY web/nginx.conf /etc/nginx/nginx.conf

COPY --from=builder /app/pruned/dist /usr/share/nginx/html

EXPOSE 80