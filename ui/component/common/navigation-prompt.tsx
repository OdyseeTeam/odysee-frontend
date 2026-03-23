import * as React from 'react';

type Props = { when: boolean; message: string };

/**
 * Warns the user before navigating away when `when` is true.
 * Uses `beforeunload` for tab close/refresh (browser shows its own dialog).
 * For in-app navigation, we don't block because `<BrowserRouter>` doesn't
 * support `useBlocker` (that requires a data router). The beforeunload
 * handler still catches accidental tab closes while editing.
 */
export function NavigationPrompt(props: Props) {
  const { when, message } = props;

  React.useEffect(() => {
    if (!when) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [when, message]);

  return null;
}
