// @flow
import React from 'react';
import Nag from 'component/nag';

export default function NagNoUser() {
  return (
    <Nag
      type="error"
      message={__(
        'Account functions are currently disabled for a scheduled upgrade. Enjoy the content, and check back later today!'
      )}
      actionText={__('Refresh')}
      onClick={() => window.location.reload()}
    />
  );
}
