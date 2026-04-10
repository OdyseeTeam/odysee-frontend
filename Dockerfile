# syntax=docker/dockerfile:1.7

ARG BUN_VERSION=1.3.12

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM oven/bun:${BUN_VERSION} AS build

ENV CI=true
ENV GIT_TERMINAL_PROMPT=0

WORKDIR /app

COPY package.json bun.lock ./
COPY web/package.json ./web/

RUN --mount=type=cache,id=bun-cache,target=/root/.bun bun install --frozen-lockfile

COPY . .

RUN sed -i 's|git@github.com:|https://github.com/|g' bun.lock || true

RUN --mount=type=cache,id=bun-cache,target=/root/.bun bun install --frozen-lockfile

# Build args baked into the frontend bundle at compile time.
# Most site config comes from `.env.defaults`, which Vite loads during build.
ARG NODE_ENV=production
ARG COMMIT_ID=
ARG BUILD_REV=
ARG CUSTOM_HOMEPAGE=false

ENV NODE_ENV=$NODE_ENV
ENV COMMIT_ID=$COMMIT_ID
ENV BUILD_REV=$BUILD_REV
ENV CUSTOM_HOMEPAGE=$CUSTOM_HOMEPAGE

RUN bun run build

RUN mkdir -p web/dist/app-strings
COPY .tx .tx
ARG TX_TOKEN=
RUN if [ -n "$TX_TOKEN" ]; then \
      curl -sL https://github.com/transifex/cli/releases/latest/download/tx-linux-amd64.tar.gz | tar xz -C /usr/local/bin && \
      TX_TOKEN=$TX_TOKEN tx pull -a --force || true; \
    fi

# ── Stage 2: Server Deps ──────────────────────────────────────────────────────
FROM oven/bun:${BUN_VERSION} AS web-deps

ENV CI=true

WORKDIR /app/web

COPY web/package.json ./

RUN bun install --production --frozen-lockfile

# ── Stage 3: Runtime ──────────────────────────────────────────────────────────
FROM oven/bun:${BUN_VERSION} AS runtime

RUN groupadd -r odysee && useradd -r -g odysee odysee

WORKDIR /app

COPY --from=web-deps --chown=odysee:odysee /app/web/node_modules web/node_modules

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
  CMD bun -e "fetch('http://localhost:1337').then(r=>{process.exit(r.ok?0:1)}).catch(()=>process.exit(1))"

CMD ["bun", "web/cluster.js"]
