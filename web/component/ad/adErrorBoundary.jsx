/**
 * - Prevents uncaught ad errors from being propagated and shown as a "crash".
 * - Errors will still be reported to Sentry.
 * - JSX fallbacks to null (show nothing).
 */

// @flow
import React from 'react';
import * as Sentry from '@sentry/react';

const beforeCapture = (scope) => {
  scope.setTag('_origin', 'adErrorBoundary');
};

// ****************************************************************************
// ****************************************************************************

export type Props = {|
  type: 'tileA' | 'tileB' | 'sticky' | 'aboveComments',
  children: any,
|};

// ****************************************************************************
// ****************************************************************************

function AdErrorBoundary(props: Props) {
  const { type, children } = props;

  const handleError = React.useCallback(
    (err) => assert(false, `Suppressed uncaught Ad error from "${type}"`, err),
    [type]
  );

  return (
    <Sentry.ErrorBoundary fallback={null} beforeCapture={beforeCapture} onError={handleError}>
      {children}
    </Sentry.ErrorBoundary>
  );
}

export default AdErrorBoundary;
