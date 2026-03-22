import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import createRootReducer from './reducers';
import { createAnalyticsMiddleware } from 'redux/middleware/analytics';
import { populateAuthTokenHeader } from 'redux/middleware/auth-token';
import { createBulkThunkMiddleware, enableBatching } from 'redux/middleware/batch-actions';
import { initTabStateSync } from 'redux/middleware/tab-sync';
import { persistOptions } from 'redux/setup/persistedState';
import { sharedStateMiddleware } from 'redux/setup/sharedState';
import { tabStateSyncMiddleware } from 'redux/setup/tabState';
import { history, routerMiddleware } from 'redux/router';
let __pushBlocked = false;
const _nativePush = History.prototype.pushState;

History.prototype.pushState = function (state, title, url) {
  if (__pushBlocked) return;
  __pushBlocked = true;
  Promise.resolve().then(() => {
    __pushBlocked = false;
  });
  return _nativePush.call(this, state, title, url);
};

const rootReducer = createRootReducer();
const persistedReducer = persistReducer(persistOptions, rootReducer);

const PERSIST_ACTION_TYPES = [
  'persist/FLUSH',
  'persist/REHYDRATE',
  'persist/PAUSE',
  'persist/PERSIST',
  'persist/PURGE',
  'persist/REGISTER',
];

const store = configureStore({
  reducer: enableBatching(persistedReducer),
  preloadedState: {},
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // persist/PERSIST carries function refs (rehydrate, register);
        // BATCH_ACTIONS carries an array of action objects/thunks.
        ignoredActions: [...PERSIST_ACTION_TYPES, 'BATCH_ACTIONS'],
        ignoredActionPaths: ['register', 'rehydrate', 'payload.register', 'payload.rehydrate', 'actions'],
        ignoredPaths: ['_persist'],
      },
      // Many legacy reducers use Object.assign spread patterns that are
      // mutation-safe but still trip the check. Enable once the remaining
      // reducers are converted to createSlice / Immer.
      immutableCheck: false,
    })
      .prepend(sharedStateMiddleware, populateAuthTokenHeader, routerMiddleware())
      // RTK already includes thunk in getDefaultMiddleware()
      .concat(createBulkThunkMiddleware(), createAnalyticsMiddleware(), tabStateSyncMiddleware),
  devTools: process.env.NODE_ENV !== 'production',
});

initTabStateSync(store);
const persistor = persistStore(store);
window.persistor = persistor;
export { store, persistor, history };
