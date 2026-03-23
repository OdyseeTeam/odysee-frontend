import { ERR_GRP } from 'constants/errors';
import { VJS_EVENTS } from 'constants/player';
import React, { useEffect, useState, useContext, useCallback } from 'react';
import * as Chapters from './internal/chapters';
import type { Player } from './internal/videojs';
import VideoJs from './internal/videojs';
import analytics from 'analytics';
import { EmbedContext } from 'contexts/embed';
import classnames from 'classnames';
import { FORCE_CONTENT_TYPE_PLAYER } from 'constants/claim';
import FileViewerEmbeddedEnded from './internal/fileViewerEmbeddedEnded';
import FileViewerEmbeddedTitle from 'component/fileViewerEmbeddedTitle';
import useAutoplayNext from './internal/effects/use-autoplay-next';
import useTheaterMode from './internal/effects/use-theater-mode';
import { addPlayNextButton } from './internal/play-next';
import { addPlayPreviousButton } from './internal/play-previous';
import ClaimPreviewTile from 'component/claimPreviewTile';
import FileReactions from 'component/fileReactions';
import debounce from 'util/debounce';
import useInterval from 'effects/use-interval';
import { lastBandwidthSelector } from './internal/plugins/videojs-http-streaming--override/playlist-selectors';
import { isClaimUnlisted } from 'util/claim';
import { parseURI } from 'util/lbryURI';
import { platform } from 'util/platform';
import { LocalStorage } from 'util/storage';
import { useIsMobile } from 'effects/use-screensize';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import {
  selectClaimForUri,
  selectThumbnailForUri,
  selectPurchaseTagForUri,
  selectPurchaseMadeForClaimId,
  selectRentalTagForUri,
  selectProtectedContentTagForUri,
  makeSelectTagInClaimOrChannelForUri,
} from 'redux/selectors/claims';
import { isStreamPlaceholderClaim, getChannelIdFromClaim } from 'util/claim';
import { selectActiveLivestreamForChannel } from 'redux/selectors/livestream';
import { selectNextUriForUriInPlayingCollectionForId } from 'redux/selectors/collections';
import * as SETTINGS from 'constants/settings';
import * as TAGS from 'constants/tags';
import {
  doChangeVolume,
  doChangeMute,
  doAnalyticsBuffer,
  doAnalyticsViewForUri,
  doSetVideoSourceLoaded,
} from 'redux/actions/app';
import { selectVolume, selectMute } from 'redux/selectors/app';
import {
  savePosition as savePositionAction,
  clearPosition as clearPositionAction,
  doPlayNextUri,
  doSetContentHistoryItem,
  doSetShowAutoplayCountdownForUri,
} from 'redux/actions/content';
import { selectContentPositionForUri, selectPlayingUri } from 'redux/selectors/content';
import { doClaimEligiblePurchaseRewards } from 'redux/actions/rewards';
import { selectDaemonSettings, selectClientSetting, selectHomepageData } from 'redux/selectors/settings';
import {
  toggleVideoTheaterMode as toggleVideoTheaterModeAction,
  toggleAutoplayNext as toggleAutoplayNextAction,
  doSetClientSetting,
} from 'redux/actions/settings';
import { selectUserVerifiedEmail, selectUser } from 'redux/selectors/user';
import { selectRecommendedContentForUri } from 'redux/selectors/search';
import { doToast as doToastAction } from 'redux/actions/notifications';
const PLAY_POSITION_SAVE_INTERVAL_MS = 15000;
const IS_IOS = platform.isIOS();
const DQ_SETTING_PROMOTED_KEY = 'initial-quality-change'; // can't change name (shipped)

function isSameClaimUri(firstUri: string | null | undefined, secondUri: string | null | undefined): boolean {
  if (!firstUri || !secondUri) return false;
  if (firstUri === secondUri) return true;

  try {
    const firstClaimId = parseURI(firstUri).streamClaimId;
    const secondClaimId = parseURI(secondUri).streamClaimId;
    return Boolean(firstClaimId && secondClaimId && firstClaimId === secondClaimId);
  } catch (e) {
    return false;
  }
}

type Props = {
  uri: string;
  source: string;
  contentType: string;
  embedded: boolean;
  location: { search: string; pathname: string; hash: string };
  // -- withPlaybackUris HOC --
  playNextUri: string | null | undefined;
  playPreviousUri?: string;
};

/*
codesandbox of idealized/clean videojs and react 16+
https://codesandbox.io/s/71z2lm4ko6
 */
function VideoViewer(props: Props) {
  const { uri, playNextUri, playPreviousUri, source, contentType, embedded, location: routeLocation } = props;

  const dispatch = useAppDispatch();

  // -- selectors --
  const { search: routeSearch, pathname: routePathname, hash: routeHash } = routeLocation;
  const urlParams = new URLSearchParams(routeSearch);
  const autoplayParam = urlParams.get('autoplay');
  const urlPath = `lbry://${(routePathname + routeHash).slice(1)}`;
  let startTime: number | undefined;
  try {
    ({ startTime } = parseURI(urlPath));
  } catch (e) {}

  const claim = useAppSelector((state) => selectClaimForUri(state, uri));
  const position =
    startTime ||
    (urlParams.get('t') !== null
      ? urlParams.get('t')
      : useAppSelector((state) => selectContentPositionForUri(state, uri)));
  const user = useAppSelector((state) => selectUser(state));
  const userId = user && user.id;
  const internalFeature = user && user.internal_feature;
  const playingUri = useAppSelector((state) => selectPlayingUri(state));
  const collectionId = playingUri.collection.collectionId;
  const isMarkdownOrComment = playingUri.source === 'markdown' || playingUri.source === 'comment';
  const nextPlaylistUri = useAppSelector(
    (state) => collectionId && selectNextUriForUriInPlayingCollectionForId(state, collectionId, uri)
  );
  const autoplayIfEmbedded = Boolean(autoplayParam);
  const autoplayNext = useAppSelector(
    (state) => !isMarkdownOrComment && selectClientSetting(state, SETTINGS.AUTOPLAY_NEXT)
  );
  const volume = useAppSelector((state) => selectVolume(state));
  const muted = useAppSelector((state) => selectMute(state));
  const videoPlaybackRate = useAppSelector((state) => selectClientSetting(state, SETTINGS.VIDEO_PLAYBACK_RATE));
  const thumbnail = useAppSelector((state) => selectThumbnailForUri(state, uri));
  const homepageData = useAppSelector((state) => selectHomepageData(state)) || {};
  const authenticated = useAppSelector((state) => selectUserVerifiedEmail(state));
  const shareTelemetryFromSettings = useAppSelector((state) => selectDaemonSettings(state)?.share_usage_data);
  const shareTelemetry = IS_WEB || shareTelemetryFromSettings;
  const videoTheaterMode = useAppSelector((state) => selectClientSetting(state, SETTINGS.VIDEO_THEATER_MODE));
  const activeLivestreamForChannel = useAppSelector((state) =>
    selectActiveLivestreamForChannel(state, getChannelIdFromClaim(claim))
  );
  const isLivestreamClaim = isStreamPlaceholderClaim(claim);
  const defaultQuality = useAppSelector((state) => selectClientSetting(state, SETTINGS.DEFAULT_VIDEO_QUALITY));
  const isPurchasableContent = Boolean(useAppSelector((state) => selectPurchaseTagForUri(state, uri)));
  const isRentableContent = Boolean(useAppSelector((state) => selectRentalTagForUri(state, uri)));
  const purchaseMadeForClaimId = useAppSelector((state) => selectPurchaseMadeForClaimId(state, claim?.claim_id));
  const isProtectedContent = Boolean(useAppSelector((state) => selectProtectedContentTagForUri(state, uri)));
  const isDownloadDisabled = useAppSelector((state) =>
    makeSelectTagInClaimOrChannelForUri(uri, TAGS.DISABLE_DOWNLOAD_BUTTON_TAG)(state)
  );
  const recomendedContent = useAppSelector((state) => selectRecommendedContentForUri(state, uri));
  const autoPlayNextShort = useAppSelector((state) => selectClientSetting(state, SETTINGS.AUTOPLAY_NEXT_SHORTS));

  // -- dispatchers (keep original names used in body) --
  const changeVolume = (vol: number) => dispatch(doChangeVolume(vol));
  const savePosition = (uriArg: string, pos: number) => dispatch(savePositionAction(uriArg, pos));
  const clearPosition = (uriArg: string) => dispatch(clearPositionAction(uriArg));
  const changeMute = (m: boolean) => dispatch(doChangeMute(m));
  const doAnalyticsBufferFn = (uriArg: string, bufferData: any) => dispatch(doAnalyticsBuffer(uriArg, bufferData));
  const toggleVideoTheaterMode = () => dispatch(toggleVideoTheaterModeAction());
  const toggleAutoplayNext = () => dispatch(toggleAutoplayNextAction());
  const setVideoPlaybackRate = (rate: number) => dispatch(doSetClientSetting(SETTINGS.VIDEO_PLAYBACK_RATE, rate));
  const doPlayNextUriFn = (params: { uri: string }) => dispatch(doPlayNextUri(params));
  const doAnalyticsViewForUriFn = (uriArg: string) => dispatch(doAnalyticsViewForUri(uriArg));
  const claimRewards = () => dispatch(doClaimEligiblePurchaseRewards());
  const doToast = (toastProps: { message: string; linkText: string; linkTarget: string }) =>
    dispatch(doToastAction(toastProps));
  const doSetContentHistoryItemFn = (uriArg: string) => dispatch(doSetContentHistoryItem(uriArg));
  const doSetShowAutoplayCountdownForUriFn = (params: { uri: string | null | undefined; show: boolean }) =>
    dispatch(doSetShowAutoplayCountdownForUri(params));
  const doSetVideoSourceLoadedFn = (uriArg: string) => dispatch(doSetVideoSourceLoaded(uriArg));
  const videoEnded = React.useRef(false);
  const isMobile = useIsMobile();
  const shouldPlayRecommended = !nextPlaylistUri && playNextUri && autoplayNext;
  const [showRecommendationOverlay, setShowRecommendationOverlay] = useState(false);
  // DQ = Default Quality
  const dqSettingUsedBefore = Boolean(defaultQuality);
  const dqSettingPromoted = LocalStorage.getItem(DQ_SETTING_PROMOTED_KEY) === 'true';
  const promoteDqSetting = React.useRef<boolean>(!dqSettingPromoted && !dqSettingUsedBefore);
  const canPlayNext = Boolean(playNextUri || shouldPlayRecommended);
  const canPlayPrevious = Boolean(playPreviousUri);
  const claimId = claim && claim.claim_id;
  const channelTitle =
    (claim && claim.signing_channel && claim.signing_channel.value && claim.signing_channel.value.title) || '';
  const isAudio = contentType.includes('audio');
  const forcePlayer = FORCE_CONTENT_TYPE_PLAYER.includes(contentType);
  const timeParam = urlParams.get('t');
  const [playerControlBar, setControlBar] = useState();
  const [playerElem, setPlayer] = useState();
  const [isPlaying, setIsPlaying] = useState(false);
  const vjsCallbackDataRef: any = React.useRef();
  const embedContext = useContext(EmbedContext);
  const isEmbedded = Boolean(embedContext) || embedded || window.location.pathname.includes('/$/embed/');
  const showEmbedEndOverlay = embedContext && embedContext.videoEnded;

  /* isLoading was designed to show loading screen on first play press, rather than completely black screen, but
  breaks because some browsers (e.g. Firefox) block autoplay but leave the player.play Promise pending */
  const [videoNode, setVideoNode] = useState();
  const [localAutoplayNext, setLocalAutoplayNext] = useState(autoplayNext);
  const isFirstRender = React.useRef(true);
  const playerRef = React.useRef(null);
  const addAutoplayNextButton = useAutoplayNext(playerRef, autoplayNext, isMarkdownOrComment);
  const addTheaterModeButton = useTheaterMode(playerRef, videoTheaterMode);
  React.useEffect(() => {
    if (defaultQuality) {
      promoteDqSetting.current = false;

      if (!dqSettingPromoted) {
        LocalStorage.setItem(DQ_SETTING_PROMOTED_KEY, 'true');
      }
    }
  }, [defaultQuality, dqSettingPromoted]);
  React.useEffect(() => {
    if (isPlaying) {
      // save the updated watch time
      doSetContentHistoryItemFn(claim.permanent_url);
    } // eslint-disable-next-line react-hooks/exhaustive-deps -- @see TODO_NEED_VERIFICATION
  }, [isPlaying]);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    toggleAutoplayNext(); // eslint-disable-next-line react-hooks/exhaustive-deps -- @see TODO_NEED_VERIFICATION
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
  // Update vjsCallbackDataRef (ensures videojs callbacks are not using stale values):
  useEffect(() => {
    vjsCallbackDataRef.current = {
      embedded: isEmbedded,
      videoPlaybackRate: videoPlaybackRate,
    };
  }, [isEmbedded, videoPlaybackRate]);
  const handlePlayNextUri = React.useCallback(() => {
    if (playNextUri && isSameClaimUri(playNextUri, uri) && playerRef.current) {
      const player: any = playerRef.current;
      player.currentTime(0);
      player.play();
      return;
    }

    if (shouldPlayRecommended) {
      if (IS_IOS) {
        // Safari doesn't like it when there is an async action between click
        // and `player.play()`. Chrome allows it. Skip the countdown for now.
        dispatch(
          doPlayNextUri({
            uri: playNextUri,
          })
        );
      } else {
        dispatch(
          doSetShowAutoplayCountdownForUri({
            uri,
            show: true,
          })
        );
      }
    } else if (playNextUri) {
      dispatch(
        doPlayNextUri({
          uri: playNextUri,
        })
      );
    }
  }, [dispatch, playNextUri, shouldPlayRecommended, uri]);
  const handlePlayPreviousUri = React.useCallback(() => {
    if (videoNode && videoNode.currentTime > 5) {
      videoNode.currentTime = 0;
    } else if (playPreviousUri) {
      dispatch(
        doPlayNextUri({
          uri: playPreviousUri,
        })
      );
    }
  }, [dispatch, playPreviousUri, videoNode]);
  React.useEffect(() => {
    if (!playerControlBar) return;
    try {
      const existingPlayPreviousButton = playerControlBar.getChild('PlayPreviousButton');
      if (existingPlayPreviousButton) {
        playerControlBar.removeChild('PlayPreviousButton');
      }

      if (playerElem && canPlayPrevious) {
        addPlayPreviousButton(playerElem, handlePlayPreviousUri);
      }

      const existingPlayNextButton = playerControlBar.getChild('PlayNextButton');
      if (existingPlayNextButton) {
        playerControlBar.removeChild('PlayNextButton');
      }

      if (playerElem && canPlayNext) {
        addPlayNextButton(playerElem, handlePlayNextUri);
      }
    } catch (e) {
      // Player control bar may be disposed during navigation
    }
  }, [canPlayNext, canPlayPrevious, handlePlayNextUri, handlePlayPreviousUri, playerControlBar, playerElem]);
  const onVideoEnded = React.useCallback(() => {
    videoEnded.current = true;
    analytics.video.videoIsPlaying(false);

    if (embedContext) {
      embedContext.setVideoEnded(true);
    } else {
      if (canPlayNext) {
        handlePlayNextUri();
      } else {
        setShowRecommendationOverlay(true);
      }
    }

    dispatch(clearPositionAction(uri));

    if (IS_IOS && !autoplayNext) {
      // show play button on ios if video is paused with no autoplay on
      document.querySelector('.vjs-touch-overlay')?.classList.add('show-play-toggle'); // eslint-disable-line no-unused-expressions
    }
  }, [canPlayNext, autoplayNext, dispatch, embedContext, handlePlayNextUri, uri]);
  React.useEffect(() => {
    if (playerElem) {
      playerElem.off('ended');
      playerElem.on('ended', onVideoEnded);
    }
  }, [onVideoEnded, playerElem]);

  // MORE ON PLAY STUFF
  function onPlay(player) {
    setShowRecommendationOverlay(false);
    videoEnded.current = false;

    if (isEmbedded) {
      try {
        setIsPlaying(true);
      } catch (error) {}
    }

    doSetShowAutoplayCountdownForUriFn({
      uri,
      show: false,
    });
    if (embedContext) embedContext.setVideoEnded(false);
    analytics.video.videoIsPlaying(true, player);
  }

  function onPause(event, player) {
    setIsPlaying(false);
    handlePosition(player);
    analytics.video.videoIsPlaying(false, player);
  }

  function onPlayerClosed(event, player) {
    setShowRecommendationOverlay(false);
    handlePosition(player);
    analytics.video.videoIsPlaying(false, player);
  }

  function handlePosition(player) {
    try {
      if (!isLivestreamClaim && uri && savePosition && player) {
        savePosition(uri, player.currentTime());
      }
    } catch (error) {}
  }

  function restorePlaybackRate(player) {
    if (!vjsCallbackDataRef.current.embedded) {
      player.playbackRate(vjsCallbackDataRef.current.videoPlaybackRate);
    }
  }

  const playerReadyDependencyList = [muted, uri, isEmbedded, autoplayIfEmbedded];
  const onPlayerReady = useCallback((player: Player, videoNode: any) => {
    // add buttons and initialize some settings for the player
    setVideoNode(videoNode);
    player.muted(muted || autoplayIfEmbedded);
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
        addPlayNextButton(player, handlePlayNextUri);
        addPlayPreviousButton(player, handlePlayPreviousUri);
      }

      addAutoplayNextButton(player, () => setLocalAutoplayNext((e) => !e), autoplayNext);
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

    const onError = () => {
      // @if TARGET='DISABLE_FOR_NOW'
      const mediaError = player.error();

      if (mediaError) {
        let fingerprint;

        if (mediaError.message.match(/^video append of (.*) failed for segment (.*) in playlist (.*).m3u8$/)) {
          fingerprint = ['videojs-media-segment-append'];
        } else if (mediaError.message.match(/^audio append of (.*) failed for segment (.*) in playlist (.*).m3u8$/)) {
          fingerprint = ['videojs-media-segment-append--audio'];
        }

        const options = fingerprint
          ? {
              fingerprint,
            }
          : {};
        analytics.log(`[${mediaError.code}] ${mediaError.message}`, options, ERR_GRP.VIDEOJS);
      } // @endif
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
      if (timeParam && !Number.isNaN(timeParam)) {
        player.currentTime(Number(timeParam));
      } else if (position && !isLivestreamClaim) {
        const avDuration = claim?.value?.video?.duration || claim?.value?.audio?.duration;
        player.currentTime(avDuration && position >= avDuration - 100 ? 0 : position);
      }
    };

    function onSeeking() {
      setShowRecommendationOverlay(false);
    }

    function onQualityChanged() {
      if (promoteDqSetting.current && !isEmbedded) {
        promoteDqSetting.current = false;
        LocalStorage.setItem(DQ_SETTING_PROMOTED_KEY, 'true');
        doToast({
          message: __('You can also change your default quality on settings.'),
          linkText: __('Settings'),
          linkTarget: '/settings',
        });
      }
    }

    // load events onto playerplayerRef
    player.on('play', onPlay);
    player.on('pause', onPauseEvent);
    player.on(VJS_EVENTS.PLAYER_CLOSED, onPlayerClosedEvent);
    player.on('ended', onVideoEnded);
    player.on('error', onError);
    player.on('volumechange', onVolumeChange);
    player.on('ratechange', onRateChange);
    player.on('loadedmetadata', overrideAutoAlgorithm);
    player.on('loadedmetadata', restorePlaybackRateEvent);
    player.on('seeking', onSeeking);
    player.on('hlsQualitySelector:changed:user', onQualityChanged);
    player.one('loadedmetadata', moveToPosition);

    const cancelOldEvents = () => {
      player.off('play', onPlay);
      player.off('pause', onPauseEvent);
      player.off(VJS_EVENTS.PLAYER_CLOSED, onPlayerClosedEvent);
      player.off('ended', onVideoEnded);
      player.off('error', onError);
      player.off('volumechange', onVolumeChange);
      player.off('ratechange', onRateChange);
      player.off('loadedmetadata', overrideAutoAlgorithm);
      player.off('loadedmetadata', restorePlaybackRateEvent);
      player.off(VJS_EVENTS.PLAYER_CLOSED, cancelOldEvents);
      player.off('loadedmetadata', moveToPosition);
      player.off('seeking', onSeeking);
    };

    // turn off old events to prevent duplicate runs
    player.on(VJS_EVENTS.PLAYER_CLOSED, cancelOldEvents);
    // add (or remove) chapters button and time tooltips when video is ready
    player.one('loadstart', () => Chapters.parseAndLoad(player, claim));
    playerRef.current = player;
  }, playerReadyDependencyList);

  // eslint-disable-line
  // --- This is problematic --------^
  // Issues like #2134 and #2634 happen because of this stale closure.
  // Unfortunately, we cannot just update the dependencies blindly, as it will
  // cause the child to render and might cause even more problems.
  // Live with it until we break apart into proper abstraction
  function replay() {
    playerRef.current.currentTime(0);
    playerRef.current.play();
  }

  const [hovered, setHovered] = useState(false);
  return (
    <>
      {isEmbedded && (
        <div
          className={classnames({
            'file-viewer__embedded-header-hide': isPlaying,
          })}
        >
          <FileViewerEmbeddedTitle uri={uri} />
        </div>
      )}

      <div
        className={classnames('file-viewer', {
          'file-viewer--is-playing': isPlaying,
          'file-viewer--ended-embed': showEmbedEndOverlay,
        })}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {showEmbedEndOverlay && <FileViewerEmbeddedEnded uri={uri} />}
        {showRecommendationOverlay && (
          <div className="recommendation-overlay-wrapper">
            <div className="recommendation-overlay-grid">
              {recomendedContent &&
                recomendedContent.slice(0, 9).map((url, i) => (
                  <div
                    key={url}
                    onClick={() => {
                      i === 4 && isMobile
                        ? replay()
                        : doPlayNextUriFn({
                            uri: url,
                          });
                    }}
                  >
                    <ClaimPreviewTile uri={url} onClickHandledByParent />
                  </div>
                ))}
            </div>
          </div>
        )}

        <VideoJs
          source={source}
          sourceType={forcePlayer ? 'video/mp4' : contentType}
          isAudio={isAudio}
          poster={isAudio ? thumbnail : ''}
          onPlayerReady={onPlayerReady}
          startMuted={autoplayIfEmbedded}
          toggleVideoTheaterMode={toggleVideoTheaterMode}
          claimId={claimId}
          title={claim && ((claim.value && claim.value.title) || claim.name)}
          channelTitle={channelTitle}
          userId={userId}
          internalFeatureEnabled={internalFeature}
          shareTelemetry={shareTelemetry}
          playNext={handlePlayNextUri}
          playPrevious={handlePlayPreviousUri}
          embedded={isEmbedded}
          embeddedInternal={isMarkdownOrComment}
          claimValues={claim.value}
          doAnalyticsViewForUri={doAnalyticsViewForUriFn}
          doAnalyticsBuffer={doAnalyticsBufferFn}
          claimRewards={claimRewards}
          uri={uri}
          userClaimId={claim && claim.signing_channel && claim.signing_channel.claim_id}
          isLivestreamClaim={isLivestreamClaim}
          activeLivestreamForChannel={activeLivestreamForChannel}
          defaultQuality={defaultQuality}
          doToast={doToast}
          isPurchasableContent={isPurchasableContent}
          isRentableContent={isRentableContent}
          isProtectedContent={isProtectedContent}
          isDownloadDisabled={isDownloadDisabled}
          isUnlisted={isClaimUnlisted(claim)}
          doSetVideoSourceLoaded={doSetVideoSourceLoadedFn}
          autoPlayNextShort={autoPlayNextShort}
        />

        {isEmbedded && authenticated && !showEmbedEndOverlay && (hovered || !isPlaying) && (
          <div className="embed-reactions-overlay" aria-label={__('Reactions')}>
            <FileReactions uri={uri} />
          </div>
        )}
      </div>
    </>
  );
}

export default VideoViewer;
