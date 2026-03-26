/**
 * Global Redux type aliases.
 *
 * These are used as bare types (no imports) across the entire codebase
 * in selectors, actions, and reducers.
 */

import type { RootState, AppDispatch } from 'redux/types';

declare global {
  /** Redux root state — shorthand used in every selector. */
  type State = RootState;

  /** Redux dispatch function — used in thunk action creators. */
  type Dispatch = AppDispatch;

  /** Redux getState function — used in thunk action creators. */
  type GetState = () => State;
}
