// @flow

/**
 * 1. [ASSERTS_ENABLED] env enables or disables it on compile-time.
 * 2. [window.app.pause_asserts] is the runtime control (e.g. to temporarily disable it).
 *
 * @param condition
 * @param msg
 */
export function assert(condition: any, msg: string = 'Assertion failed') {
  // @if ASSERTS_ENABLED='true'
  if (!condition && !window.app.pause_asserts) {
    const error = new Error(msg);

    setTimeout(() => {
      // setTimeout is used here so that assert() will also work in reducers,
      // which aren't supposed to be dispatching events.
      window.app.store.dispatch({
        type: 'DEBUG_LOG',
        data: { append: true, info: error },
      });
    });

    console.error(error); // eslint-disable-line no-console
  }
  // @endif
}
