import React from 'react';
export default function useCombinedRefs(...refs) {
  // Store refs in a mutable ref so the callback is stable
  const refsRef = React.useRef(refs);
  refsRef.current = refs;

  return React.useCallback((node) => {
    refsRef.current.forEach((ref) => {
      if (!ref) return;
      if (typeof ref === 'function') {
        ref(node);
      } else {
        ref.current = node;
      }
    });
  }, []);
}
