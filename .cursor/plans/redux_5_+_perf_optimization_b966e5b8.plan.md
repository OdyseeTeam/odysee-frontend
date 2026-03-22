---
name: Redux 5 + Perf Optimization
overview: Integrate React Scan as a dev-only performance harness with Playwright-based perf tests, migrate Redux 3.7.2 to Redux 5 via RTK's configureStore, and optimize render performance guided by the tooling.
todos:
  - id: phase1a
    content: 'Make React Scan dev-only: remove script from index.html, add Vite plugin'
    status: pending
  - id: phase1b
    content: Create Playwright perf fixture (tests/fixtures/perf.ts)
    status: pending
  - id: phase1c
    content: Create baseline perf tests and add perf project to playwright.config.ts
    status: pending
  - id: phase2a
    content: 'Upgrade deps: @reduxjs/toolkit, redux@5, redux-persist@6, redux-thunk@3'
    status: pending
  - id: phase2b
    content: Migrate ui/store.ts to configureStore
    status: pending
  - id: phase2c
    content: Fix redux-persist v6 imports in persistedState.ts
    status: pending
  - id: phase2d
    content: 'Add typed hooks: ui/redux/hooks.ts + ui/redux/types.ts'
    status: pending
  - id: phase2e
    content: Handle redux-state-sync compatibility (replace if needed)
    status: pending
  - id: phase2f
    content: Validate migration with perf tests — no regressions
    status: pending
  - id: phase3a
    content: Run React Scan + Playwright to identify hot components
    status: pending
  - id: phase3b
    content: 'Memoize: selector narrowing, React.memo, createCachedSelector'
    status: pending
  - id: phase3c
    content: Convert shorts, blocked, tags reducers to createSlice
    status: pending
  - id: phase3d
    content: Final perf comparison against baselines
    status: pending
isProject: false
---

# Redux 5 Migration + React Performance Optimization

## Current State

- **Redux 3.7.2**, redux-persist 5.10.0, redux-thunk 2.x, React 18.3.1
- **337 `connect()` components**, 0 RTK usage, 0 hooks-based Redux
- **28 state slices**, 17 using custom `handleActions`, rest using object-of-handlers
- **React Scan** installed (devDependency `^0.5.3`), CDN script in `index.html` (leaks into prod builds)
- **Playwright** configured with page objects, 5 projects, tests under `tests/specs/`
- **Custom middleware chain** (7 middleware in order): sharedState, authToken, router, thunk, bulkThunk, analytics, tabSync
- `**enableBatching`\*\* wraps root reducer for `BATCH_ACTIONS` support
- `**redux-state-sync@3.1.4**` for tab sync — potential Redux 5 incompatibility

## Phase 1: React Scan + Playwright Perf Harness

### 1a. Make React Scan dev-only

- Remove the hardcoded `<script>` tag from `index.html` line 4
- Add a Vite `transformIndexHtml` plugin in `vite.config.mjs` that injects the React Scan script only in dev mode (`ctx.server` is truthy)

### 1b. Playwright perf fixture

- Create `tests/fixtures/perf.ts` — extends the existing fixture system in `tests/fixtures/index.ts`
- Exposes a `PerfFixture` class that can capture render counts via `window.__REACT_SCAN__` or React DevTools internals
- Methods: `captureRenderSnapshot()`, `getSlowComponents(threshold)`

### 1c. Baseline perf tests

- Create `tests/specs/perf/home-perf.spec.ts`
- Add a `perf` project to `playwright.config.ts`
- Benchmark 4 key flows: home page load, home-to-watch navigation, search, infinite scroll
- Output: render count baselines per flow

## Phase 2: Redux 3 to 5 Migration

### 2a. Upgrade dependencies

```
pnpm add @reduxjs/toolkit redux@^5.0.0 redux-thunk@^3.0.0 redux-persist@^6.0.0
```

- Check `redux-state-sync@3.1.4` against Redux 5 — if broken, replace with a custom BroadcastChannel middleware (the existing `ui/redux/middleware/tab-sync.ts` is already a thin wrapper)

### 2b. Migrate `ui/store.ts`

Replace `createStore + applyMiddleware + compose` with RTK's `configureStore`:

- `reducer: enableBatching(persistedReducer)` — `enableBatching` in `ui/redux/middleware/batch-actions.ts` is a plain reducer wrapper, version-agnostic
- Middleware via `getDefaultMiddleware()` with `.prepend()` / `.concat()` to preserve ordering
- Disable `serializableCheck` for persist/batch actions, disable `immutableCheck` initially
- RTK includes thunk by default — remove manual thunk from array
- Keep `devTools: process.env.NODE_ENV !== 'production'` (replaces manual `__REDUX_DEVTOOLS_EXTENSION_COMPOSE__`)

### 2c. Fix redux-persist v6 imports

- In `ui/redux/setup/persistedState.ts`, simplify the `autoMergeLevel2` and `createCompressor` imports (v6 uses proper ESM)

### 2d. Add typed hooks

- Create `ui/redux/types.ts` — `RootState`, `AppDispatch` types derived from `store`
- Create `ui/redux/hooks.ts` — `useAppSelector`, `useAppDispatch` typed hooks
- These are additive; no existing code needs to change

### 2e. Validate with perf tests

- Re-run Phase 1 perf tests to confirm no regressions in render counts, persistence, tab sync, and batch actions

## Phase 3: Render Optimization

### 3a. Identify hot components via React Scan

Likely culprits based on architecture:

- `ClaimPreviewTile` / `ClaimPreview` — re-render on any claim state change
- `Header` — re-renders on every route change
- `VideoRenderFloating` — re-renders on unrelated state changes
- `CommentCreate` — broad state subscriptions

### 3b. Optimization techniques

- **Selector narrowing** — ensure `select` functions in `index.ts` files only pull minimal state
- `**React.memo`\*\* — wrap pure-render components, add custom comparators for object/array props
- `**createCachedSelector**` — expand usage for URI/ID-parameterized selectors (replace `makeSelect*` factories)

### 3c. Convert starter reducers to `createSlice`

In order of complexity (simplest first):

1. `shorts` (4 keys) — proof of concept
2. `blocked` (3 keys)
3. `tags` (2 keys)
4. `content` (7 keys, high traffic) — first real win

Each conversion: replace `handleActions` from `ui/util/redux-utils.ts` with `createSlice`, getting Immer + auto-generated actions.

### 3d. Final perf comparison

Re-run all perf tests, compare render counts against Phase 1 baselines.

## Files to Create/Modify

| File                                 | Action                                                          |
| ------------------------------------ | --------------------------------------------------------------- |
| `index.html`                         | Remove React Scan script (line 4)                               |
| `vite.config.mjs`                    | Add dev-only React Scan plugin                                  |
| `tests/fixtures/perf.ts`             | NEW — perf fixture                                              |
| `tests/specs/perf/home-perf.spec.ts` | NEW — baseline perf tests                                       |
| `playwright.config.ts`               | Add `perf` project                                              |
| `package.json`                       | Upgrade redux, redux-persist, redux-thunk; add @reduxjs/toolkit |
| `ui/store.ts`                        | Migrate to configureStore                                       |
| `ui/redux/setup/persistedState.ts`   | Simplify v6 imports                                             |
| `ui/redux/hooks.ts`                  | NEW — typed hooks                                               |
| `ui/redux/types.ts`                  | NEW — RootState/AppDispatch                                     |
| `ui/redux/middleware/tab-sync.ts`    | Potentially replace redux-state-sync                            |
| `ui/redux/reducers/shorts.ts`        | Convert to createSlice                                          |
| `ui/redux/reducers/blocked.ts`       | Convert to createSlice                                          |
| `ui/redux/reducers/tags.ts`          | Convert to createSlice                                          |

## Key Risks

- `**redux-state-sync**` may not support Redux 5 — fallback is a ~30-line custom BroadcastChannel middleware
- `**redux-persist` v5 to v6\*\* — mostly API-compatible but import paths changed; the existing default-export workarounds should simplify
- `**enableBatching`\*\* — confirmed compatible (plain function, no Redux API dependency)
- **All 7 custom middleware** — confirmed compatible with RTK's `configureStore` middleware API
- **337 `connect()` calls** — no changes needed for Redux 5; hooks migration is optional/incremental
