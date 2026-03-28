---
name: Odysee Frontend Migration Status
description: Major Flow-to-TypeScript + Webpack-to-Vite migration on the claude/flow-to-typescript-migration branch, 225 commits ahead of master
type: project
---

The odysee-frontend-migration repo is undergoing a massive modernization of the Odysee video streaming platform frontend.

**Branch:** `claude/flow-to-typescript-migration-59qwW` (225 commits ahead of master as of 2026-03-25)

**Migration scope completed on this branch:**

1. Flow -> TypeScript (all files converted, flow-typed/ removed)
2. Webpack -> Vite 8 (custom plugins for module resolution, preprocessing, SSR)
3. React 16 -> 18, react-redux 7 -> 9, Redux 3 -> 5 (RTK)
4. React Router v6 -> v7
5. All Redux connect() wrappers eliminated -> useAppSelector/useAppDispatch hooks
6. VideoJS upgraded to v10 with complete player rewrite (56 commits merged)
7. ESLint/Prettier/Flow removed -> Oxlint + TypeScript
8. Yarn -> pnpm 10.29.3
9. ~87% render performance improvement on home page (2M+ -> 268K renders)

**Why:** Full modernization of a legacy codebase to current standards.

**How to apply:** All work should target the migration branch. Master has diverged but has 0 commits ahead. TypeScript strict mode is OFF for migration compatibility. The branch is the future direction of the codebase.
