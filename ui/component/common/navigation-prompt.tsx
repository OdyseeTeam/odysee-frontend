import * as React from 'react';
import { browserHistory } from 'redux/router';

type Props = { when: boolean; message: string };

/**
 * Confirms in-app navigation when `when` is true. Uses the same `browserHistory`
 * instance as `HistoryRouter` (unlike react-router's unstable_usePrompt, which
 * requires createBrowserRouter / RouterProvider).
 */
export function NavigationPrompt(props: Props) {
  const { when, message } = props;

  React.useEffect(() => {
    if (!when) return undefined;

    const unblock = browserHistory.block((tx) => {
      if (window.confirm(message)) {
        unblock();
        tx.retry();
      }
    });

    return unblock;
  }, [when, message]);

  return null;
}
