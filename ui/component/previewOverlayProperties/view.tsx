import * as ICONS from 'constants/icons';
import * as React from 'react';
import classnames from 'classnames';
import Icon from 'component/common/icon';
import FilePrice from 'component/filePrice';
import VideoDuration from 'component/videoDuration';
import LivestreamDateTime from 'component/livestreamDateTime';
import FileType from 'component/fileType';
import ClaimType from 'component/claimType';
import * as COL from 'constants/collections';
import { useAppSelector } from 'redux/hooks';
import { SCHEDULED_TAGS } from 'constants/tags';
import {
  selectClaimIsMine,
  selectClaimForUri,
  selectIsStreamPlaceholderForUri,
  selectIsUriUnlisted,
} from 'redux/selectors/claims';
import { selectIsActiveLivestreamForUri, selectViewersForId } from 'redux/selectors/livestream';
import { makeSelectFilePartlyDownloaded } from 'redux/selectors/file_info';
import { selectCollectionHasEditsForId } from 'redux/selectors/collections';
import { claimContainsTag } from 'util/claim';
type Props = {
  uri: string;
  pending?: boolean;
  isSubscribed: boolean;
  small: boolean;
  properties?: (arg0: Claim) => React.ReactNode | null | undefined;
  iconOnly: boolean;
  xsmall?: boolean;
  isLivestream?: boolean;
};
function PreviewOverlayProperties(props: Props) {
  const { uri, small = false, properties, pending, iconOnly, xsmall, isLivestream } = props;
  const claim = useAppSelector((state) => selectClaimForUri(state, uri));
  const claimId = claim && claim.claim_id;
  const isLivestreamClaim = useAppSelector((state) => selectIsStreamPlaceholderForUri(state, uri));
  const hasEdits = useAppSelector((state) => selectCollectionHasEditsForId(state, claimId));
  const downloaded = useAppSelector((state) => makeSelectFilePartlyDownloaded(uri)(state));
  const claimIsMine = useAppSelector((state) => selectClaimIsMine(state, claim));
  const isLivestreamActive = useAppSelector((state) =>
    isLivestreamClaim ? selectIsActiveLivestreamForUri(state, uri) : false
  );
  const isLivestreamScheduled = claimContainsTag(claim, SCHEDULED_TAGS.LIVE);
  const isUnlisted = useAppSelector((state) => selectIsUriUnlisted(state, uri));
  const livestreamViewerCount = useAppSelector((state) =>
    isLivestreamClaim && claim ? selectViewersForId(state, claim.claim_id) : undefined
  );
  const isCollection = claim && claim.value_type === 'collection';
  const claimLength = claim && claim.value && claim.value.claims && claim.value.claims.length;
  const isStream = claim && claim.value_type === 'stream';
  const size = small ? COL.ICON_SIZE : undefined;

  if (pending && isUnlisted) {
    return (
      <div
        className={classnames('claim-preview__overlay-properties', {
          '.claim-preview__overlay-properties--small': small,
        })}
      >
        {isUnlisted && <Icon icon={ICONS.COPY_LINK} size={13} />}
      </div>
    );
  }

  return (
    <div
      className={classnames('claim-preview__overlay-properties', {
        '.claim-preview__overlay-properties--small': small,
      })}
    >
      {isLivestreamActive ? (
        Number.isInteger(livestreamViewerCount) ? (
          <>
            <Icon icon={ICONS.LIVESTREAM_MONOCHROME} />
            <span className="livestream__viewer-count">
              {livestreamViewerCount} <Icon icon={ICONS.EYE} />
            </span>
          </>
        ) : (
          __('LIVE')
        )
      ) : typeof properties === 'function' ? (
        properties(claim)
      ) : xsmall ? (
        <>
          <VideoDuration uri={uri} />
          {isUnlisted && <Icon icon={ICONS.COPY_LINK} size={13} />}
          <FilePrice hideFree uri={uri} type="thumbnail" />
        </>
      ) : (
        <>
          {!isStream && <ClaimType uri={uri} small={small} />}
          {hasEdits && (
            <Icon
              customTooltipText={__('Unpublished Edits')}
              tooltip
              iconColor="red"
              size={size}
              icon={ICONS.PUBLISH}
            />
          )}
          {isCollection && claim && !iconOnly && <div>{claimLength}</div>}
          {!iconOnly && isStream && <VideoDuration uri={uri} />}
          {isStream && !isLivestream && <FileType uri={uri} small={small} />}
          {isLivestream && (
            <>
              <Icon icon={ICONS.LIVESTREAM_MONOCHROME} />
              {isLivestreamScheduled && (
                <span className="livestream__viewer-count">
                  <LivestreamDateTime uri={uri} />
                </span>
              )}
            </>
          )}
          {!claimIsMine && downloaded && <Icon size={size} tooltip icon={ICONS.LIBRARY} />}
          {isUnlisted && <Icon icon={ICONS.COPY_LINK} size={13} />}
          <FilePrice hideFree uri={uri} type="thumbnail" />
        </>
      )}
    </div>
  );
}

export default React.memo(PreviewOverlayProperties);
