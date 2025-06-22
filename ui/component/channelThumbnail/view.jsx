// @flow
import React from 'react';
import { parseURI } from 'util/lbryURI';
import { getImageProxyUrl } from 'util/thumbnail';
import classnames from 'classnames';
import Gerbil from './gerbil.png';
import FreezeframeWrapper from 'component/common/freezeframe-wrapper';
import OptimizedImage from 'component/optimizedImage';
import { AVATAR_DEFAULT } from 'config';
import MembershipBadge from 'component/membershipBadge';

type Props = {
  thumbnail: ?string,
  uri: string,
  className?: string,
  thumbnailPreview: ?string,
  obscure?: boolean,
  small?: boolean,
  xsmall?: boolean,
  xxsmall?: boolean,
  allowGifs?: boolean,
  claim: ?ChannelClaim,
  doResolveUri: (string) => void,
  isResolving: boolean,
  noLazyLoad?: boolean,
  hideStakedIndicator?: boolean,
  hideTooltip?: boolean,
  setThumbUploadError: (boolean) => void,
  ThumbUploadError: boolean,
  showMemberBadge?: boolean,
  isChannel?: boolean,
  odyseeMembership: ?string,
  tooltipTitle?: string,
  isImagesAgeRestricted: boolean,
  channelIsMine: boolean,
  isAgeRestrictedContentAllowed: boolean,
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
    xxsmall = false,
    allowGifs = false,
    claim,
    doResolveUri,
    isResolving,
    noLazyLoad,
    hideTooltip,
    setThumbUploadError,
    ThumbUploadError,
    showMemberBadge,
    isChannel,
    odyseeMembership,
    tooltipTitle,
    isImagesAgeRestricted,
    channelIsMine,
    isAgeRestrictedContentAllowed,
  } = props;
  const [thumbLoadError, setThumbLoadError] = React.useState(ThumbUploadError);
  const shouldResolve = !isResolving && claim === undefined;
  const thumbnail = rawThumbnail && rawThumbnail.trim().replace(/^http:\/\//i, 'https://');
  const thumbnailPreview = rawThumbnailPreview && rawThumbnailPreview.trim().replace(/^http:\/\//i, 'https://');
  const defaultAvatar = AVATAR_DEFAULT || Gerbil;
  const channelThumbnail = thumbnailPreview || thumbnail || defaultAvatar;
  const isAnimated = channelThumbnail && (channelThumbnail.endsWith('gif') || channelThumbnail.endsWith('webp'));
  const showThumb = (!obscure && !!thumbnail) || thumbnailPreview;
  const shouldBlur = !channelIsMine && isImagesAgeRestricted && !isAgeRestrictedContentAllowed;

  const badgeProps = React.useMemo(() => {
    return {
      membershipName: odyseeMembership,
      linkPage: isChannel,
      placement: isChannel ? 'bottom' : undefined,
      hideTooltip,
      className: isChannel ? 'profile-badge__tooltip' : undefined,
    };
  }, [hideTooltip, isChannel, odyseeMembership]);

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

  if (isAnimated && !allowGifs) {
    const url = getImageProxyUrl(channelThumbnail);
    return (
      url && (
        <FreezeframeWrapper
          src={url}
          className={classnames('channel-thumbnail', className, {
            'age-restricted': shouldBlur,
            'channel-thumbnail--small': small,
            'channel-thumbnail--xsmall': xsmall,
            'channel-thumbnail--xxsmall': xxsmall,
            'channel-thumbnail--resolving': isResolving,
          })}
        >
          {showMemberBadge ? <MembershipBadge {...badgeProps} /> : null}
        </FreezeframeWrapper>
      )
    );
  }

  return (
    <div
      className={classnames('channel-thumbnail', className, {
        'age-restricted': shouldBlur,
        [colorClassName]: !showThumb,
        'channel-thumbnail--small': small,
        'channel-thumbnail--xsmall': xsmall,
        'channel-thumbnail--xxsmall': xxsmall,
        'channel-thumbnail--resolving': isResolving,
      })}
      title={tooltipTitle}
    >
      {/* width: use the same size for all 'small' variants so that caching works better */}
      <OptimizedImage
        className={!channelThumbnail ? 'channel-thumbnail__default' : 'channel-thumbnail__custom'}
        src={(!thumbLoadError && channelThumbnail) || defaultAvatar}
        width={xxsmall || xsmall || small ? 64 : 160}
        quality={95}
        loading={noLazyLoad ? undefined : 'lazy'}
        onError={() => {
          if (setThumbUploadError) {
            setThumbUploadError(true);
          } else {
            setThumbLoadError(true);
          }
        }}
      />
      {showMemberBadge && <MembershipBadge {...badgeProps} />}
    </div>
  );
}

export default ChannelThumbnail;
