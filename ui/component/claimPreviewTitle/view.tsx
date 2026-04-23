import React from 'react';
import TruncatedText from 'component/common/truncated-text';
import { stripLeadingAtSign } from 'util/string';
import { useAppSelector } from 'redux/hooks';
import { selectTitleForUri, selectClaimForUri } from 'redux/selectors/claims';
type Props = {
  uri: string;
};

function ClaimPreviewTitle(props: Props) {
  const { uri } = props;
  const claim = useAppSelector((state) => selectClaimForUri(state, uri, false));
  const title = useAppSelector((state) => selectTitleForUri(state, uri));
  return (
    <div className="claim-preview__title">
      {claim ? (
        <TruncatedText text={title || stripLeadingAtSign(claim.name)} lines={2} />
      ) : (
        <span>{__('Nothing here')}</span>
      )}
    </div>
  );
}

export default React.memo(ClaimPreviewTitle);
