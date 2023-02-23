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
  downloaded: boolean,
  claimIsMine: boolean,
  isSubscribed: boolean,
  small: boolean,
  claim: Claim,
  properties?: (Claim) => ?Node,
  iconOnly: boolean,
  hasEdits: Collection,
  xsmall?: boolean,
  // -- redux --
  isLivestreamActive: ?boolean,
  livestreamViewerCount: ?number,
};

export default function PreviewOverlayProperties(props: Props) {
  const {
    uri,
    downloaded,
    claimIsMine,
    small = false,
    properties,
    claim,
    iconOnly,
    hasEdits,
    xsmall,
    // -- redux --
    isLivestreamActive,
    livestreamViewerCount,
  } = props;
  const isCollection = claim && claim.value_type === 'collection';
  // $FlowFixMe
  const claimLength = claim && claim.value && claim.value.claims && claim.value.claims.length;
  const isStream = claim && claim.value_type === 'stream';
  const size = small ? COL.ICON_SIZE : undefined;

  return (
    <div
      className={classnames('claim-preview__overlay-properties', {
        '.claim-preview__overlay-properties--small': small,
      })}
    >
      {isLivestreamActive ? (
        Number.isInteger(livestreamViewerCount) ? (
          <span className="livestream__viewer-count">
            {livestreamViewerCount} <Icon icon={ICONS.EYE} />
          </span>
        ) : (
          __('LIVE')
        )
      ) : typeof properties === 'function' ? (
        properties(claim)
      ) : xsmall ? (
        <>
          <VideoDuration uri={uri} />
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
          {isStream && <FileType uri={uri} small={small} />}
          {!claimIsMine && downloaded && <Icon size={size} tooltip icon={ICONS.LIBRARY} />}
          <FilePrice hideFree uri={uri} type="thumbnail" />
        </>
      )}
    </div>
  );
}
