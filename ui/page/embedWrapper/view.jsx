// @flow
import * as PAGES from 'constants/pages';
import React from 'react';
import classnames from 'classnames';
import FileViewerEmbeddedTitle from 'component/fileViewerEmbeddedTitle';
import Button from 'component/button';
import { formatLbryUrlForWeb, formatLbryChannelName } from 'util/url';
import { useHistory } from 'react-router';
import useFetchLiveStatus from 'effects/use-fetch-live';
import useGetPoster from 'effects/use-get-poster';
import { EmbedContext } from 'contexts/embed';
import EmbedClaimComponent from './internal/embedClaimComponent';

type Props = {
  uri: string,
  claimId: ?string,
  haveClaim: boolean,
  canonicalUrl: ?string,
  channelUri: ?string,
  channelClaimId: ?string,
  streamingUrl: string,
  isCurrentClaimLive: boolean,
  isLivestreamClaim: boolean,
  claimThumbnail?: string,
  isMature: boolean,
  activeLivestreamInitialized: boolean,
  latestClaimUrl: ?string,
  doFetchLatestClaimForChannel: (uri: string, isEmbed: boolean) => void,
  doFetchChannelLiveStatus: (string) => void,
  doCommentSocketConnect: (string, string, string, ?string) => void,
  doCommentSocketDisconnect: (string, string) => void,
  doFetchActiveLivestreams: () => void,
  contentUnlocked: boolean,
};

const EmbedWrapperPage = (props: Props) => {
  const {
    uri,
    claimId,
    haveClaim,
    canonicalUrl,
    channelUri,
    channelClaimId,
    streamingUrl,
    isCurrentClaimLive,
    isLivestreamClaim,
    claimThumbnail,
    isMature,
    activeLivestreamInitialized,
    latestClaimUrl,
    doFetchLatestClaimForChannel,
    doFetchChannelLiveStatus,
    doCommentSocketConnect,
    doCommentSocketDisconnect,
    doFetchActiveLivestreams,
    contentUnlocked,
  } = props;

  const {
    location: { search },
  } = useHistory();

  const [livestreamsFetched, setLivestreamsFetched] = React.useState(false);

  const channelUrl = channelUri && formatLbryChannelName(channelUri);
  const urlParams = new URLSearchParams(search);
  const featureParam = urlParams.get('feature');
  const latestContentPath = featureParam === PAGES.LATEST;
  const liveContentPath = featureParam === PAGES.LIVE_NOW;
  const embedLightBackground = urlParams.get('embedBackgroundLight');
  const readyToDisplay = isCurrentClaimLive || (haveClaim && streamingUrl);
  const isLiveClaimFetching = isLivestreamClaim && !activeLivestreamInitialized;
  const isLiveClaimNotPlaying = isLivestreamClaim && !isLiveClaimFetching && !readyToDisplay;

  const thumbnail = useGetPoster(claimThumbnail);

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

  React.useEffect(() => {
    if (doFetchActiveLivestreams && isLivestreamClaim) {
      doFetchActiveLivestreams();
      setLivestreamsFetched(true);
    }
  }, [doFetchActiveLivestreams, isLivestreamClaim]);

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

  useFetchLiveStatus(livestreamsFetched ? channelClaimId : undefined, doFetchChannelLiveStatus);

  if (isLiveClaimNotPlaying) {
    return (
      <div
        className="embed__inline-button"
        style={thumbnail && !isMature ? { backgroundImage: `url("${thumbnail}")`, height: '100%' } : {}}
      >
        <FileViewerEmbeddedTitle uri={uri} />

        <a target="_blank" rel="noopener noreferrer" href={formatLbryUrlForWeb(uri)}>
          <Button iconSize={30} title={__('View')} className="button--icon button--view" />
        </a>
      </div>
    );
  }

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
