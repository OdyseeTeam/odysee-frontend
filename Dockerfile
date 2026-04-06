# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=22-slim

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS build

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV CI=true
ENV GIT_TERMINAL_PROMPT=0

RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates && \
    rm -rf /var/lib/apt/lists/* && \
    corepack enable && \
    pnpm config set store-dir /pnpm/store

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY web/package.json web/pnpm-lock.yaml ./web/

# Fix git dep SSH URL in lockfile -> HTTPS for Docker builds
RUN sed -i 's|git@github.com:|https://github.com/|g' pnpm-lock.yaml

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm fetch --frozen-lockfile

COPY . .

RUN sed -i 's|git@github.com:|https://github.com/|g' pnpm-lock.yaml

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install --frozen-lockfile

# Build args baked into the frontend bundle at compile time.
# Most site config comes from `.env.defaults`, which Vite loads during build.
ARG NODE_ENV=production
ARG COMMIT_ID=
ARG BUILD_REV=

ENV NODE_ENV=$NODE_ENV
ENV COMMIT_ID=$COMMIT_ID
ENV BUILD_REV=$BUILD_REV

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm build

# ── Stage 2: Server Deps ──────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS web-deps

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV CI=true

RUN corepack enable && pnpm config set store-dir /pnpm/store

WORKDIR /app/web

COPY web/package.json web/pnpm-lock.yaml ./

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install --prod --frozen-lockfile && \
    pnpm store prune && \
    rm -rf /tmp/* /root/.cache

# ── Stage 3: Runtime ──────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS runtime

RUN groupadd -r odysee && useradd -r -g odysee odysee

WORKDIR /app

COPY --from=web-deps --chown=odysee:odysee /app/web/node_modules web/node_modules

# Copy root-level node_modules deps needed by server (config.cjs, lbry.js)
# Root-level node_modules needed by server code (config.cjs, lbry.js, rss.js, googleVideo.js)
COPY --from=build --chown=odysee:odysee /app/node_modules/dotenv-defaults node_modules/dotenv-defaults
COPY --from=build --chown=odysee:odysee /app/node_modules/dotenv node_modules/dotenv
COPY --from=build --chown=odysee:odysee /app/node_modules/proxy-polyfill node_modules/proxy-polyfill
COPY --from=build --chown=odysee:odysee /app/node_modules/dayjs node_modules/dayjs
COPY --from=build --chown=odysee:odysee /app/node_modules/rss node_modules/rss
COPY --from=build --chown=odysee:odysee /app/node_modules/xml node_modules/xml
COPY --from=build --chown=odysee:odysee /app/node_modules/mime-types node_modules/mime-types
COPY --from=build --chown=odysee:odysee /app/node_modules/mime-db node_modules/mime-db

# Built frontend assets from build stage
COPY --from=build --chown=odysee:odysee /app/web/dist web/dist

# Web server code
COPY --chown=odysee:odysee web/cluster.js web/
COPY --chown=odysee:odysee web/index.js web/lbry.js web/
COPY --chown=odysee:odysee web/src web/src
COPY --chown=odysee:odysee web/middleware web/middleware
COPY --chown=odysee:odysee web/setup web/setup
COPY --chown=odysee:odysee web/static web/static

# Server-side root dependencies (required via ../ imports)
COPY --chown=odysee:odysee config.cjs .env.defaults ./
COPY --chown=odysee:odysee llms.txt ./
COPY --chown=odysee:odysee ui/util/web.cjs ui/util/
COPY --chown=odysee:odysee ui/constants/pages.cjs ui/constants/
COPY --chown=odysee:odysee custom/homepages custom/homepages
COPY --chown=odysee:odysee static static
USER odysee

ENV NODE_ENV=production
ENV WEB_SERVER_PORT=1337
EXPOSE 1337

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:1337').then(r=>{process.exit(r.ok?0:1)}).catch(()=>process.exit(1))"

CMD ["node", "web/cluster.js"]
