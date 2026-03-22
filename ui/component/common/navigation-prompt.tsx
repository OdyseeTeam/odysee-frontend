import * as React from 'react';
import { useBlocker } from 'react-router-dom';

type Props = { when: boolean; message: string };

export function NavigationPrompt(props: Props) {
  const { when, message } = props;
  const blocker = useBlocker(when);

  React.useEffect(() => {
    if (blocker.state === 'blocked') {
      if (window.confirm(message)) {
        setTimeout(blocker.proceed, 0);
      } else {
        blocker.reset();
      }
    }
  }, [blocker, message]);

  React.useEffect(() => {
    if (blocker.state === 'blocked' && !when) {
      blocker.reset();
    }
  }, [blocker, when]);

  return null;
}
