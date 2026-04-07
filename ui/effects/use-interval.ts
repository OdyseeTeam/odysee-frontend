import { useRef, useEffect } from 'react';
export default function useInterval(callback: (() => void) | undefined, delay: number | null) {
  const savedCallback = useRef<(() => void) | undefined>();
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  useEffect(() => {
    const tick = () => {
      savedCallback.current?.();
    };

    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}
