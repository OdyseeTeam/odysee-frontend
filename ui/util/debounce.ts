// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.

interface DebouncedFunction {
  (...args: unknown[]): void;
  cancel: () => void;
}

export default function debounce(
  func: (...args: unknown[]) => void,
  wait: number,
  immediate?: boolean
): DebouncedFunction {
  let timeout: ReturnType<typeof setTimeout> | null;

  const debounced = function () {
    const context = this; // eslint-disable-line no-this-alias
    const args = arguments;

    const later = () => {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };

    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  } as DebouncedFunction;

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced;
}
