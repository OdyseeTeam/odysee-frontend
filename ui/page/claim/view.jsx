// @flow
import React from 'react';

import { useLocation } from 'react-router';
import { CHANNEL_PAGE } from 'constants/urlParams';
import { parseURI } from 'util/lbryURI';
import { getWooType } from 'util/woo';

import Page from 'component/page';
import ClaimPageComponent from './internal/claimPageComponent';

type Props = {
  uri: string,
  wooYtId?: ?string,
  latestContentPath?: boolean,
  liveContentPath?: boolean,
  // -- redux --
  isMarkdownPost: ?boolean,
  isLivestreamClaim: ?boolean,
  chatDisabled: ?boolean,
};

const ClaimPage = (props: Props) => {
  const { uri, wooYtId, latestContentPath, liveContentPath, isMarkdownPost, isLivestreamClaim, chatDisabled } = props;

  const { isChannel } = parseURI(uri);

  const { search, pathname } = useLocation();
  const isWooLive = Boolean(wooYtId && getWooType(new URLSearchParams(search).get('type')) === 'live');
  const isEmbedPath = pathname && pathname.startsWith('/$/embed');

  const ClaimRenderWrapper = React.useMemo(
    () =>
      ({ children }: { children: any }) =>
        (
          <Page
            className="file-page"
            filePage
            isMarkdown={!!isMarkdownPost}
            noSideNavigation={isEmbedPath && !!isMarkdownPost}
          >
            {children}
          </Page>
        ),
    [isMarkdownPost, isEmbedPath]
  );

  const LivestreamPageWrapper = React.useMemo(
    () =>
      ({ children }: { children: any }) =>
        (
          <Page className="file-page" noFooter livestream={!chatDisabled}>
            {children}
          </Page>
        ),
    [chatDisabled]
  );

  const ChannelPageWrapper = React.useMemo(
    () =>
      ({ children }: { children: any }) =>
        (
          <Page className="channelPage-wrapper" noFooter fullWidthPage noSideNavigation={isEmbedPath}>
            {children}
          </Page>
        ),
    [isEmbedPath]
  );

  if (isChannel) {
    const urlParams = new URLSearchParams(search);
    const editing = urlParams.get(CHANNEL_PAGE.QUERIES.VIEW) === CHANNEL_PAGE.VIEWS.EDIT;

    if (editing) {
      const ChannelPageEditingWrapperLocal = ({ children }: { children: any }) => (
        <Page
          className="channelPage-wrapper channelPage-edit-wrapper"
          noFooter
          fullWidthPage
          noSideNavigation={isEmbedPath}
        >
          {children}
        </Page>
      );
      return (
        <ClaimPageComponent
          uri={uri}
          wooYtId={wooYtId}
          ClaimRenderWrapper={ChannelPageEditingWrapperLocal}
          Wrapper={Page}
        />
      );
    }

    return (
      <ClaimPageComponent
        uri={uri}
        wooYtId={wooYtId}
        ClaimRenderWrapper={ChannelPageWrapper}
        Wrapper={Page}
        latestContentPath={latestContentPath}
        liveContentPath={liveContentPath}
      />
    );
  }

  if (isLivestreamClaim || isWooLive) {
    return <ClaimPageComponent uri={uri} wooYtId={wooYtId} ClaimRenderWrapper={LivestreamPageWrapper} Wrapper={Page} />;
  }

  return (
    <ClaimPageComponent
      uri={uri}
      wooYtId={wooYtId}
      ClaimRenderWrapper={ClaimRenderWrapper}
      Wrapper={Page}
      latestContentPath={latestContentPath}
      liveContentPath={liveContentPath}
    />
  );
};

export default ClaimPage;
