// @flow
import React from 'react';
import moment from 'moment';

import { useHistory } from 'react-router';
import { CHANNEL_PAGE } from 'constants/urlParams';
import { parseURI } from 'util/lbryURI';
import { LIVESTREAM_STARTS_SOON_BUFFER } from 'constants/livestream';

import Page from 'component/page';
import ClaimPageComponent from './internal/claimPageComponent';

type Props = {
  uri: string,
  // -- redux --
  isMarkdownPost: ?boolean,
  isLivestreamClaim: ?boolean,
  claimReleaseTime: ?number,
  chatDisabled: ?boolean,
};

const ClaimPage = (props: Props) => {
  const { uri, isMarkdownPost, isLivestreamClaim, claimReleaseTime, chatDisabled } = props;

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

  const LivestreamPageWrapper = React.useMemo(() => {
    const releaseTime: moment = moment.unix(claimReleaseTime || 0);

    const claimReleaseInFuture = () => releaseTime.isAfter();
    const claimReleaseStartingSoon = () =>
      releaseTime.isBetween(moment(), moment().add(LIVESTREAM_STARTS_SOON_BUFFER, 'minutes'));

    const checkCommentsDisabled = () => chatDisabled || (claimReleaseInFuture() && !claimReleaseStartingSoon());
    const hideComments = checkCommentsDisabled();

    return ({ children }: { children: any }) => (
      <Page className="file-page scheduledLivestream-wrapper" noFooter livestream={!hideComments}>
        {children}
      </Page>
    );
  }, [chatDisabled, claimReleaseTime]);

  if (isChannel) {
    const urlParams = new URLSearchParams(search);
    const editing = urlParams.get(CHANNEL_PAGE.QUERIES.VIEW) === CHANNEL_PAGE.VIEWS.EDIT;

    if (editing) {
      return <ClaimPageComponent uri={uri} ClaimRenderWrapper={ChannelPageEditingWrapper} Wrapper={Page} />;
    }

    return <ClaimPageComponent uri={uri} ClaimRenderWrapper={ChannelPageWrapper} Wrapper={Page} />;
  }

  if (isLivestreamClaim) {
    return <ClaimPageComponent uri={uri} ClaimRenderWrapper={LivestreamPageWrapper} Wrapper={Page} />;
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
