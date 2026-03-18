// @flow
import { ENABLE_PREROLL_ADS } from 'config';
import * as PAGES from 'constants/pages';
import * as ICONS from 'constants/icons';
import React, { useEffect, useState, useContext, useCallback } from 'react';
import VideoJs from './internal/videojs';
import analytics from 'analytics';
import { EmbedContext } from 'contexts/embed';
import classnames from 'classnames';
import { FORCE_CONTENT_TYPE_PLAYER } from 'constants/claim';
import FileViewerEmbeddedEnded from './internal/fileViewerEmbeddedEnded';
import { useGetAds } from 'effects/use-get-ads';
import Button from 'component/button';
import I18nMessage from 'component/i18nMessage';
import ClaimPreviewTile from 'component/claimPreviewTile';
import FileReactions from 'component/fileReactions';
import { useHistory } from 'react-router';
import { getAllIds } from 'util/buildHomepage';
import type { HomepageCat } from 'util/buildHomepage';
import debounce from 'util/debounce';
import useInterval from 'effects/use-interval';
import { isClaimUnlisted } from 'util/claim';
import { parseURI } from 'util/lbryURI';
import { platform } from 'util/platform';
import { LocalStorage } from 'util/storage';
import { useIsMobile } from 'effects/use-screensize';

const PLAY_POSITION_SAVE_INTERVAL_MS = 15000;
const IS_IOS = platform.isIOS();
const DQ_SETTING_PROMOTED_KEY = 'initial-quality-change';

function isSameClaimUri(firstUri: ?string, secondUri: ?string): boolean {
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
  uri: string,
  source: string,
  contentType: string,
  embedded: boolean,
  playNextUri: ?string,
  playPreviousUri?: string,
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
  autoPlayNextShort: boolean,
  isFloating: boolean,
  floatingPlayer: boolean,
  setFloatingPlayer: (boolean) => void,
  autoplayMedia: boolean,
  setAutoplayMedia: (boolean) => void,
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
    setFloatingPlayer,
    autoplayMedia,
    setAutoplayMedia,
    setVideoPlaybackRate,
    homepageData,
    authenticated,
    userId,
    internalFeature,
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

  const [isPlaying, setIsPlaying] = useState(false);
  const [localAutoplayNext, setLocalAutoplayNext] = useState(autoplayNext);
  const [localFloatingPlayer, setLocalFloatingPlayer] = useState(floatingPlayer);
  const [localAutoplayMedia, setLocalAutoplayMedia] = useState(autoplayMedia);

  const embedContext = useContext(EmbedContext);
  const isEmbedded = Boolean(embedContext) || embedded || window.location.pathname.includes('/$/embed/');
  const showEmbedEndOverlay = embedContext && embedContext.videoEnded;

  const approvedVideo = Boolean(channelClaimId) && adApprovedChannelIds.includes(channelClaimId);
  const adsEnabled = ENABLE_PREROLL_ADS && !authenticated && !embedded && approvedVideo;
  const [adUrl, setAdUrl, isFetchingAd] = useGetAds(approvedVideo, adsEnabled);
  const [videoNode, setVideoNode] = useState();
  const isFirstRender = React.useRef(true);

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

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    toggleAutoplayNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localAutoplayNext]);

  const isFirstFloatingRender = React.useRef(true);
  useEffect(() => {
    if (isFirstFloatingRender.current) {
      isFirstFloatingRender.current = false;
      return;
    }
    setFloatingPlayer(localFloatingPlayer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localFloatingPlayer]);

  const isFirstAutoplayMediaRender = React.useRef(true);
  useEffect(() => {
    if (isFirstAutoplayMediaRender.current) {
      isFirstAutoplayMediaRender.current = false;
      return;
    }
    setAutoplayMedia(localAutoplayMedia);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localAutoplayMedia]);

  const handleToggleAutoplayNext = useCallback(() => setLocalAutoplayNext((v) => !v), []);
  const handleToggleFloatingPlayer = useCallback(() => setLocalFloatingPlayer((v) => !v), []);
  const handleToggleAutoplayMedia = useCallback(() => setLocalAutoplayMedia((v) => !v), []);

  useInterval(
    () => {
      if (videoNode && isPlaying && !isLivestreamClaim) {
        handlePosition(videoNode);
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

  const handlePlayNextUri = React.useCallback(
    (options?: { manual?: boolean }) => {
      const manual = options && options.manual;
      if (shouldPlayRecommended) {
        if (manual || IS_IOS) {
          // $FlowIgnore
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

  const onVideoEnded = React.useCallback(() => {
    videoEnded.current = true;
    analytics.video.videoIsPlaying(false);

    if (adUrl) return setAdUrl(null);

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
  }, [adUrl, canPlayNext, clearPosition, embedContext, handlePlayNextUri, setAdUrl, uri]);

  function handlePosition(node) {
    try {
      if (!isLivestreamClaim && uri && savePosition && node) {
        savePosition(uri, node.currentTime);
      }
    } catch (error) {}
  }

  const onPlayerReady = useCallback(
    (player, node) => {
      setVideoNode(node);

      // Restore position
      if (timeParam && !Number.isNaN(timeParam)) {
        node.currentTime = Number(timeParam);
      } else if (position && !isLivestreamClaim) {
        const avDuration = claim?.value?.video?.duration || claim?.value?.audio?.duration;
        node.currentTime = avDuration && position >= avDuration - 100 ? 0 : position;
      }

      // Set initial state from redux
      if (muted || autoplayIfEmbedded) {
        node.muted = true;
      }
      node.volume = volume;
      node.playbackRate = videoPlaybackRate;

      // Listen for ended event
      const handleEnded = () => onVideoEnded();
      node.addEventListener('ended', handleEnded);

      // Track play state
      const handlePlay = () => {
        setShowRecommendationOverlay(false);
        videoEnded.current = false;
        setIsPlaying(true);
        doSetShowAutoplayCountdownForUri({ uri, show: false });
        if (embedContext) embedContext.setVideoEnded(false);
      };
      const handlePause = () => {
        setIsPlaying(false);
        handlePosition(node);
      };
      const handleVolumeChange = () => {
        updateVolumeState(node.volume, node.muted);
      };
      const handleRateChange = () => {
        if (node.readyState > 0) {
          setVideoPlaybackRate(node.playbackRate);
        }
      };

      node.addEventListener('play', handlePlay);
      node.addEventListener('pause', handlePause);
      node.addEventListener('volumechange', handleVolumeChange);
      node.addEventListener('ratechange', handleRateChange);

      return () => {
        node.removeEventListener('ended', handleEnded);
        node.removeEventListener('play', handlePlay);
        node.removeEventListener('pause', handlePause);
        node.removeEventListener('volumechange', handleVolumeChange);
        node.removeEventListener('ratechange', handleRateChange);
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [muted, uri, adUrl, isEmbedded, autoplayIfEmbedded]
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
                      i === 4 && isMobile ? replay() : doPlayNextUri({ uri: url });
                    }}
                  >
                    <ClaimPreviewTile uri={url} onClickHandledByParent />
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
          allowPreRoll={!authenticated}
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
          autoPlayNextShort={autoPlayNextShort}
          canPlayNext={canPlayNext}
          canPlayPrevious={canPlayPrevious}
          autoplayNext={localAutoplayNext}
          onToggleAutoplayNext={handleToggleAutoplayNext}
          floatingPlayer={localFloatingPlayer}
          onToggleFloatingPlayer={handleToggleFloatingPlayer}
          autoplayMedia={localAutoplayMedia}
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
