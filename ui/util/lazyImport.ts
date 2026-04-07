import React from 'react';
import * as ACTIONS from 'constants/action_types';
import { reloadOnceForDynamicImportError } from 'util/importFailure';
const RETRY_DELAY_MS = 3000;
const RETRY_ATTEMPTS = 5;

type LazyComponentImport<T extends React.ComponentType<any> = React.ComponentType<any>> = () => Promise<{ default: T }>;

function componentLoader<T extends React.ComponentType<any>>(
  lazyComponent: LazyComponentImport<T>,
  attemptsLeft: number
): Promise<{ default: T }> {
  return new Promise((resolve, reject) => {
    lazyComponent()
      .then(resolve)
      .catch((error) => {
        if (reloadOnceForDynamicImportError(error)) {
          return;
        }

        setTimeout(() => {
          if (attemptsLeft === 1) {
            window.store.dispatch({
              type: ACTIONS.RELOAD_REQUIRED,
              data: {
                reason: 'lazyImportFailed',
                extra: error,
              },
            });
            console.error(error.message); // eslint-disable-line no-console
          } else {
            componentLoader(lazyComponent, attemptsLeft - 1).then(resolve, reject);
          }
        }, RETRY_DELAY_MS);
      });
  });
}

export function lazyImport<T extends React.ComponentType<any>>(
  componentImport: LazyComponentImport<T>
): React.LazyExoticComponent<T> {
  return React.lazy(() => componentLoader(componentImport, RETRY_ATTEMPTS));
}
