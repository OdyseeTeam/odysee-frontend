// @flow
import React from 'react';
import DateTime from 'component/dateTime';
import FileViewCount from 'component/fileViewCount';
import FileActions from 'component/fileActions';
import ClaimPreviewReset from 'component/claimPreviewReset';
import LivestreamDateTime from 'component/livestreamDateTime';

type Props = {
  uri: string,
  isLivestreamClaim?: boolean,
  isLive?: boolean,
  contentUnlocked: boolean,
};

function FileSubtitle(props: Props) {
  const { uri, isLivestreamClaim = false, isLive = false, contentUnlocked } = props;
  return (
    <>
      <div className="media__subtitle--between">
        <div className="file__viewdate">
          {isLivestreamClaim ? isLive && <LivestreamDateTime uri={uri} /> : <DateTime uri={uri} type="date" />}
          {contentUnlocked && <FileViewCount uri={uri} />}
        </div>

        <FileActions uri={uri} hideRepost={isLivestreamClaim} livestream={isLivestreamClaim} />
      </div>

      {isLivestreamClaim && isLive && <ClaimPreviewReset uri={uri} />}
    </>
  );
}

export default FileSubtitle;
