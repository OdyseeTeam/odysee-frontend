// @flow
import React from 'react';
import Button from 'component/button';

type Props = {
  claimId: string,
  doAllowAgeRestrictedContent: (claimId: string) => void,
};

const AgeRestricedContentOverlay = (props: Props) => {
  const { claimId, doAllowAgeRestrictedContent } = props;

  return (
    <div className="age-restricted-content-overlay">
      <span>
        {__(
          'The following content is intended for Mature Audiences aged 18 years and over. Viewer discretion is advised.'
        )}
      </span>

      <Button button="primary" label={__('View Content')} onClick={() => doAllowAgeRestrictedContent(claimId)} />
    </div>
  );
};

export default AgeRestricedContentOverlay;
