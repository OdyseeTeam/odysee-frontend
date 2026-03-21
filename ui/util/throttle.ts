// Taken from underscore.js (slightly modified to add the getNow function and use const/let over var)
// https://github.com/jashkenas/underscore/blob/master/underscore.js#L830-L874
// Returns a function, that, when invoked, will only be triggered at most once
// during a given window of time. Normally, the throttled function will run
// as much as it can, without ever going more than once per `wait` duration;
// but if you'd like to disable the execution on the leading edge, pass
// `{leading: false}`. To disable execution on the trailing edge, ditto.
interface ThrottleOptions {
  leading?: boolean;
  trailing?: boolean;
}

interface ThrottledFunction {
  (...args: unknown[]): unknown;
  cancel: () => void;
}

const getNow = (): number => new Date().getTime();

export default function throttle(
  func: (...args: unknown[]) => unknown,
  wait: number,
  options: ThrottleOptions = {}
): ThrottledFunction {
  let timeout: ReturnType<typeof setTimeout> | null;
  let context: unknown;
  let args: unknown[] | null;
  let result: unknown;
  let previous: number = 0;

  const later = () => {
    previous = options.leading === false ? 0 : getNow();
    timeout = null;
    result = func.apply(context, args);

    if (!timeout) {
      context = null;
      args = null;
    }
  };

  const throttled = function throttled(...funcArgs) {
    const now = getNow();
    if (!previous && options.leading === false) previous = now;
    const remaining = wait - (now - previous);
    context = this; // eslint-disable-line no-this-alias
    args = funcArgs;

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }

      previous = now;
      result = func.apply(context, args);

      if (!timeout) {
        context = null;
        args = null;
      }
    } else if (!timeout && options.trailing !== false) {
      timeout = setTimeout(later, remaining);
    }

    return result;
  };

  throttled.cancel = () => {
    clearTimeout(timeout);
    previous = 0;
    timeout = null;
    context = null;
    args = null;
  };

  return throttled;
}
