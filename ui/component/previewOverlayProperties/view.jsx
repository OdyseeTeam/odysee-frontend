// @flow
import type { Node } from 'react';
import * as ICONS from 'constants/icons';
import * as React from 'react';
import classnames from 'classnames';
import Icon from 'component/common/icon';
import FilePrice from 'component/filePrice';
import VideoDuration from 'component/videoDuration';
import FileType from 'component/fileType';
import ClaimType from 'component/claimType';
import * as COL from 'constants/collections';

type Props = {
  uri: string,
  pending?: boolean,
  downloaded: boolean,
  claimIsMine: boolean,
  isSubscribed: boolean,
  small: boolean,
  claim: Claim,
  properties?: (Claim) => ?Node,
  iconOnly: boolean,
  hasEdits: Collection,
  xsmall?: boolean,
  isLivestream?: boolean,
  // -- redux --
  isLivestreamActive: ?boolean,
  isUnlisted: boolean,
  livestreamViewerCount: ?number,
};

export default function PreviewOverlayProperties(props: Props) {
  const {
    uri,
    downloaded,
    claimIsMine,
    small = false,
    properties,
    pending,
    claim,
    iconOnly,
    hasEdits,
    xsmall,
    isLivestream,
    // -- redux --
    isLivestreamActive,
    isUnlisted,
    livestreamViewerCount,
  } = props;
  const isCollection = claim && claim.value_type === 'collection';
  // $FlowFixMe
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
          {isLivestream && <Icon icon={ICONS.LIVESTREAM_MONOCHROME} size={13} />}
          {!claimIsMine && downloaded && <Icon size={size} tooltip icon={ICONS.LIBRARY} />}
          {isUnlisted && <Icon icon={ICONS.COPY_LINK} size={13} />}
          <FilePrice hideFree uri={uri} type="thumbnail" />
        </>
      )}
    </div>
  );
}
