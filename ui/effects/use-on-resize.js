import { useEffect } from 'react';
import debounce from 'util/debounce';

export function useOnResize(cb) {
  const isWindowClient = typeof window === 'object';

  useEffect(() => {
    if (isWindowClient) {
      debounce(cb, 100)();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleResize = debounce(cb, 100);

    if (isWindowClient) {
      window.addEventListener('resize', handleResize);

      return () => window.removeEventListener('resize', handleResize);
    }
  }, [isWindowClient, cb]);
}
