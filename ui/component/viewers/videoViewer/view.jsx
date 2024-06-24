// @flow

import { ENABLE_PREROLL_ADS } from 'config';
import { ERR_GRP } from 'constants/errors';
import * as PAGES from 'constants/pages';
import * as ICONS from 'constants/icons';
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
import { useGetAds } from 'effects/use-get-ads';
import Button from 'component/button';
import I18nMessage from 'component/i18nMessage';
import ClaimPreviewTile from 'component/claimPreviewTile';
import { useHistory } from 'react-router';
import { getAllIds } from 'util/buildHomepage';
import type { HomepageCat } from 'util/buildHomepage';
import debounce from 'util/debounce';
import useInterval from 'effects/use-interval';
import { lastBandwidthSelector } from './internal/plugins/videojs-http-streaming--override/playlist-selectors';
import { isClaimUnlisted } from 'util/claim';
import { platform } from 'util/platform';
import { LocalStorage } from 'util/storage';
import { useIsMobile } from 'effects/use-screensize';

const PLAY_POSITION_SAVE_INTERVAL_MS = 15000;
const IS_IOS = platform.isIOS();
const DQ_SETTING_PROMOTED_KEY = 'initial-quality-change'; // can't change name (shipped)

type Props = {
  uri: string,
  source: string,
  contentType: string,
  embedded: boolean,

  // -- withPlaybackUris HOC --
  playNextUri: ?string,
  playPreviousUri?: string,

  // -- redux --
  position: number,
  changeVolume: (number) => void,
  changeMute: (boolean) => void,
  thumbnail: string,
  claim: StreamClaim,
  muted: boolean,
  videoPlaybackRate: number,
  volume: number,
  autoplayNext: boolean,
  autoplayIfEmbedded: boolean,
  doAnalyticsBuffer: (string, any) => void,
  savePosition: (string, number) => void,
  clearPosition: (string) => void,
  toggleVideoTheaterMode: () => void,
  toggleAutoplayNext: () => void,
  setVideoPlaybackRate: (number) => void,
  authenticated: boolean,
  userId: number,
  internalFeature: boolean,
  homepageData?: { [string]: HomepageCat },
  shareTelemetry: boolean,
  doPlayNextUri: (params: { uri: string }) => void,
  collectionId: string,
  /// nextRecommendedUri: string,
  // channelName: string,
  recomendedContent: any,
  nextPlaylistUri: string,
  videoTheaterMode: boolean,
  isMarkdownOrComment: boolean,
  doAnalyticsViewForUri: (string) => void,
  claimRewards: () => void,
  isLivestreamClaim: boolean,
  activeLivestreamForChannel: ?LivestreamActiveClaim,
  defaultQuality: ?string,
  doToast: ({ message: string, linkText: string, linkTarget: string }) => void,
  doSetContentHistoryItem: (uri: string) => void,
  doClearContentHistoryUri: (uri: string) => void,
  isPurchasableContent: boolean,
  isRentableContent: boolean,
  purchaseMadeForClaimId: boolean,
  isProtectedContent: boolean,
  isDownloadDisabled: boolean,
  doSetShowAutoplayCountdownForUri: (params: { uri: ?string, show: boolean }) => void,
  doSetVideoSourceLoaded: (uri: string) => void,
};

/*
codesandbox of idealized/clean videojs and react 16+
https://codesandbox.io/s/71z2lm4ko6
 */

function VideoViewer(props: Props) {
  const {
    uri,
    playNextUri,
    playPreviousUri,
    source,
    contentType,
    embedded,
    // -- redux --
    changeVolume,
    changeMute,
    videoPlaybackRate,
    thumbnail,
    position,
    claim,
    muted,
    volume,
    autoplayNext,
    autoplayIfEmbedded,
    doAnalyticsBuffer,
    doAnalyticsViewForUri,
    claimRewards,
    savePosition,
    clearPosition,
    toggleVideoTheaterMode,
    toggleAutoplayNext,
    setVideoPlaybackRate,
    homepageData,
    authenticated,
    userId,
    internalFeature,
    shareTelemetry,
    doPlayNextUri,
    collectionId,
    // nextRecommendedUri,
    // channelName,
    recomendedContent,
    nextPlaylistUri,
    videoTheaterMode,
    isMarkdownOrComment,
    isLivestreamClaim,
    activeLivestreamForChannel,
    defaultQuality,
    doToast,
    doSetContentHistoryItem,
    isPurchasableContent,
    isRentableContent,
    isProtectedContent,
    isDownloadDisabled,
    doSetShowAutoplayCountdownForUri,
    doSetVideoSourceLoaded,
  } = props;

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

  const adApprovedChannelIds = homepageData ? getAllIds(homepageData) : [];
  const claimId = claim && claim.claim_id;
  const channelClaimId = claim && claim.signing_channel && claim.signing_channel.claim_id;
  const channelTitle =
    (claim && claim.signing_channel && claim.signing_channel.value && claim.signing_channel.value.title) || '';
  const isAudio = contentType.includes('audio');
  const forcePlayer = FORCE_CONTENT_TYPE_PLAYER.includes(contentType);

  const {
    location: { pathname, search },
  } = useHistory();

  const urlParams = new URLSearchParams(search);
  const timeParam = urlParams.get('t');

  const [playerControlBar, setControlBar] = useState();
  const [playerElem, setPlayer] = useState();
  const [isPlaying, setIsPlaying] = useState(false);
  const vjsCallbackDataRef: any = React.useRef();

  const embedContext = useContext(EmbedContext);
  const isEmbedded = Boolean(embedContext) || embedded || window.location.pathname.includes('/$/embed/');
  const showEmbedEndOverlay = embedContext && embedContext.videoEnded;

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
      doSetContentHistoryItem(claim.permanent_url);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- @see TODO_NEED_VERIFICATION
  }, [isPlaying]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    toggleAutoplayNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- @see TODO_NEED_VERIFICATION
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
    if (shouldPlayRecommended) {
      if (IS_IOS) {
        // Safari doesn't like it when there is an async action between click
        // and `player.play()`. Chrome allows it. Skip the countdown for now.

        // $FlowIgnore: shouldPlayRecommended guarantees non-null playNextUri
        doPlayNextUri({ uri: playNextUri });
      } else {
        doSetShowAutoplayCountdownForUri({ uri, show: true });
      }
    } else if (playNextUri) {
      doPlayNextUri({ uri: playNextUri });
    }
  }, [doPlayNextUri, doSetShowAutoplayCountdownForUri, playNextUri, shouldPlayRecommended, uri]);

  const handlePlayPreviousUri = React.useCallback(() => {
    if (videoNode && videoNode.currentTime > 5) {
      videoNode.currentTime = 0;
    } else if (playPreviousUri) {
      doPlayNextUri({ uri: playPreviousUri });
    }
  }, [doPlayNextUri, playPreviousUri, videoNode]);

  React.useEffect(() => {
    if (!playerControlBar) return;

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
  }, [canPlayNext, canPlayPrevious, handlePlayNextUri, handlePlayPreviousUri, playerControlBar, playerElem]);

  const onVideoEnded = React.useCallback(() => {
    videoEnded.current = true;
    analytics.video.videoIsPlaying(false);

    if (adUrl) return setAdUrl(null);

    if (embedContext) {
      embedContext.setVideoEnded(true);
    } else {
      if (canPlayNext) {
        handlePlayNextUri();
      } else {
        setShowRecommendationOverlay(true);
      }
    }

    clearPosition(uri);

    if (IS_IOS && !autoplayNext) {
      // show play button on ios if video is paused with no autoplay on
      // $FlowFixMe
      document.querySelector('.vjs-touch-overlay')?.classList.add('show-play-toggle'); // eslint-disable-line no-unused-expressions
    }
  }, [adUrl, canPlayNext, autoplayNext, clearPosition, embedContext, handlePlayNextUri, setAdUrl, uri]);

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
    doSetShowAutoplayCountdownForUri({ uri, show: false });
    if (embedContext) embedContext.setVideoEnded(false);
    analytics.video.videoIsPlaying(true, player);
    if (window.cordova) window.odysee.functions.onPlay(claim, channelTitle, thumbnail);
  }

  function onPause(event, player) {
    setIsPlaying(false);
    handlePosition(player);
    analytics.video.videoIsPlaying(false, player);
    if (window.cordova) window.odysee.functions.onPause();
  }

  function onPlayerClosed(event, player) {
    setShowRecommendationOverlay(false);
    handlePosition(player);
    analytics.video.videoIsPlaying(false, player);
    if (window.cordova) window.odysee.functions.onPause();
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

  const playerReadyDependencyList = [muted, uri, adUrl, isEmbedded, autoplayIfEmbedded];

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

        const options = { ...(fingerprint ? { fingerprint } : {}) };
        analytics.log(`[${mediaError.code}] ${mediaError.message}`, options, ERR_GRP.VIDEOJS);
      }
      // @endif
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
  }, playerReadyDependencyList); // eslint-disable-line
  // --- This is problematic --------^
  // Issues like #2134 and #2634 happen because of this stale closure.
  // Unfortunately, we cannot just update the dependencies blindly, as it will
  // cause the child to render and might cause even more problems.
  // Live with it until we break apart into proper abstraction

  function replay() {
    // $FlowIgnore
    playerRef.current.currentTime(0);
    // $FlowIgnore
    playerRef.current.play();
  }

  return (
    <>
      {isEmbedded && (
        <div className={classnames({ 'file-viewer__embedded-header-hide': isPlaying })}>
          <FileViewerEmbeddedTitle uri={uri} />
        </div>
      )}

      <div
        className={classnames('file-viewer', {
          'file-viewer--is-playing': isPlaying,
          'file-viewer--ended-embed': showEmbedEndOverlay,
        })}
      >
        {showEmbedEndOverlay && <FileViewerEmbeddedEnded uri={uri} />}
        {showRecommendationOverlay && (
          <div className="recommendation-overlay-wrapper">
            <div className="recommendation-overlay-grid">
              {recomendedContent &&
                recomendedContent.slice(0, 9).map((url, i) => (
                  <div key={url} onClick={() => (i === 4 && isMobile ? replay() : doPlayNextUri({ uri: url }))}>
                    <ClaimPreviewTile uri={url} />
                  </div>
                ))}
            </div>
          </div>
        )}

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
          adUrl={adUrl}
          source={adUrl || source}
          sourceType={forcePlayer || adUrl ? 'video/mp4' : contentType}
          isAudio={isAudio}
          poster={isAudio ? thumbnail : ''}
          onPlayerReady={onPlayerReady}
          startMuted={autoplayIfEmbedded}
          toggleVideoTheaterMode={toggleVideoTheaterMode}
          claimId={claimId}
          title={claim && ((claim.value && claim.value.title) || claim.name)}
          channelTitle={channelTitle}
          userId={userId}
          allowPreRoll={!authenticated} // TODO: pull this into ads functionality so it's self contained
          internalFeatureEnabled={internalFeature}
          shareTelemetry={shareTelemetry}
          playNext={handlePlayNextUri}
          playPrevious={handlePlayPreviousUri}
          embedded={isEmbedded}
          embeddedInternal={isMarkdownOrComment}
          claimValues={claim.value}
          doAnalyticsViewForUri={doAnalyticsViewForUri}
          doAnalyticsBuffer={doAnalyticsBuffer}
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
          doSetVideoSourceLoaded={doSetVideoSourceLoaded}
        />
      </div>
    </>
  );
}

export default VideoViewer;
