import React from 'react';
import DateTimeClaim from 'component/dateTimeClaim';
import FileViewCount from 'component/fileViewCount';
import FileActions from 'component/fileActions';
import FileVisibility from 'component/fileVisibility';
import ClaimPreviewReset from 'component/claimPreviewReset';
import LivestreamDateTime from 'component/livestreamDateTime';
import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';
import { useAppSelector } from 'redux/hooks';
import { selectClaimForUri, selectIsStreamPlaceholderForUri } from 'redux/selectors/claims';
import { selectShouldShowLivestreamForUri } from 'redux/selectors/livestream';
import { selectNoRestrictionOrUserIsMemberForContentClaimId } from 'redux/selectors/memberships';
type Props = {
  uri: string;
};

function FileSubtitle(props: Props) {
  const { uri } = props;
  const claim = useAppSelector((state) => selectClaimForUri(state, uri));
  const contentUnlocked = useAppSelector(
    (state) => claim && selectNoRestrictionOrUserIsMemberForContentClaimId(state, claim.claim_id)
  );
  const isLivestreamClaim = useAppSelector((state) => selectIsStreamPlaceholderForUri(state, uri)) || false;
  const isLive = useAppSelector((state) => selectShouldShowLivestreamForUri(state, uri)) || false;
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
