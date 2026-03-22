import React from 'react';
import classnames from 'classnames';
import Button from 'component/button';
import MembershipBadge from 'component/membershipBadge';
import { stripLeadingAtSign } from 'util/string';
type ChannelInfo = {
  uri: string;
  name: string;
  title: string;
};
type Props = {
  channelInfo: ChannelInfo | null | undefined;
  link: boolean | null | undefined;
  external?: boolean;
  focusable?: boolean;
  hideAnonymous?: boolean;
  inline?: boolean;
  showAtSign?: boolean;
  className?: string;
  showMemberBadge?: boolean;
  children: React.ReactNode | null | undefined;
  // --- redux ---
  claim: Claim | null | undefined;
  isResolvingUri: boolean;
  comment?: boolean;
  showHiddenAsAnonymous?: boolean;
  odyseeMembership: string | null | undefined;
};

function resolveState(
  channelInfo: ChannelInfo | null | undefined,
  claim: Claim | null | undefined,
  isLinkType: boolean | null | undefined
) {
  if (channelInfo) {
    return {
      hasChannelData: true,
      isAnonymous: false,
      channelName: channelInfo.name,
      channelLink: isLinkType ? channelInfo.uri : false,
      channelTitle: channelInfo.title,
    };
  } else if (claim) {
    const isChannelClaim = claim.value_type === 'channel';
    const isChannelSignatureValid = claim.is_channel_signature_valid;
    const channelClaim = isChannelClaim ? claim : claim.signing_channel;
    return {
      hasChannelData: Boolean(channelClaim),
      isAnonymous: !isChannelSignatureValid && !isChannelClaim,
      channelName: channelClaim?.name,
      channelLink: isLinkType ? channelClaim?.canonical_url || channelClaim?.permanent_url : false,
      channelTitle:
        channelClaim && channelClaim.value && channelClaim.value.title
          ? channelClaim.value.title
          : stripLeadingAtSign(channelClaim?.name),
    };
  } else {
    return {
      hasChannelData: false,
      isAnonymous: undefined,
      channelName: undefined,
      channelLink: undefined,
      channelTitle: undefined,
    };
  }
}

function UriIndicator(props: Props) {
  const {
    channelInfo,
    link,
    isResolvingUri,
    claim,
    children,
    inline,
    focusable = true,
    external = false,
    hideAnonymous = false,
    showAtSign,
    className,
    comment,
    showMemberBadge = true,
    showHiddenAsAnonymous,
    odyseeMembership,
  } = props;

  if (!channelInfo && !claim && !showHiddenAsAnonymous) {
    return (
      <span className={classnames('empty', className)}>
        {claim === null ? '---' : isResolvingUri || claim === undefined ? __('Validating...') : __('[Removed]')}
      </span>
    );
  }

  const data = resolveState(channelInfo, claim, link);

  if (data.isAnonymous || (!channelInfo && !claim && showHiddenAsAnonymous)) {
    if (hideAnonymous) {
      return null;
    }

    return (
      <span
        dir="auto"
        className={classnames('channel-name', className, {
          'channel-name--inline': inline,
        })}
      >
        Anonymous
      </span>
    );
  }

  if (data.hasChannelData) {
    const { channelLink, channelTitle, channelName } = data;
    const inner = (
      <span
        dir="auto"
        className={classnames('channel-name', {
          'channel-name--inline': inline,
        })}
      >
        <p>{showAtSign ? channelName : stripLeadingAtSign(channelTitle)}</p>
        {!comment && showMemberBadge && odyseeMembership && <MembershipBadge membershipName={odyseeMembership} />}
      </span>
    );

    if (!channelLink) {
      return inner;
    }

    if (children) {
      return (
        <Button
          aria-hidden={!focusable}
          tabIndex={focusable ? 0 : -1}
          className={className}
          target={external ? '_blank' : undefined}
          navigate={channelLink}
        >
          {children}
        </Button>
      );
    } else {
      return (
        <Button
          className={classnames(className, 'button--uri-indicator')}
          navigate={channelLink}
          target={external ? '_blank' : undefined}
          aria-hidden={!focusable}
          tabIndex={focusable ? 0 : -1}
        >
          {inner}
        </Button>
      );
    }
  } else {
    return null;
  }
}

export default React.memo(UriIndicator);
