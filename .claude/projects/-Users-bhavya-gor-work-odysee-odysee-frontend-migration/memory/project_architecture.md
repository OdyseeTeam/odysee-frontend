---
name: Odysee Frontend Architecture
description: Tech stack, directory structure, build system, and key patterns for the Odysee frontend
type: project
---

**Tech stack:** React 18 + Redux 5 (RTK) + React Router 7 + Vite 8 + TypeScript 5.4 + Koa SSR + pnpm

**Key directories:**
- `ui/` - Main frontend: component/, page/, redux/ (actions/reducers/selectors/middleware), modal/, effects/, hocs/, constants/, util/, scss/
- `web/` - Koa server for SSR (CommonJS, port 1337)
- `electron/` - Desktop app integration
- `extras/` - lbryinc, recsys, lbry-first libraries
- `custom/` - Homepages, robots.txt
- `tests/` - Playwright E2E (6 projects: setup, chromium, auth, mobile, firefox, perf)

**28 Redux slices:** router, app, settings, claims, content, fileInfo, publish, collections, search, tags, shorts, comments, reactions, user, sync, rewards, wallet, stripe, arwallet, coinSwap, memberships, subscriptions, notifications, blocked, blacklist, filtered, livestream, stats

**Build patterns:**
- `@if TARGET='web'` / `@if TARGET='app'` preprocessor directives in source
- Vite plugins: uiModuleResolverPlugin, preprocessPlugin, providePlugin, ssrTemplatePlugin
- Path aliases: component/, redux/, constants/, types/, etc. all resolve to ui/ subdirs
- Global providers: Buffer, __() (i18n), assert()

**Commands:** `yarn dev` (dev server), `yarn build` (prod), `yarn check` (lint), `yarn test:e2e` (Playwright)

**How to apply:** Use these patterns when making changes. Import paths use bare aliases (e.g., `import X from 'component/foo'`), not relative paths through ui/.
