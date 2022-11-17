// @flow
import * as PAGES from 'constants/pages';
import React from 'react';
import classnames from 'classnames';
import FileViewerEmbeddedTitle from 'component/fileViewerEmbeddedTitle';
import { formatLbryChannelName } from 'util/url';
import { useHistory } from 'react-router';
import { EmbedContext } from 'contexts/embed';
import EmbedClaimComponent from './internal/embedClaimComponent';

type Props = {
  uri: string,
  claimId: ?string,
  canonicalUrl: ?string,
  channelUri: ?string,
  channelClaimId: ?string,
  isLivestreamClaim: boolean,
  latestClaimUrl: ?string,
  doFetchLatestClaimForChannel: (uri: string, isEmbed: boolean) => void,
  doFetchChannelLiveStatus: (string) => void,
  doCommentSocketConnect: (string, string, string, ?string) => void,
  doCommentSocketDisconnect: (string, string) => void,
  contentUnlocked: boolean,
};

const EmbedWrapperPage = (props: Props) => {
  const {
    uri,
    claimId,
    canonicalUrl,
    channelUri,
    channelClaimId,
    isLivestreamClaim,
    latestClaimUrl,
    doFetchLatestClaimForChannel,
    doFetchChannelLiveStatus,
    doCommentSocketConnect,
    doCommentSocketDisconnect,
    contentUnlocked,
  } = props;

  const {
    location: { search },
  } = useHistory();

  const channelUrl = channelUri && formatLbryChannelName(channelUri);
  const urlParams = new URLSearchParams(search);
  const featureParam = urlParams.get('feature');
  const latestContentPath = featureParam === PAGES.LATEST;
  const liveContentPath = featureParam === PAGES.LIVE_NOW;
  const embedLightBackground = urlParams.get('embedBackgroundLight');

  React.useEffect(() => {
    if (!latestClaimUrl && liveContentPath && channelClaimId) {
      doFetchChannelLiveStatus(channelClaimId);
    }
  }, [channelClaimId, doFetchChannelLiveStatus, latestClaimUrl, liveContentPath]);

  React.useEffect(() => {
    if (!latestClaimUrl && latestContentPath && canonicalUrl) {
      doFetchLatestClaimForChannel(canonicalUrl, true);
    }
  }, [canonicalUrl, doFetchLatestClaimForChannel, latestClaimUrl, latestContentPath]);

  // Establish web socket connection for viewer count.
  React.useEffect(() => {
    if (!isLivestreamClaim || !claimId || !channelUrl || !canonicalUrl) return;

    const channelName = formatLbryChannelName(channelUrl);

    if (contentUnlocked) {
      doCommentSocketConnect(canonicalUrl, channelName, claimId, undefined);
    }

    return () => {
      if (claimId) {
        doCommentSocketDisconnect(claimId, channelName);
      }
    };
  }, [
    canonicalUrl,
    channelUrl,
    claimId,
    doCommentSocketConnect,
    doCommentSocketDisconnect,
    isLivestreamClaim,
    contentUnlocked,
  ]);

  return (
    <div className={classnames('embed__wrapper', { 'embed__wrapper--light-background': embedLightBackground })}>
      <EmbedContext.Provider value>
        <EmbedClaimComponent uri={uri} />
        <FileViewerEmbeddedTitle uri={uri} />
      </EmbedContext.Provider>
    </div>
  );
};

export default EmbedWrapperPage;
