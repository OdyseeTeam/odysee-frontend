// @flow
import React from 'react';

import { useLocation } from 'react-router';
import { CHANNEL_PAGE } from 'constants/urlParams';
import { parseURI } from 'util/lbryURI';

import Page from 'component/page';
import ClaimPageComponent from './internal/claimPageComponent';

type Props = {
  uri: string,
  latestContentPath?: boolean,
  liveContentPath?: boolean,
  // -- redux --
  isMarkdownPost: ?boolean,
  isLivestreamClaim: ?boolean,
  chatDisabled: ?boolean,
};

const ClaimPage = (props: Props) => {
  const { uri, latestContentPath, liveContentPath, isMarkdownPost, isLivestreamClaim, chatDisabled } = props;

  const { isChannel } = parseURI(uri);

  const { search } = useLocation();

  const ClaimRenderWrapper = React.useMemo(
    () =>
      ({ children }: { children: any }) =>
        (
          <Page className="file-page" filePage isMarkdown={!!isMarkdownPost}>
            {children}
          </Page>
        ),
    [isMarkdownPost]
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

  if (isChannel) {
    const urlParams = new URLSearchParams(search);
    const editing = urlParams.get(CHANNEL_PAGE.QUERIES.VIEW) === CHANNEL_PAGE.VIEWS.EDIT;

    if (editing) {
      return <ClaimPageComponent uri={uri} ClaimRenderWrapper={ChannelPageEditingWrapper} Wrapper={Page} />;
    }

    return (
      <ClaimPageComponent
        uri={uri}
        ClaimRenderWrapper={ChannelPageWrapper}
        Wrapper={Page}
        latestContentPath={latestContentPath}
        liveContentPath={liveContentPath}
      />
    );
  }

  if (isLivestreamClaim) {
    return <ClaimPageComponent uri={uri} ClaimRenderWrapper={LivestreamPageWrapper} Wrapper={Page} />;
  }

  return (
    <ClaimPageComponent
      uri={uri}
      ClaimRenderWrapper={ClaimRenderWrapper}
      Wrapper={Page}
      latestContentPath={latestContentPath}
      liveContentPath={liveContentPath}
    />
  );
};

const ChannelPageWrapper = ({ children }: { children: any }) => (
  <Page className="channelPage-wrapper" noFooter fullWidthPage>
    {children}
  </Page>
);

const ChannelPageEditingWrapper = ({ children }: { children: any }) => (
  <Page className="channelPage-wrapper channelPage-edit-wrapper" noFooter fullWidthPage>
    {children}
  </Page>
);

export default ClaimPage;
