// @flow
import React from 'react';
import * as ICONS from 'constants/icons';
import { parseURI } from 'util/lbryURI';
import classnames from 'classnames';
import Gerbil from './gerbil.png';
import FreezeframeWrapper from 'component/fileThumbnail/FreezeframeWrapper';
import ChannelStakedIndicator from 'component/channelStakedIndicator';
import OptimizedImage from 'component/optimizedImage';
import { AVATAR_DEFAULT } from 'config';
import useGetUserMemberships from 'effects/use-get-user-memberships';
import CommentBadge from 'component/common/comment-badge';

type Props = {
  thumbnail: ?string,
  uri: string,
  className?: string,
  thumbnailPreview: ?string,
  obscure?: boolean,
  small?: boolean,
  xsmall?: boolean,
  allowGifs?: boolean,
  claim: ?ChannelClaim,
  doResolveUri: (string) => void,
  isResolving: boolean,
  noLazyLoad?: boolean,
  hideStakedIndicator?: boolean,
  hideTooltip?: boolean,
  noOptimization?: boolean,
  setThumbUploadError: (boolean) => void,
  ThumbUploadError: boolean,
  claimsByUri: { [string]: any },
  selectOdyseeMembershipByClaimId: string,
  doFetchUserMemberships: (claimIdCsv: string) => void,
  showMemberBadge?: boolean,
};

function ChannelThumbnail(props: Props) {
  const {
    thumbnail: rawThumbnail,
    uri,
    className,
    thumbnailPreview: rawThumbnailPreview,
    obscure,
    small = false,
    xsmall = false,
    allowGifs = false,
    claim,
    doResolveUri,
    isResolving,
    noLazyLoad,
    hideStakedIndicator = false,
    hideTooltip,
    setThumbUploadError,
    ThumbUploadError,
    claimsByUri,
    selectOdyseeMembershipByClaimId,
    doFetchUserMemberships,
    showMemberBadge,
  } = props;
  const [thumbLoadError, setThumbLoadError] = React.useState(ThumbUploadError);
  const shouldResolve = !isResolving && claim === undefined;
  const thumbnail = rawThumbnail && rawThumbnail.trim().replace(/^http:\/\//i, 'https://');
  const thumbnailPreview = rawThumbnailPreview && rawThumbnailPreview.trim().replace(/^http:\/\//i, 'https://');
  const defaultAvatar = AVATAR_DEFAULT || Gerbil;
  const channelThumbnail = thumbnailPreview || thumbnail || defaultAvatar;
  const isGif = channelThumbnail && channelThumbnail.endsWith('gif');
  const showThumb = (!obscure && !!thumbnail) || thumbnailPreview;

  let badgeToShow;
  if (showMemberBadge) {
    if (selectOdyseeMembershipByClaimId === 'Premium') {
      badgeToShow = 'silver';
    } else if (selectOdyseeMembershipByClaimId === 'Premium+') {
      badgeToShow = 'gold';
    }
  }

  const shouldFetchUserMemberships = true;
  useGetUserMemberships(shouldFetchUserMemberships, [uri], claimsByUri, doFetchUserMemberships);

  // Generate a random color class based on the first letter of the channel name
  const { channelName } = parseURI(uri);
  let initializer;
  let colorClassName;
  if (channelName) {
    initializer = channelName.charCodeAt(0) - 65; // will be between 0 and 57
    colorClassName = `channel-thumbnail__default--${Math.abs(initializer % 4)}`;
  } else {
    colorClassName = `channel-thumbnail__default--4`;
  }

  React.useEffect(() => {
    if (shouldResolve && uri) {
      doResolveUri(uri);
    }
  }, [doResolveUri, shouldResolve, uri]);

  if (isGif && !allowGifs) {
    return (
      <FreezeframeWrapper src={channelThumbnail} className={classnames('channel-thumbnail', className)}>
        {!hideStakedIndicator && <ChannelStakedIndicator uri={uri} claim={claim} hideTooltip={hideTooltip} />}
        {badgeToShow === 'silver' && <CommentBadge label={__('Premium')} icon={ICONS.PREMIUM} size={25} />}
        {badgeToShow === 'gold' && <CommentBadge label={__('Premium +')} icon={ICONS.PREMIUM_PLUS} size={25} />}
      </FreezeframeWrapper>
    );
  }

  return (
    <div
      className={classnames('channel-thumbnail', className, {
        [colorClassName]: !showThumb,
        'channel-thumbnail--small': small,
        'channel-thumbnail--xsmall': xsmall,
        'channel-thumbnail--resolving': isResolving,
      })}
    >
      <OptimizedImage
        alt={__('Channel profile picture')}
        className={!channelThumbnail ? 'channel-thumbnail__default' : 'channel-thumbnail__custom'}
        src={(!thumbLoadError && channelThumbnail) || defaultAvatar}
        loading={noLazyLoad ? undefined : 'lazy'}
        onError={() => {
          if (setThumbUploadError) {
            setThumbUploadError(true);
          } else {
            setThumbLoadError(true);
          }
        }}
      />
      {!hideStakedIndicator && <ChannelStakedIndicator uri={uri} claim={claim} hideTooltip={hideTooltip} />}
      {badgeToShow === 'silver' && <CommentBadge label={__('Premium')} icon={ICONS.PREMIUM} size={25} />}
      {badgeToShow === 'gold' && <CommentBadge label={__('Premium +')} icon={ICONS.PREMIUM_PLUS} size={25} />}
    </div>
  );
}

export default ChannelThumbnail;
