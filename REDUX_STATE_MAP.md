# Odysee Frontend — Redux State Map & Redux 5 Upgrade Guide

## Current Versions

| Package         | Installed | Latest Stable          | Gap         |
| --------------- | --------- | ---------------------- | ----------- |
| `redux`         | `^3.6.0`  | `5.0.x`                | **2 major** |
| `react-redux`   | `8.1.3`   | `9.x`                  | 1 major     |
| `redux-persist` | `^5.10.0` | `6.x`                  | 1 major     |
| `redux-thunk`   | `^2.2.0`  | `3.x` (bundled w/ RTK) | 1 major     |
| `reselect`      | `^5.1.1`  | `5.x`                  | current     |
| `re-reselect`   | `^4.0.0`  | `4.x`                  | current     |

---

## Props Destructuring Audit (completed)

**8 files fixed** — Components were taking `props: Props` without destructuring, causing `ReferenceError` at runtime:

| File                                     | Component          |
| ---------------------------------------- | ------------------ |
| `ui/component/commentCreate/view.tsx`    | `CommentCreate`    |
| `ui/component/channelSelector/view.tsx`  | `ChannelSelector`  |
| `ui/component/commentReactions/view.tsx` | `CommentReactions` |
| `ui/component/syncPassword/view.tsx`     | `SyncPassword`     |
| `ui/component/userSignUp/view.tsx`       | `UserSignUp`       |
| `ui/page/arAccount/view.tsx`             | `ArAccount`        |
| `ui/page/buyOnRamper/view.tsx`           | `BuyOnRamper`      |
| `ui/page/paymentAccount/view.tsx`        | `PaymentAccount`   |

---

## Store Configuration (`ui/store.ts`)

```
createStore(enableBatching(persistedReducer), {}, composeEnhancers(applyMiddleware(...)))
```

**Middleware chain (order matters):**

1. `sharedStateMiddleware` — cross-tab shared state sync
2. `populateAuthTokenHeader` — injects auth token into API calls
3. `routerMiddleware()` — custom router ↔ Redux sync
4. `thunk` — async action creators
5. `createBulkThunkMiddleware()` — `BATCH_ACTIONS` support
6. `createAnalyticsMiddleware()` — analytics event tracking
7. `tabStateSyncMiddleware` — tab state synchronization

**Persistence:** `redux-persist` with `localForage`, `autoMergeLevel2`, compression transform.

**Custom patterns:**

- `enableBatching` wraps root reducer to support `BATCH_ACTIONS`
- Custom `routerReducer` + `routerMiddleware` (replaces `connected-react-router`)
- `History.prototype.pushState` monkey-patched to debounce duplicate pushes

---

## State Shape — All 28 Slices

### Core Application

| Slice      | Reducer Path                 | Persisted                         | Key State                                                                                                    |
| ---------- | ---------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `router`   | `redux/router.ts`            | No                                | `{ action, location }`                                                                                       |
| `app`      | `redux/reducers/app.ts`      | Partial                           | `activeChannel`, `incognito`, `volume`, `muted`, `modal/modalProps`, `scrollHistory`, `mainPlayerDimensions` |
| `settings` | `redux/reducers/settings.ts` | Yes (blacklist `loadedLanguages`) | `clientSettings`, `daemonSettings`, `sharedPreferences`, `isNight`                                           |

### Content & Claims

| Slice         | Reducer Path                    | Persisted                | Key State                                                                                                  |
| ------------- | ------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `claims`      | `redux/reducers/claims.ts`      | Partial (`pendingById`)  | `byId`, `claimsByUri` (normalized), `claimSearchByQuery`, `myChannelClaimsById`, `myClaims`, `myPurchases` |
| `content`     | `redux/reducers/content.ts`     | Partial                  | `primaryUri`, `playingUri`, `positions`, `history`, `uriAccessKeys`                                        |
| `fileInfo`    | `redux/reducers/file_info.ts`   | Partial (sort prefs)     | `byOutpoint`, `pendingByOutpoint`, `downloadingByOutpoint`                                                 |
| `publish`     | `redux/reducers/publish.ts`     | Yes                      | Full publish form state: `title`, `description`, `thumbnail`, `channel`, `bid`, `tags`, `currentUploads`   |
| `collections` | `redux/reducers/collections.ts` | Partial                  | `builtin` (watchlater/favorites/queue), `unpublished`, `edited`, `savedIds`                                |
| `search`      | `redux/reducers/search.ts`      | Partial (`options`)      | `resultsByQuery`, `searching`, `mentionQuery`, `personalRecommendations`                                   |
| `tags`        | `redux/reducers/tags.ts`        | Partial (`followedTags`) | `followedTags`, `knownTags`                                                                                |
| `shorts`      | `redux/reducers/shorts.ts`      | No                       | `sidePanelOpen`, `viewMode`, `autoplayNextShort`, `playlist`                                               |

### Social & Comments

| Slice       | Reducer Path                  | Persisted | Key State                                                                                                                               |
| ----------- | ----------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `comments`  | `redux/reducers/comments.ts`  | No        | `commentById`, `byId` (by claim), `repliesByParentId`, `superChatsByUri`, `pinnedCommentsById`, `settingsByChannelId`, moderation state |
| `reactions` | `redux/reducers/reactions.ts` | No        | `reactionsById`, `fetchingReactions`                                                                                                    |

### User & Auth

| Slice     | Reducer Path                | Persisted | Key State                                                                                                          |
| --------- | --------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------ |
| `user`    | `redux/reducers/user.ts`    | No        | `user`, `emailToVerify`, `passwordSetSuccess`, `invitees`, `referralCode`, `youtubeChannelImportPending`, `locale` |
| `sync`    | `redux/reducers/sync.ts`    | No        | `hasSyncedWallet`, `syncHash`, `prefsReady`, `syncLocked`                                                          |
| `rewards` | `redux/reducers/rewards.ts` | No        | `claimedRewardsById`, `unclaimedRewards`, `claimPendingByType`                                                     |

### Payments & Wallet

| Slice      | Reducer Path                 | Persisted                  | Key State                                                                                          |
| ---------- | ---------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------- |
| `wallet`   | `redux/reducers/wallet.ts`   | Partial (`receiveAddress`) | `balance`, `transactions`, `supports`, `draftTransaction`, `txoPage`, `pendingSupportTransactions` |
| `stripe`   | `redux/reducers/stripe.ts`   | No                         | `canReceiveFiatTipsById`, `accountStatus`, `customerStatus`, payment history                       |
| `arwallet` | `redux/reducers/arwallet.ts` | No                         | `wallet`, `address`, `balance`, `exchangeRates`, `tippingStatusById`                               |
| `coinSwap` | `redux/reducers/coinSwap.ts` | Partial (`coinSwaps`)      | `coinSwaps[]`                                                                                      |

### Memberships

| Slice         | Reducer Path                    | Persisted | Key State                                                                                                                              |
| ------------- | ------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `memberships` | `redux/reducers/memberships.ts` | No        | `membershipMineByCreatorId`, `membershipListByCreatorId`, `myMembershipTiers`, `mySupportersList`, `protectedContentClaimsByCreatorId` |

### Subscriptions & Notifications

| Slice           | Reducer Path                      | Persisted | Key State                                                           |
| --------------- | --------------------------------- | --------- | ------------------------------------------------------------------- |
| `subscriptions` | `redux/reducers/subscriptions.ts` | Partial   | `subscriptions[]`, `following[]`                                    |
| `notifications` | `redux/reducers/notifications.ts` | No        | `notifications[]`, `notificationCategories`, `toasts[]`, `errors[]` |

### Moderation & Blocking

| Slice       | Reducer Path                | Persisted                   | Key State                           |
| ----------- | --------------------------- | --------------------------- | ----------------------------------- |
| `blocked`   | `redux/reducers/blocked.ts` | Partial (`blockedChannels`) | `blockedChannels`, `geoBlockedList` |
| `blacklist` | `lbryinc` (external)        | No                          | External package                    |
| `filtered`  | `lbryinc` (external)        | No                          | External package                    |

### Livestream

| Slice        | Reducer Path                   | Persisted | Key State                                                                                       |
| ------------ | ------------------------------ | --------- | ----------------------------------------------------------------------------------------------- |
| `livestream` | `redux/reducers/livestream.ts` | No        | `activeLivestreamByCreatorId`, `viewersById`, `socketConnectionById`, `isLivePollingChannelIds` |

### Stats

| Slice   | Reducer Path         | Persisted | Key State        |
| ------- | -------------------- | --------- | ---------------- |
| `stats` | `lbryinc` (external) | No        | External package |

---

## Connect Patterns

| Pattern                       | Count | Location                              |
| ----------------------------- | ----- | ------------------------------------- |
| `connect(select, perform)`    | ~337  | `*/index.ts` files                    |
| `useSelector` / `useDispatch` | 6     | Only in `ui/effects/use-ar-status.ts` |
| `createSlice` / RTK           | 0     | Not used                              |

**Standard pattern** (every connected component):

```typescript
// index.ts
const select = (state, props) => ({ ... });
const perform = { actionCreator1, actionCreator2 };
export default connect(select, perform)(Component);
```

---

## Reducer Patterns

| Pattern                  | Files                            | Notes                                                           |
| ------------------------ | -------------------------------- | --------------------------------------------------------------- |
| `handleActions` (custom) | 17 reducers                      | Custom util from `util/redux-utils`, similar to `redux-actions` |
| Object-of-handlers       | `app.ts`, `claims.ts`, `user.ts` | Manual `reducers[action.type]` dispatch                         |
| Plain function           | `router.ts`                      | Simple `if` statement                                           |

**Custom utilities** (`ui/util/redux-utils.ts`):

- `handleActions` — maps action types to handler functions
- `objSelectorEqualityCheck` — custom equality for object selectors
- `arrSelectorEqualityCheck` — custom equality for array selectors

---

## Selector Patterns

| Pattern                              | Usage                                                                                 |
| ------------------------------------ | ------------------------------------------------------------------------------------- |
| `createSelector` (reselect)          | Heavy use across all selector files                                                   |
| `createCachedSelector` (re-reselect) | `claims`, `collections`, `livestream`, `search`, `subscriptions`                      |
| `selectState` helper                 | Every selector file: `const selectState = (state) => state.sliceName`                 |
| Cross-slice selectors                | `claims` ↔ `blocked`, `stripe`, `user`; `content` ↔ `claims`, `wallet`, `memberships` |

---

## Redux 5 Upgrade — Risk Assessment

### Breaking Changes to Address

1. **`createStore` deprecated** → Replace with `configureStore` from `@reduxjs/toolkit`
   - Risk: **Medium** — `configureStore` covers middleware + enhancers, but custom `enableBatching` wrapper needs adaptation
   - Custom middleware chain must be preserved in order

2. **`redux-persist` ^5 → 6** compatibility
   - Risk: **Low-Medium** — API is mostly stable, but `autoMergeLevel2` import path changed
   - The current `autoMergeLevel2` import already handles default/named export: `(mod as any).default || mod`

3. **Custom router sync** (`redux/router.ts`)
   - Risk: **Low** — Self-contained, no dependency on Redux internals beyond `dispatch`
   - Already migrated away from `connected-react-router`

4. **`enableBatching` wrapper**
   - Risk: **Medium** — Wraps root reducer for `BATCH_ACTIONS` support
   - RTK's `configureStore` doesn't natively support this; needs to wrap reducer before passing

5. **`redux-thunk` ^2 → 3**
   - Risk: **Low** — v3 is bundled with RTK `configureStore`; standalone upgrade is compatible
   - Thunk middleware signature unchanged

6. **337 `connect()` calls**
   - Risk: **None for Redux 5** — `connect` is still supported in `react-redux` 8+
   - Migration to hooks is optional and can be incremental

### Recommended Upgrade Path

#### Phase 1: Redux 3 → 5 (store only)

1. Install `@reduxjs/toolkit` (includes Redux 5, thunk 3, reselect 5)
2. Replace `createStore` with `configureStore` in `store.ts`
3. Move `enableBatching` to reducer wrapper or custom middleware
4. Upgrade `redux-persist` to v6
5. Test persistence, batching, and middleware chain

#### Phase 2: Reducers → RTK slices (incremental)

- Start with smallest slices: `shorts`, `blocked`, `coinSwap`, `tags`
- Each slice migration is independent — can be done one at a time
- Replace `handleActions` with `createSlice` + Immer
- Action constants become auto-generated

#### Phase 3: Connect → Hooks (incremental, optional)

- New components use `useSelector` / `useDispatch`
- Existing components can be migrated opportunistically
- Typed hooks: `useAppSelector`, `useAppDispatch`

#### Phase 4: Async → createAsyncThunk (incremental)

- Replace manual `PENDING/SUCCESS/FAILURE` action patterns
- Biggest wins in: `user`, `claims`, `memberships`, `stripe`

### Migration Priorities (by risk/reward)

| Priority | Action                                                | Risk   | Reward                           |
| -------- | ----------------------------------------------------- | ------ | -------------------------------- |
| 1        | Upgrade `redux` to 5.x via RTK                        | Medium | Unblocks everything else         |
| 2        | Upgrade `redux-persist` to 6.x                        | Low    | Compatibility                    |
| 3        | Convert `shorts`, `tags`, `blocked` to `createSlice`  | Low    | Learn pattern on simple slices   |
| 4        | Convert `publish`, `app`, `settings` to `createSlice` | Medium | High-traffic slices, Immer helps |
| 5        | Convert `claims`, `comments` to `createSlice`         | High   | Largest/most complex slices      |
| 6        | Migrate `connect` → hooks                             | Low    | Better DX, optional              |
