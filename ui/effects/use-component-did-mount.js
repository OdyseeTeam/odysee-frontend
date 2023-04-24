// @flow
import React from 'react';

export type EffectCallback = () => void | (() => void);

export default function useComponentDidMount(effectOnMount: EffectCallback) {
  assert(typeof effectOnMount === 'function');

  React.useEffect(() => {
    return effectOnMount();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- on mount only
  }, []);
}
