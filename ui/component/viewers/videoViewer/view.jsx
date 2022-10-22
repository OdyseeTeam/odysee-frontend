// @flow
import { ENABLE_PREROLL_ADS } from 'config';
import { PLAY_POSITION_SAVE_INTERVAL_MS } from 'constants/player';
import { ERR_GRP } from 'constants/errors';
import * as PAGES from 'constants/pages';
import * as ICONS from 'constants/icons';
import React, { useEffect, useState, useContext, useCallback } from 'react';
import { stopContextMenu } from 'util/context-menu';
import * as Chapters from './internal/chapters';
import analytics from 'analytics';
import { EmbedContext } from 'page/embedWrapper/view';
import classnames from 'classnames';
import AutoplayCountdown from 'component/autoplayCountdown';
import usePrevious from 'effects/use-previous';
import FileViewerEmbeddedEnded from 'web/component/fileViewerEmbeddedEnded';
import FileViewerEmbeddedTitle from 'component/fileViewerEmbeddedTitle';
import useAutoplayNext from './internal/effects/use-autoplay-next';
import useTheaterMode from './internal/effects/use-theater-mode';
import { addPlayNextButton } from './internal/play-next';
import { addPlayPreviousButton } from './internal/play-previous';
import { useGetAds } from 'effects/use-get-ads';
import Button from 'component/button';
import I18nMessage from 'component/i18nMessage';
import { useHistory } from 'react-router';
import { getAllIds } from 'util/buildHomepage';
import type { HomepageCat } from 'util/buildHomepage';
import debounce from 'util/debounce';
import { formatLbryUrlForWeb, generateListSearchUrlParams } from 'util/url';
import useInterval from 'effects/use-interval';
import { lastBandwidthSelector } from './internal/videojsComponent/internal/plugins/videojs-http-streaming--override/playlist-selectors';
import { platform } from 'util/platform';

import VideoJs from './internal/videojsComponent';

const IS_IOS = platform.isIOS();

type Props = {
  position: number,
  changeVolume: (number) => void,
  changeMute: (boolean) => void,
  claim: StreamClaim,
  muted: boolean,
  videoPlaybackRate: number,
  volume: number,
  uri: string,
  autoplayNext: boolean,
  autoplayIfEmbedded: boolean,
  savePosition: (string, number) => void,
  clearPosition: (string) => void,
  toggleVideoTheaterMode: () => void,
  toggleAutoplayNext: () => void,
  setVideoPlaybackRate: (number) => void,
  authenticated: boolean,
  homepageData?: { [string]: HomepageCat },
  isFloating: boolean,
  doPlayUri: (params: { uri: string, collection: { collectionId: ?string } }) => void,
  collectionId: string,
  nextRecommendedUri: string,
  nextPlaylistUri: string,
  previousListUri: string,
  videoTheaterMode: boolean,
  isMarkdownOrComment: boolean,
  isLivestreamClaim: boolean,
  doSetContentHistoryItem: (uri: string) => void,
  doClearContentHistoryUri: (uri: string) => void,
  currentPlaylistItemIndex: ?number,
};

/*
codesandbox of idealized/clean videojs and react 16+
https://codesandbox.io/s/71z2lm4ko6
 */

function VideoViewer(props: Props) {
  const {
    changeVolume,
    changeMute,
    videoPlaybackRate,
    position,
    claim,
    uri,
    muted,
    volume,
    autoplayNext,
    autoplayIfEmbedded,
    savePosition,
    clearPosition,
    toggleVideoTheaterMode,
    toggleAutoplayNext,
    setVideoPlaybackRate,
    homepageData,
    authenticated,
    isFloating,
    doPlayUri,
    collectionId,
    nextRecommendedUri,
    nextPlaylistUri,
    previousListUri,
    videoTheaterMode,
    isMarkdownOrComment,
    isLivestreamClaim,
    doSetContentHistoryItem,
    currentPlaylistItemIndex,
  } = props;

  const playerEndedDuration = React.useRef();

  // in case the current playing item is deleted, use the previous state
  // for "play next"
  const prevNextItem = React.useRef(nextPlaylistUri || (autoplayNext && nextRecommendedUri));
  const nextPlaylistItem = React.useMemo(() => {
    if (nextPlaylistUri) {
      // handles current playing item is deleted case: stores the previous value for the next item
      if (currentPlaylistItemIndex !== null) {
        prevNextItem.current = nextPlaylistUri;
        return nextPlaylistUri;
      } else {
        return prevNextItem.current;
      }
    } else {
      return autoplayNext && !isLivestreamClaim ? nextRecommendedUri : undefined;
    }
  }, [autoplayNext, currentPlaylistItemIndex, isLivestreamClaim, nextPlaylistUri, nextRecommendedUri]);

  // and "play previous" behaviours
  const prevPreviousItem = React.useRef(previousListUri);
  const previousPlaylistItem = React.useMemo(() => {
    if (currentPlaylistItemIndex !== null) {
      prevPreviousItem.current = previousListUri;
      return previousListUri;
    } else {
      return prevPreviousItem.current;
    }
  }, [currentPlaylistItemIndex, previousListUri]);

  const permanentUrl = claim && claim.permanent_url;
  const adApprovedChannelIds = homepageData ? getAllIds(homepageData) : [];
  const channelClaimId = claim && claim.signing_channel && claim.signing_channel.claim_id;
  const {
    push,
    location: { pathname },
  } = useHistory();
  const [playerControlBar, setControlBar] = useState();
  const [playerElem, setPlayer] = useState();
  const [doNavigate, setDoNavigate] = useState(false);
  const [playNextUrl, setPlayNextUrl] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [showAutoplayCountdown, setShowAutoplayCountdown] = useState(false);
  const [isEndedEmbed, setIsEndedEmbed] = useState(false);
  const vjsCallbackDataRef: any = React.useRef();
  const previousUri = usePrevious(uri);
  const embedded = useContext(EmbedContext);
  const approvedVideo = Boolean(channelClaimId) && adApprovedChannelIds.includes(channelClaimId);
  const adsEnabled = ENABLE_PREROLL_ADS && !authenticated && !embedded && approvedVideo;
  const [adUrl, setAdUrl, isFetchingAd] = useGetAds(approvedVideo, adsEnabled);
  /* isLoading was designed to show loading screen on first play press, rather than completely black screen, but
  breaks because some browsers (e.g. Firefox) block autoplay but leave the player.play Promise pending */
  const [videoNode, setVideoNode] = useState();
  const [localAutoplayNext, setLocalAutoplayNext] = useState(autoplayNext);
  const isFirstRender = React.useRef(true);
  const playerRef = React.useRef(null);

  const addAutoplayNextButton = useAutoplayNext(playerRef, autoplayNext, isMarkdownOrComment);
  const addTheaterModeButton = useTheaterMode(playerRef, videoTheaterMode);

  React.useEffect(() => {
    if (isPlaying) {
      // save the updated watch time
      doSetContentHistoryItem(claim.permanent_url);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    toggleAutoplayNext();
  }, [localAutoplayNext]);

  useInterval(
    () => {
      if (playerRef.current && isPlaying && !isLivestreamClaim) {
        handlePosition(playerRef.current);
      }
    },
    !isLivestreamClaim ? PLAY_POSITION_SAVE_INTERVAL_MS : null
  );

  const updateVolumeState = React.useCallback(
    debounce((volume, muted) => {
      changeVolume(volume);
      changeMute(muted);
    }, 500),
    []
  );

  // force everything to recent when URI changes, can cause weird corner cases otherwise (e.g. navigate while autoplay is true)
  useEffect(() => {
    if (uri && previousUri && uri !== previousUri) {
      setShowAutoplayCountdown(false);
      setIsEndedEmbed(false);
    }
  }, [uri, previousUri]);

  // Update vjsCallbackDataRef (ensures videojs callbacks are not using stale values):
  useEffect(() => {
    vjsCallbackDataRef.current = {
      embedded: embedded,
      videoPlaybackRate: videoPlaybackRate,
    };
  }, [embedded, videoPlaybackRate]);

  const doPlay = useCallback(
    (playUri, isNext) => {
      if (!playUri) return;
      setDoNavigate(false);
      if (!isFloating) {
        const navigateUrl = formatLbryUrlForWeb(playUri);
        push({
          pathname: navigateUrl,
          search: isNext && !nextPlaylistUri ? undefined : collectionId && generateListSearchUrlParams(collectionId),
          state: { collectionId: isNext && !nextPlaylistUri ? undefined : collectionId, forceAutoplay: true },
        });
      } else {
        doPlayUri({
          uri: playUri,
          collection: { collectionId: isNext && !nextPlaylistUri ? undefined : collectionId },
        });
      }
    },
    [collectionId, doPlayUri, isFloating, nextPlaylistUri, push]
  );

  /** handle play next/play previous buttons **/
  useEffect(() => {
    if (!doNavigate) return;

    // playNextUrl is set (either true or false) when the Next/Previous buttons are clicked
    const shouldPlayNextUrl = playNextUrl && nextPlaylistItem && permanentUrl !== nextPlaylistItem;
    const shouldPlayPreviousUrl = !playNextUrl && previousPlaylistItem && permanentUrl !== previousPlaylistItem;

    // play next video if someone hits Next button
    if (shouldPlayNextUrl) {
      doPlay(nextPlaylistItem, true);
      // rewind if video is over 5 seconds and they hit the back button
    } else if (videoNode && videoNode.currentTime > 5) {
      videoNode.currentTime = 0;
      // move to previous video when they hit back button if behind 5 seconds
    } else if (shouldPlayPreviousUrl) {
      doPlay(previousPlaylistItem);
    } else {
      if (playerElem) playerElem.currentTime(0);
    }

    setDoNavigate(false);
    setEnded(false);
    setPlayNextUrl(true);
  }, [
    collectionId,
    doNavigate,
    doPlay,
    ended,
    nextPlaylistItem,
    permanentUrl,
    playNextUrl,
    playerElem,
    previousPlaylistItem,
    videoNode,
  ]);

  React.useEffect(() => {
    if (!playerControlBar) return;

    const existingPlayPreviousButton = playerControlBar.getChild('PlayPreviousButton');

    if (!previousListUri) {
      if (existingPlayPreviousButton) playerControlBar.removeChild('PlayPreviousButton');
    } else if (playerElem) {
      if (!existingPlayPreviousButton) addPlayPreviousButton(playerElem, doPlayPrevious);
    }

    const existingPlayNextButton = playerControlBar.getChild('PlayNextButton');

    if (!nextPlaylistItem) {
      if (existingPlayNextButton) playerControlBar.removeChild('PlayNextButton');
    } else if (playerElem) {
      if (!existingPlayNextButton) addPlayNextButton(playerElem, doPlayNext);
    }
  }, [nextPlaylistItem, playerControlBar, playerElem, previousListUri]);

  // functionality to run on video end
  React.useEffect(() => {
    if (!ended) return;

    analytics.video.videoIsPlaying(false);

    if (adUrl) {
      setAdUrl(null);
      return;
    }

    if (embedded) {
      setIsEndedEmbed(true);
      // show autoplay countdown div if not playlist
    } else if ((!collectionId || (playNextUrl && !nextPlaylistUri && nextPlaylistItem)) && autoplayNext) {
      setShowAutoplayCountdown(true);
      // if a playlist, navigate to next item
    } else if (collectionId && nextPlaylistItem) {
      setDoNavigate(true);
    }

    clearPosition(uri);

    if (IS_IOS && !autoplayNext) {
      // show play button on ios if video is paused with no autoplay on
      // $FlowFixMe
      document.querySelector('.vjs-touch-overlay')?.classList.add('show-play-toggle'); // eslint-disable-line no-unused-expressions
    }
  }, [
    adUrl,
    autoplayNext,
    clearPosition,
    collectionId,
    embedded,
    ended,
    nextPlaylistItem,
    nextPlaylistUri,
    playNextUrl,
    setAdUrl,
    uri,
  ]);

  // MORE ON PLAY STUFF
  function onPlay(player) {
    setEnded(false);
    setIsPlaying(true);
    setShowAutoplayCountdown(false);
    setIsEndedEmbed(false);
    setDoNavigate(false);
    analytics.video.videoIsPlaying(true, player);
  }

  function onPause(event, player) {
    setIsPlaying(false);
    handlePosition(player);
    analytics.video.videoIsPlaying(false, player);
  }

  function onPlayerClosed(event, player) {
    handlePosition(player);
    analytics.video.videoIsPlaying(false, player);
  }

  function handlePosition(player) {
    if (!isLivestreamClaim) savePosition(uri, player.currentTime());
  }

  function restorePlaybackRate(player) {
    if (!vjsCallbackDataRef.current.embedded) {
      player.playbackRate(vjsCallbackDataRef.current.videoPlaybackRate);
    }
  }

  const playerReadyDependencyList = [uri, adUrl, embedded, autoplayIfEmbedded];

  const doPlayNext = () => {
    setPlayNextUrl(true);
    setEnded(true);
  };

  const doPlayPrevious = () => {
    setPlayNextUrl(false);
    setEnded(true);
  };

  const onPlayerReady = useCallback((player: Player, videoNode: any) => {
    playerEndedDuration.current = false;
    // add buttons and initialize some settings for the player
    if (!embedded) {
      setVideoNode(videoNode);
      player.muted(muted);
      player.volume(volume);
      player.playbackRate(videoPlaybackRate);
      if (!isMarkdownOrComment) {
        addTheaterModeButton(player, toggleVideoTheaterMode);
        // if part of a playlist

        // remove old play next/previous buttons if they exist
        const controlBar = player.controlBar;
        if (controlBar) {
          const existingPlayNextButton = controlBar.getChild('PlayNextButton');
          if (existingPlayNextButton) controlBar.removeChild('PlayNextButton');

          const existingPlayPreviousButton = controlBar.getChild('PlayPreviousButton');
          if (existingPlayPreviousButton) controlBar.removeChild('PlayPreviousButton');

          const existingAutoplayButton = controlBar.getChild('AutoplayNextButton');
          if (existingAutoplayButton) controlBar.removeChild('AutoplayNextButton');

          setControlBar(controlBar);
          setPlayer(player);
        }

        if (collectionId) {
          addPlayNextButton(player, doPlayNext);
          addPlayPreviousButton(player, doPlayPrevious);
        }

        addAutoplayNextButton(player, () => setLocalAutoplayNext((e) => !e), autoplayNext);
      }
    }
    // PR: #5535
    // Move the restoration to a later `loadedmetadata` phase to counter the
    // delay from the header-fetch. This is a temp change until the next
    // re-factoring.
    const restorePlaybackRateEvent = () => restorePlaybackRate(player);

    // Override the "auto" algorithm to post-process the result
    const overrideAutoAlgorithm = () => {
      const vhs = player.tech(true).vhs;
      if (vhs) {
        // https://github.com/videojs/http-streaming/issues/749#issuecomment-606972884
        vhs.selectPlaylist = lastBandwidthSelector;
      }
    };

    const onPauseEvent = (event) => onPause(event, player);
    const onPlayerClosedEvent = (event) => onPlayerClosed(event, player);
    const onVolumeChange = () => {
      if (player) {
        updateVolumeState(player.volume(), player.muted());
      }
    };
    const onPlayerEnded = () => {
      setEnded(true);
      playerEndedDuration.current = true;
    };
    const onError = () => {
      const mediaError = player.error();
      if (mediaError) {
        let fingerprint;
        if (mediaError.message.match(/^video append of (.*) failed for segment (.*) in playlist (.*).m3u8$/)) {
          fingerprint = ['videojs-media-segment-append'];
        } else if (mediaError.message.match(/^audio append of (.*) failed for segment (.*) in playlist (.*).m3u8$/)) {
          fingerprint = ['videojs-media-segment-append--audio'];
        }

        const options = { ...(fingerprint ? { fingerprint } : {}) };
        analytics.log(`[${mediaError.code}] ${mediaError.message}`, options, ERR_GRP.VIDEOJS);
      }
    };
    const onRateChange = () => {
      const HAVE_NOTHING = 0; // https://docs.videojs.com/player#readyState
      if (player && player.readyState() !== HAVE_NOTHING) {
        // The playbackRate occasionally resets to 1, typically when loading a fresh video or when 'src' changes.
        // Videojs says it's a browser quirk (https://github.com/videojs/video.js/issues/2516).
        // [x] Don't update 'videoPlaybackRate' in this scenario.
        // [ ] Ideally, the controlBar should be hidden to prevent users from changing the rate while loading.
        setVideoPlaybackRate(player.playbackRate());
      }
    };

    const moveToPosition = () => {
      // update current time based on previous position
      if (position && !isLivestreamClaim) {
        const avDuration = claim?.value?.video?.duration || claim?.value?.audio?.duration;
        player.currentTime(avDuration && position >= avDuration - 100 ? 0 : position);
      }
    };

    // load events onto player
    player.on('play', onPlay);
    player.on('pause', onPauseEvent);
    player.on('playerClosed', onPlayerClosedEvent);
    player.on('ended', onPlayerEnded);
    player.on('error', onError);
    player.on('volumechange', onVolumeChange);
    player.on('ratechange', onRateChange);
    player.on('loadedmetadata', overrideAutoAlgorithm);
    player.on('loadedmetadata', restorePlaybackRateEvent);
    player.one('loadedmetadata', moveToPosition);

    const cancelOldEvents = () => {
      player.off('play', onPlay);
      player.off('pause', onPauseEvent);
      player.off('playerClosed', onPlayerClosedEvent);
      player.off('ended', onPlayerEnded);
      player.off('error', onError);
      player.off('volumechange', onVolumeChange);
      player.off('ratechange', onRateChange);
      player.off('loadedmetadata', overrideAutoAlgorithm);
      player.off('loadedmetadata', restorePlaybackRateEvent);
      player.off('playerClosed', cancelOldEvents);
      player.off('loadedmetadata', moveToPosition);
    };

    // turn off old events to prevent duplicate runs
    player.on('playerClosed', cancelOldEvents);

    // add (or remove) chapters button and time tooltips when video is ready
    player.one('loadstart', () => Chapters.parseAndLoad(player, claim));

    playerRef.current = player;
  }, playerReadyDependencyList); // eslint-disable-line

  return (
    <div
      className={classnames('file-viewer', {
        'file-viewer--is-playing': isPlaying,
        'file-viewer--ended-embed': isEndedEmbed,
      })}
      onContextMenu={stopContextMenu}
    >
      {showAutoplayCountdown && (
        <AutoplayCountdown
          nextRecommendedUri={nextRecommendedUri}
          doNavigate={() => setDoNavigate(true)}
          doReplay={() => {
            if (playerElem) {
              if (playerEndedDuration.current) {
                playerElem.play();
              } else {
                playerElem.currentTime(0);
              }
            }
            playerEndedDuration.current = false;
            setEnded(false);
            setShowAutoplayCountdown(false);
          }}
          onCanceled={() => {
            setEnded(false);
            setShowAutoplayCountdown(false);
          }}
        />
      )}
      {isEndedEmbed && <FileViewerEmbeddedEnded uri={uri} />}
      {embedded && !isEndedEmbed && <FileViewerEmbeddedTitle uri={uri} />}

      {!isFetchingAd && adUrl && (
        <>
          <span className="ads__video-notify">
            {__('Advertisement')}{' '}
            <Button
              className="ads__video-close"
              icon={ICONS.REMOVE}
              title={__('Close')}
              onClick={() => setAdUrl(null)}
            />
          </span>
          <span className="ads__video-nudge">
            <I18nMessage
              tokens={{
                sign_up: (
                  <Button
                    button="secondary"
                    className="ads__video-link"
                    label={__('Sign Up')}
                    navigate={`/$/${PAGES.AUTH}?redirect=${pathname}&src=video-ad`}
                  />
                ),
              }}
            >
              %sign_up% to turn ads off.
            </I18nMessage>
          </span>
        </>
      )}

      <VideoJs
        uri={uri}
        onPlayerReady={onPlayerReady}
        toggleVideoTheaterMode={toggleVideoTheaterMode}
        playNext={doPlayNext}
        playPrevious={doPlayPrevious}
      />
    </div>
  );
}

export default VideoViewer;
