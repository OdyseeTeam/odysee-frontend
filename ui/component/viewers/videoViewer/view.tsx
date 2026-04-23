import React, { useEffect, useState, useContext, useCallback } from 'react';
import VideoJs from './internal/videojs';
import analytics from 'analytics';
import { EmbedContext } from 'contexts/embed';
import classnames from 'classnames';
import { FORCE_CONTENT_TYPE_PLAYER } from 'constants/claim';
import FileViewerEmbeddedEnded from './internal/fileViewerEmbeddedEnded';
import ClaimPreviewTile from 'component/claimPreviewTile';
import FileReactions from 'component/fileReactions';
import { useLocation } from 'react-router-dom';
import debounce from 'util/debounce';
import useInterval from 'effects/use-interval';
import { isClaimUnlisted } from 'util/claim';
import { platform } from 'util/platform';
import { LocalStorage } from 'util/storage';
import { useIsMobile } from 'effects/use-screensize';
import { isEmbedPath } from 'util/embed';

const PLAY_POSITION_SAVE_INTERVAL_MS = 15000;
const POSITION_SYNC_INTERVAL_MS = 30000;
const IS_IOS = platform.isIOS();
const DQ_SETTING_PROMOTED_KEY = 'initial-quality-change';

type Props = {
  uri: string;
  source?: string;
  contentType?: string;
  embedded?: boolean;
  changeVolume: (volume: number) => void;
  changeMute: (muted: boolean) => void;
  videoPlaybackRate: number;
  thumbnail?: string;
  position?: number;
  claim?: any;
  muted: boolean;
  volume: number;
  autoplayNext?: boolean;
  autoplayIfEmbedded?: boolean;
  doAnalyticsBuffer?: (...args: any[]) => void;
  doAnalyticsViewForUri?: (...args: any[]) => void;
  claimRewards?: (...args: any[]) => void;
  savePosition?: (uri: string, position: number) => void;
  clearPosition: (uri: string) => void;
  toggleVideoTheaterMode: () => void;
  toggleAutoplayNext: () => void;
  floatingPlayer?: boolean;
  toggleFloatingPlayer: () => void;
  autoplayMedia?: boolean;
  toggleAutoplayMedia: () => void;
  setVideoPlaybackRate: (rate: number) => void;
  authenticated?: boolean;
  userId?: string | number;
  shareTelemetry?: boolean;
  doPlayNextUri: (params: { uri: string }) => void;
  recomendedContent?: string[];
  nextPlaylistUri?: string | null;
  videoTheaterMode?: boolean;
  isMarkdownOrComment?: boolean;
  isLivestreamClaim?: boolean;
  activeLivestreamForChannel?: any;
  defaultQuality?: string | null;
  doToast?: (...args: any[]) => void;
  doSetContentHistoryItem: (uri: string) => void;
  isPurchasableContent?: boolean;
  isRentableContent?: boolean;
  isProtectedContent?: boolean;
  isDownloadDisabled?: boolean;
  doSetShowAutoplayCountdownForUri: (params: { uri: string; show: boolean }) => void;
  doSetVideoSourceLoaded: (uri: string) => void;
  doSyncLastPosition?: (uri: string, position: number) => void;
  autoPlayNextShort?: boolean;
  isFloating?: boolean;
  playNextUri?: string | null;
  playPreviousUri?: string | null;
};

function VideoViewer(props: Props) {
  const {
    uri,
    playNextUri,
    playPreviousUri,
    source,
    contentType,
    embedded,
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
    floatingPlayer,
    toggleFloatingPlayer,
    autoplayMedia,
    toggleAutoplayMedia,
    setVideoPlaybackRate,
    authenticated,
    userId,
    shareTelemetry,
    doPlayNextUri,
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
    doSyncLastPosition,
    autoPlayNextShort,
    isFloating,
  } = props;

  const videoEnded = React.useRef(false);
  const isMobile = useIsMobile();

  const shouldPlayRecommended = !nextPlaylistUri && playNextUri && autoplayNext;
  const [showRecommendationOverlay, setShowRecommendationOverlay] = useState(false);

  const dqSettingUsedBefore = Boolean(defaultQuality);
  const dqSettingPromoted = LocalStorage.getItem(DQ_SETTING_PROMOTED_KEY) === 'true';
  const promoteDqSetting = React.useRef(!dqSettingPromoted && !dqSettingUsedBefore);

  const canPlayNext = Boolean(playNextUri || shouldPlayRecommended);
  const canPlayPrevious = Boolean(playPreviousUri);

  const claimId = claim && claim.claim_id;
  const channelClaimId = claim && claim.signing_channel && claim.signing_channel.claim_id;
  const channelTitle =
    (claim && claim.signing_channel && claim.signing_channel.value && claim.signing_channel.value.title) || '';
  const isAudio = Boolean(contentType?.includes('audio'));
  const forcePlayer = Boolean(contentType && FORCE_CONTENT_TYPE_PLAYER.includes(contentType));

  const { search } = useLocation();

  const urlParams = new URLSearchParams(search);
  const timeParam = urlParams.get('t');

  const [isPlaying, setIsPlaying] = useState(false);

  const embedContext = useContext(EmbedContext);
  const isExternalEmbed = Boolean(embedContext) || isEmbedPath(window.location.pathname);
  const isEmbedded = isExternalEmbed || embedded;
  const showEmbedEndOverlay = embedContext && embedContext.videoEnded;

  const [videoNode, setVideoNode] = useState<HTMLVideoElement | null>(null);

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
      doSetContentHistoryItem(claim.permanent_url);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  const handleToggleAutoplayNext = useCallback(() => toggleAutoplayNext(), [toggleAutoplayNext]);
  const handleToggleFloatingPlayer = useCallback(() => toggleFloatingPlayer(), [toggleFloatingPlayer]);
  const handleToggleAutoplayMedia = useCallback(() => toggleAutoplayMedia(), [toggleAutoplayMedia]);

  useInterval(
    () => {
      if (videoNode && isPlaying && !isLivestreamClaim) {
        handlePosition(videoNode);
      }
    },
    !isLivestreamClaim ? PLAY_POSITION_SAVE_INTERVAL_MS : null
  );

  const updateVolumeState = React.useCallback(
    debounce((volume: number, muted: boolean) => {
      changeVolume(volume);
      changeMute(muted);
    }, 500),
    []
  );

  const handlePlayNextUri = React.useCallback(
    (options?: { manual?: boolean }) => {
      const manual = options && options.manual;
      if (shouldPlayRecommended) {
        if (manual || IS_IOS) {
          doPlayNextUri({ uri: playNextUri });
        } else {
          doSetShowAutoplayCountdownForUri({ uri, show: true });
        }
      } else if (playNextUri) {
        doPlayNextUri({ uri: playNextUri });
      }
    },
    [doPlayNextUri, doSetShowAutoplayCountdownForUri, playNextUri, shouldPlayRecommended, uri]
  );

  const handlePlayPreviousUri = React.useCallback(() => {
    if (videoNode && videoNode.currentTime > 5) {
      videoNode.currentTime = 0;
    } else if (playPreviousUri) {
      doPlayNextUri({ uri: playPreviousUri });
    }
  }, [doPlayNextUri, playPreviousUri, videoNode]);

  const onVideoEndedRef = React.useRef<() => void>(() => {});

  const onVideoEnded = React.useCallback(() => {
    if (videoNode?.loop) {
      videoNode.currentTime = 0;
      videoNode.play().catch(() => {});
      return;
    }

    videoEnded.current = true;
    analytics.video.videoIsPlaying(false, window.player);

    const isShorts = !!document.querySelector('.shorts-page__container');
    if (isShorts) {
      clearPosition(uri);
      return;
    }

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
  }, [canPlayNext, clearPosition, embedContext, handlePlayNextUri, uri]);

  React.useEffect(() => {
    onVideoEndedRef.current = onVideoEnded;
  }, [onVideoEnded]);

  const lastSyncTimeRef = React.useRef(0);

  function handlePosition(node: HTMLVideoElement, forceSync = false) {
    try {
      if (!isLivestreamClaim && uri && savePosition && node) {
        const currentTime = node.currentTime;
        savePosition(uri, currentTime);

        if (doSyncLastPosition && currentTime > 0) {
          const now = Date.now();
          if (forceSync || now - lastSyncTimeRef.current > POSITION_SYNC_INTERVAL_MS) {
            lastSyncTimeRef.current = now;
            doSyncLastPosition(uri, currentTime);
          }
        }
      }
    } catch (error) {}
  }

  const onPlayerReady = useCallback(
    (_player: any, node: HTMLVideoElement) => {
      setVideoNode(node);

      // Restore position
      const parsedTime = Number(timeParam);
      if (timeParam && isFinite(parsedTime) && parsedTime > 0) {
        node.currentTime = parsedTime;
      } else if (position && isFinite(position) && !isLivestreamClaim) {
        const avDuration = claim?.value?.video?.duration || claim?.value?.audio?.duration;
        node.currentTime = avDuration && position >= avDuration - 100 ? 0 : position;
      }

      // Set initial state from redux
      if (muted || autoplayIfEmbedded) {
        node.muted = true;
      }
      node.volume = volume;
      node.playbackRate = videoPlaybackRate;
      const restoreRate = () => {
        node.playbackRate = videoPlaybackRate;
      };
      node.addEventListener('canplay', restoreRate, { once: true });
      node.addEventListener('playing', restoreRate, { once: true });

      // Listen for ended event (use ref to always call the latest callback)
      const handleEnded = () => onVideoEndedRef.current();
      node.addEventListener('ended', handleEnded);

      // Track play state
      const handlePlay = () => {
        setShowRecommendationOverlay(false);
        videoEnded.current = false;
        setIsPlaying(true);
        doSetShowAutoplayCountdownForUri({ uri, show: false });
        if (embedContext) embedContext.setVideoEnded(false);
        if (window.cordova && window.odysee?.functions?.onPlay) {
          window.odysee.functions.onPlay(claim, channelTitle, thumbnail);
        }
      };
      const handlePause = () => {
        setIsPlaying(false);
        handlePosition(node, true);
        if (window.cordova && window.odysee?.functions?.onPause) {
          window.odysee.functions.onPause();
        }
      };
      const handleVolumeChange = () => {
        updateVolumeState(node.volume, node.muted);
      };
      let unmounted = false;
      const handleRateChange = () => {
        if (node.readyState > 0 && !unmounted) {
          setVideoPlaybackRate(node.playbackRate);
        }
      };

      node.addEventListener('play', handlePlay);
      node.addEventListener('pause', handlePause);
      node.addEventListener('volumechange', handleVolumeChange);
      node.addEventListener('ratechange', handleRateChange);

      return () => {
        unmounted = true;
        node.removeEventListener('ended', handleEnded);
        node.removeEventListener('play', handlePlay);
        node.removeEventListener('pause', handlePause);
        node.removeEventListener('volumechange', handleVolumeChange);
        node.removeEventListener('ratechange', handleRateChange);
        if (window.cordova && window.odysee?.functions?.onPause) {
          window.odysee.functions.onPause();
        }
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [muted, uri, isEmbedded, autoplayIfEmbedded]
  );

  function replay() {
    if (videoNode) {
      videoNode.currentTime = 0;
      videoNode.play();
    }
  }

  const [hovered, setHovered] = useState(false);

  return (
    <>
      <div
        className={classnames('file-viewer', {
          'file-viewer--is-playing': isPlaying,
          'file-viewer--ended-embed': showEmbedEndOverlay,
          'file-viewer--ended': showRecommendationOverlay,
        })}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {showEmbedEndOverlay && <FileViewerEmbeddedEnded uri={uri} doReplay={replay} />}
        {showRecommendationOverlay && (
          <div className="recommendation-overlay-wrapper">
            <div className="recommendation-overlay-grid">
              {recomendedContent &&
                recomendedContent.slice(0, 9).map((url, i) => (
                  <div
                    key={url}
                    onClick={() => {
                      i === 4 && isMobile ? replay() : doPlayNextUri({ uri: url });
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
          thumbnail={thumbnail}
          onPlayerReady={onPlayerReady}
          startMuted={autoplayIfEmbedded}
          toggleVideoTheaterMode={toggleVideoTheaterMode}
          claimId={claimId}
          title={claim && ((claim.value && claim.value.title) || claim.name)}
          channelTitle={channelTitle}
          userId={userId}
          shareTelemetry={shareTelemetry}
          playNext={handlePlayNextUri}
          playPrevious={handlePlayPreviousUri}
          embedded={isEmbedded}
          externalEmbed={isExternalEmbed}
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
          autoPlayNextShort={autoPlayNextShort}
          canPlayNext={canPlayNext}
          canPlayPrevious={canPlayPrevious}
          autoplayNext={autoplayNext}
          onToggleAutoplayNext={handleToggleAutoplayNext}
          floatingPlayer={floatingPlayer}
          onToggleFloatingPlayer={handleToggleFloatingPlayer}
          autoplayMedia={autoplayMedia}
          onToggleAutoplayMedia={handleToggleAutoplayMedia}
          videoTheaterMode={videoTheaterMode}
          isMarkdownOrComment={isMarkdownOrComment}
          isFloating={isFloating}
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
