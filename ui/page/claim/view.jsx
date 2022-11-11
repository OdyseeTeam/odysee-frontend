// @flow
import React from 'react';

import { useHistory } from 'react-router';
import { CHANNEL_PAGE } from 'constants/urlParams';
import { parseURI } from 'util/lbryURI';

import Page from 'component/page';
import ClaimPageComponent from './internal/claimPageComponent';

type Props = {
  uri: string,
  // -- redux --
  isMarkdownPost: ?boolean,
  isLivestreamClaim: ?boolean,
};

const ClaimPage = (props: Props) => {
  const { uri, isMarkdownPost, isLivestreamClaim } = props;

  const { isChannel } = parseURI(uri);

  const {
    location: { search },
  } = useHistory();

  const ClaimRenderWrapper = React.useMemo(
    () => ({ children }: { children: any }) => (
      <Page className="file-page" filePage isMarkdown={!!isMarkdownPost}>
        {children}
      </Page>
    ),
    [isMarkdownPost]
  );

  if (isChannel) {
    const urlParams = new URLSearchParams(search);
    const editing = urlParams.get(CHANNEL_PAGE.QUERIES.VIEW) === CHANNEL_PAGE.VIEWS.EDIT;

    if (editing) {
      return <ClaimPageComponent uri={uri} ClaimRenderWrapper={ChannelPageEditingWrapper} Wrapper={Page} />;
    }

    return <ClaimPageComponent uri={uri} ClaimRenderWrapper={ChannelPageWrapper} Wrapper={Page} />;
  }

  if (isLivestreamClaim) {
    return <ClaimPageComponent uri={uri} Wrapper={Page} />;
  }

  return <ClaimPageComponent uri={uri} ClaimRenderWrapper={ClaimRenderWrapper} Wrapper={Page} />;
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
