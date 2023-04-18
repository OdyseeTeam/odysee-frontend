// @flow
import React from 'react';
import DateTimeClaim from 'component/dateTimeClaim';
import FileViewCount from 'component/fileViewCount';
import FileActions from 'component/fileActions';
import FileVisibility from 'component/fileVisibility';
import ClaimPreviewReset from 'component/claimPreviewReset';
import LivestreamDateTime from 'component/livestreamDateTime';
import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';

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
          <Icon icon={ICONS.TIME} />
          {isLivestreamClaim && <LivestreamDateTime uri={uri} />}
          {!isLivestreamClaim && <DateTimeClaim uri={uri} format="date-only" disableFromNowFormat />}
          <Icon icon={ICONS.INVITE} />
          {contentUnlocked && <FileViewCount uri={uri} />}
          <FileVisibility uri={uri} />
        </div>

        <FileActions uri={uri} hideRepost={isLivestreamClaim} livestream={isLivestreamClaim} />
      </div>

      {isLivestreamClaim && isLive && <ClaimPreviewReset uri={uri} />}
    </>
  );
}

export default FileSubtitle;
