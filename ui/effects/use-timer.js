// @flow
import { useState, useEffect } from 'react';

export default (millis: number = 2000) => {
  const [timeoutElapsed, setTimeoutELapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTimeoutELapsed(true), millis);
    return () => clearTimeout(timer);
  }, [millis]);

  return { timeoutElapsed };
};
