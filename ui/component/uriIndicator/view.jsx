// @flow
import type { Node } from 'react';
import React from 'react';
import classnames from 'classnames';
import Button from 'component/button';

type ChannelInfo = {
  uri: string,
  name: string,
};

type Props = {
  isResolvingUri: boolean,
  link: ?boolean,
  claim: ?Claim,
  hideAnonymous: boolean,
  // Lint thinks we aren't using these, even though we are.
  // Possibly because the resolve function is an arrow function that is passed in props?
  resolveUri: (string) => void,
  uri: string,
  channelInfo: ?ChannelInfo, // Direct channel info to use, bypassing the need to resolve 'uri'.
  // to allow for other elements to be nested within the UriIndicator
  children: ?Node,
  inline: boolean,
  external?: boolean,
  className?: string,
  focusable: boolean,
};

class UriIndicator extends React.PureComponent<Props> {
  componentDidMount() {
    this.resolveClaim(this.props);
  }

  componentDidUpdate() {
    this.resolveClaim(this.props);
  }

  resolveClaim = (props: Props) => {
    const { isResolvingUri, resolveUri, claim, uri, channelInfo } = props;

    if (!channelInfo && !isResolvingUri && claim === undefined && uri) {
      resolveUri(uri);
    }
  };

  resolveState = (channelInfo: ?ChannelInfo, claim: ?Claim, isLinkType: ?boolean) => {
    if (channelInfo) {
      return {
        hasChannelData: true,
        isAnonymous: false,
        channelName: channelInfo.name,
        channelLink: isLinkType ? channelInfo.uri : false,
      };
    } else if (claim) {
      const signingChannel = claim.signing_channel && claim.signing_channel.amount;
      const isChannelClaim = claim.value_type === 'channel';
      const channelClaim = isChannelClaim ? claim : claim.signing_channel;

      return {
        hasChannelData: Boolean(channelClaim),
        isAnonymous: !signingChannel && !isChannelClaim,
        channelName: channelClaim?.name,
        channelLink: isLinkType ? channelClaim?.canonical_url || channelClaim?.permanent_url : false,
      };
    } else {
      return {
        hasChannelData: false,
        isAnonymous: undefined,
        channelName: undefined,
        channelLink: undefined,
      };
    }
  };

  render() {
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
      className,
    } = this.props;

    if (!channelInfo && !claim) {
      return (
        <span className={classnames('empty', className)}>
          {isResolvingUri || claim === undefined ? __('Validating...') : __('[Removed]')}
        </span>
      );
    }

    const data = this.resolveState(channelInfo, claim, link);

    if (data.isAnonymous) {
      if (hideAnonymous) {
        return null;
      }

      return (
        <span dir="auto" className={classnames('channel-name', className, { 'channel-name--inline': inline })}>
          Anonymous
        </span>
      );
    }

    if (data.hasChannelData) {
      const { channelName, channelLink } = data;

      const inner = (
        <span dir="auto" className={classnames('channel-name', { 'channel-name--inline': inline })}>
          {channelName}
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
}

export default UriIndicator;
