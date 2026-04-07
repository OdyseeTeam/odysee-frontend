import React from 'react';
import { useAppSelector } from 'redux/hooks';
import { selectClaimForUri } from 'redux/selectors/claims';
import { selectContentPositionForUri } from 'redux/selectors/content';
type Props = {
  uri: string;
};
function ClaimPreviewProgress(props: Props) {
  const { uri } = props;
  const claim = useAppSelector((state) => selectClaimForUri(state, uri));
  const position = useAppSelector((state) => selectContentPositionForUri(state, uri));
  const duration = claim?.value?.video?.duration || claim?.value?.audio?.duration;

  if (!position || !duration) {
    return null;
  }

  return (
    <div className="claim-preview__progress-section">
      <div
        className="claim-preview__progress-bar"
        style={{
          width: `${(position / duration) * 100}%`,
        }}
      />
    </div>
  );
}

export default React.memo(ClaimPreviewProgress);
