// @flow

export function assert(condition: any, msg: string = 'Assertion failed') {
  // @if FORCE_NO_ASSERTS='true'
  if (true) return; // eslint-disable-line no-constant-condition
  // @endif

  // Need to upgrade our preprocessor, currently doesn't have OR.

  // @if NODE_ENV!='production'
  doAssert(condition, msg);
  // @endif

  // @if IS_TEST_INSTANCE='true'
  doAssert(condition, msg);
  // @endif
}

function doAssert(condition: any, msg: string) {
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
}
