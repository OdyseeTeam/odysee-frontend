// @flow
import * as RENDER_MODES from 'constants/file_render_modes';
import React, { useEffect, useState } from 'react';
import { onFullscreenChange } from 'util/full-screen';
import { generateListSearchUrlParams, formatLbryUrlForWeb } from 'util/url';
import { useHistory } from 'react-router';
import LoadingScreen from 'component/common/loading-screen';
import FileRender from 'component/fileRender';
import AutoplayCountdown from 'component/autoplayCountdown';
import LivestreamIframeRender from 'component/livestreamLayout/iframe-render';

const PRIMARY_PLAYER_WRAPPER_CLASS = 'file-page__video-container';
export const INLINE_PLAYER_WRAPPER_CLASS = 'inline-player__wrapper';
export const HEADER_HEIGHT_MOBILE = 56;

// ****************************************************************************
// ****************************************************************************

type Props = {
  claimId?: string,
  uri: string,
  streamingUrl?: string,
  renderMode: string,
  collectionId: string,
  costInfo: any,
  claimWasPurchased: boolean,
  nextListUri: string,
  previousListUri: string,
  activeLivestreamForChannel?: any,
  channelClaimId?: any,
  playingUri?: PlayingUri,
  mobilePlayerDimensions?: any,
  doPlayUri: (string) => void,
  doSetMobilePlayerDimensions: (height: number, width: number) => void,
};

export default function FileRenderMobile(props: Props) {
  const {
    claimId,
    uri,
    streamingUrl,
    renderMode,
    collectionId,
    costInfo,
    claimWasPurchased,
    nextListUri,
    previousListUri,
    activeLivestreamForChannel,
    channelClaimId,
    playingUri,
    mobilePlayerDimensions,
    doPlayUri,
    doSetMobilePlayerDimensions,
  } = props;

  const { push } = useHistory();

  const [fileViewerRect, setFileViewerRect] = useState();
  // whether or not to move to next upload
  // TODO: this name is a bit confusing
  const [doNavigate, setDoNavigate] = useState(false);

  const [playNextUrl, setPlayNextUrl] = useState(true);
  const [countdownCanceled, setCountdownCanceled] = useState(false);

  // if it's a live livestream
  const isCurrentClaimLive = activeLivestreamForChannel && activeLivestreamForChannel.claimId === claimId;

  /** whether to autoplay content variables **/
  const isFree = costInfo && costInfo.cost === 0;
  const canViewFile = isFree || claimWasPurchased;
  const isPlayable = RENDER_MODES.FLOATING_MODES.includes(renderMode) || activeLivestreamForChannel;
  const isReadyToPlay = isPlayable && streamingUrl;
  const isCurrentMediaPlaying = playingUri && playingUri.uri === uri;

  // resize video player
  const handleResize = React.useCallback(() => {
    // select video player
    const element = document.querySelector(`.${PRIMARY_PLAYER_WRAPPER_CLASS}`);

    // exit if no video
    if (!element) return;

    // get the size of element and its position relative to the viewport
    const rect = element.getBoundingClientRect();

    // getBoundingClientRect returns a DomRect, not an object
    const objectRect = {
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      // $FlowFixMe
      x: rect.x,
    };

    // $FlowFixMe
    setFileViewerRect({ ...objectRect });

    // resize player if the mobile player is not the same size as ____ dimensions
    const shouldResizePlayer = !mobilePlayerDimensions || mobilePlayerDimensions.height !== rect.height;

    // resize player
    if (doSetMobilePlayerDimensions && shouldResizePlayer) {
      doSetMobilePlayerDimensions(rect.height, rect.width);
    }
  }, [doSetMobilePlayerDimensions, mobilePlayerDimensions]);

  // Initial resize, will place the player correctly above the cover when starts playing
  // (remember the URI here is from playingUri). The cover then keeps on the page and kind of serves as a placeholder
  // for the player size and gives the content layered behind the player a "max scroll height"
  useEffect(() => {
    if (uri) {
      handleResize();
      setCountdownCanceled(false);
    }
  }, [handleResize, uri]);

  // run handleResize function when a resize event fires
  useEffect(() => {
    handleResize();

    window.addEventListener('resize', handleResize);
    onFullscreenChange(window, 'add', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      onFullscreenChange(window, 'remove', handleResize);
    };
  }, [handleResize]);

  // what does this do?
  const doPlay = React.useCallback(
    //
    (playUri) => {
      // what is happening here?
      setDoNavigate(false);
      // get url for browser address
      const navigateUrl = formatLbryUrlForWeb(playUri);
      // push to browser address
      push({
        pathname: navigateUrl,
        search: collectionId && generateListSearchUrlParams(collectionId),
        state: { collectionId, forceAutoplay: true, hideFloatingPlayer: true },
      });
    },
    [collectionId, push]
  );

  // move to next autoplay video
  React.useEffect(() => {
    // dont autoplay if it's turned off
    if (!doNavigate) return;

    // play next uri
    if (playNextUrl && nextListUri) {
      doPlay(nextListUri);
    } else if (previousListUri) {
      doPlay(previousListUri);
    }
    setPlayNextUrl(true);
  }, [doNavigate, doPlay, nextListUri, playNextUrl, previousListUri]);

  // different reasons why not to play video
  const shouldntPlayVideo =
    !isCurrentMediaPlaying ||
    !isPlayable ||
    !uri ||
    countdownCanceled ||
    (collectionId && !canViewFile && !nextListUri);

  // exit early if shouldn't play
  if (shouldntPlayVideo) return null;

  return (
    // mobile player parent div
    <div
      className="content__viewer content__viewer--inline content__viewer--mobile"
      style={
        fileViewerRect
          ? {
              width: fileViewerRect.width,
              height: fileViewerRect.height,
              left: fileViewerRect.x,
            }
          : {}
      }
    >
      <div className="content__wrapper">
        {isCurrentClaimLive && channelClaimId ? (
          // livestream player
          <LivestreamIframeRender channelClaimId={channelClaimId} showLivestream mobileVersion />
        ) : isReadyToPlay ? (
          // normal video player
          <FileRender uri={uri} />
        ) : !canViewFile ? ( // TODO: why do we load a countdown if it can't be viewed?
          <div className="content__loading">
            <AutoplayCountdown
              nextRecommendedUri={nextListUri}
              doNavigate={() => setDoNavigate(true)}
              doReplay={() => doPlayUri(uri)}
              doPrevious={() => {
                setPlayNextUrl(false);
                setDoNavigate(true);
              }}
              onCanceled={() => setCountdownCanceled(true)}
              skipPaid
            />
          </div>
        ) : (
          // loading screen if not ready to play
          <LoadingScreen status={__('Loading')} />
        )}
      </div>
    </div>
  );
}
