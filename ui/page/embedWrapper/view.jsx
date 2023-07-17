// @flow
import * as PAGES from 'constants/pages';
import React from 'react';
import classnames from 'classnames';
import { formatLbryChannelName } from 'util/url';
import { useHistory } from 'react-router';
import { EmbedContext } from 'contexts/embed';
import { parseURI } from 'util/lbryURI';
import EmbedClaimComponent from './internal/embedClaimComponent';

type Props = {
  uri: string,
  claimId: string,
  latestClaimId: ?string,
  canonicalUrl: ?string,
  channelUri: ?string,
  channelClaimId: ?string,
  isLivestreamClaim: boolean,
  latestClaimUrl: ?string,
  doFetchLatestClaimForChannel: (uri: string, isEmbed: boolean) => void,
  doFetchChannelIsLiveForId: (string) => void,
  doCommentSocketConnect: (string, string, string, ?string) => void,
  doCommentSocketDisconnect: (string, string) => void,
  contentUnlocked: boolean,
};

const EmbedWrapperPage = (props: Props) => {
  const {
    uri,
    claimId,
    latestClaimId,
    canonicalUrl,
    channelUri,
    channelClaimId,
    isLivestreamClaim,
    latestClaimUrl,
    doFetchLatestClaimForChannel,
    doFetchChannelIsLiveForId,
    doCommentSocketConnect,
    doCommentSocketDisconnect,
    contentUnlocked,
  } = props;

  const fetchedLiveStatus = React.useRef();

  const {
    location: { search },
  } = useHistory();

  const { isChannel } = parseURI(uri);

  const [videoEnded, setVideoEnded] = React.useState(false);

  const channelUrl = channelUri && formatLbryChannelName(channelUri);
  const urlParams = new URLSearchParams(search);
  const featureParam = urlParams.get('feature');
  const latestContentPath = featureParam === PAGES.LATEST;
  const liveContentPath = featureParam === PAGES.LIVE_NOW;
  const embedLightBackground = urlParams.get('embedBackgroundLight');
  const socketClaimId = liveContentPath ? latestClaimId : claimId;

  React.useEffect(() => {
    if (!latestClaimUrl && liveContentPath && channelClaimId) {
      doFetchChannelIsLiveForId(channelClaimId);
      fetchedLiveStatus.current = true;
    }
  }, [channelClaimId, doFetchChannelIsLiveForId, latestClaimUrl, liveContentPath]);

  React.useEffect(() => {
    if (!latestClaimUrl && latestContentPath && canonicalUrl) {
      doFetchLatestClaimForChannel(canonicalUrl, true);
    }
  }, [canonicalUrl, doFetchLatestClaimForChannel, latestClaimUrl, latestContentPath]);

  // Establish web socket connection for viewer count.
  React.useEffect(() => {
    if (!isLivestreamClaim || !socketClaimId || !channelUrl || !canonicalUrl) {
      return;
    }

    const channelName = formatLbryChannelName(channelUrl);

    if (contentUnlocked) {
      doCommentSocketConnect(canonicalUrl, channelName, socketClaimId, undefined);
    }

    return () => {
      if (socketClaimId) {
        doCommentSocketDisconnect(socketClaimId, channelName);
      }
    };
  }, [
    canonicalUrl,
    channelUrl,
    contentUnlocked,
    doCommentSocketConnect,
    doCommentSocketDisconnect,
    isLivestreamClaim,
    socketClaimId,
  ]);

  return (
    <div
      className={classnames('embed__wrapper', {
        'embed__wrapper--light-background': embedLightBackground,
        'embed__wrapper--channel': isChannel,
        'embed__wrapper--channel-notice': isChannel && latestClaimUrl === null,
      })}
    >
      <EmbedContext.Provider value={{ setVideoEnded, videoEnded, fetchedLiveStatus: fetchedLiveStatus.current }}>
        <EmbedClaimComponent uri={uri} latestClaimUrl={latestClaimUrl} />
      </EmbedContext.Provider>
    </div>
  );
};

export default EmbedWrapperPage;
