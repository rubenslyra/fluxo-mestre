# syntax=docker/dockerfile:1

FROM oven/bun:1.3.13-alpine AS build
WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

COPY . .
ARG VITE_BASE=/fluxolab/
RUN bun run build -- --base=${VITE_BASE}

FROM oven/bun:1.3.13-alpine AS runtime
RUN apk add --no-cache nginx

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production

COPY --from=build /app/dist ./dist
COPY --from=build /app/public /usr/share/nginx/html
COPY --from=build /app/dist/client /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/server.mjs ./docker/server.mjs
COPY docker/start.sh /usr/local/bin/start-fluxolab

RUN chmod +x /usr/local/bin/start-fluxolab

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz || exit 1

CMD ["start-fluxolab"]
