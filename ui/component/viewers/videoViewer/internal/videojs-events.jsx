// @flow
import analytics from 'analytics';
import { THUMBNAIL_HEIGHT_POSTER, THUMBNAIL_WIDTH_POSTER } from 'config';
import { VJS_EVENTS } from 'constants/player';
import { getThumbnailCdnUrl } from 'util/thumbnail';
import { platform } from 'util/platform';

const IS_MOBILE = platform.isMobile();

const isDev = process.env.NODE_ENV !== 'production';

const TAP = {
  NONE: 'NONE',
  UNMUTE: 'UNMUTE',
  RETRY: 'RETRY',
};

const VideoJsEvents = ({
  tapToUnmuteRef,
  tapToRetryRef,
  setReload,
  playerRef,
  claimId,
  userId,
  claimValues,
  channelTitle,
  embedded,
  uri,
  doAnalyticsViewForUri,
  doAnalyticsBuffer,
  claimRewards,
  playerServerRef,
  isLivestreamClaim,
}: {
  tapToUnmuteRef: any, // DOM element
  tapToRetryRef: any, // DOM element
  setReload: any, // react hook
  playerRef: any, // DOM element
  claimId: ?string,
  userId: ?number,
  claimValues: any,
  channelTitle: string,
  embedded: boolean,
  uri: string,
  doAnalyticsViewForUri: (string) => any,
  doAnalyticsBuffer: (string, any) => void,
  claimRewards: () => void,
  playerServerRef: any,
  isLivestreamClaim: boolean,
}) => {
  let lastPlaybackTime = 0;

  function doTrackingBuffered(e: Event, data: any) {
    const playerPoweredBy = isLivestreamClaim ? 'lvs' : playerServerRef.current;

    data.playPoweredBy = playerPoweredBy;
    data.isLivestream = isLivestreamClaim;
    // $FlowFixMe
    data.bitrateAsBitsPerSecond = this.tech(true).vhs?.playlists?.media?.()?.attributes?.BANDWIDTH;
    doAnalyticsBuffer(uri, data);
  }

  /**
   * Analytics functionality that is run on first video start
   * @param e - event from videojs (from the plugin?)
   * @param data - only has secondsToLoad property
   */
  function doTrackingFirstPlay(e: Event, data: any) {
    const playerPoweredBy = isLivestreamClaim ? 'lvs' : playerServerRef.current;

    // how long until the video starts
    let timeToStartVideo = data.secondsToLoad;

    analytics.event.playerVideoStarted(embedded);

    // don't send this data on livestream
    if (!isLivestreamClaim) {
      // convert bytes to bits, and then divide by seconds
      const contentInBits = Number(claimValues.source.size) * 8;
      const durationInSeconds = claimValues.video && claimValues.video.duration;
      let bitrateAsBitsPerSecond;
      if (durationInSeconds) {
        bitrateAsBitsPerSecond = Math.round(contentInBits / durationInSeconds);
      }

      // populates data for watchman, sends prom and matomo event
      analytics.video.videoStartEvent(
        claimId,
        timeToStartVideo,
        playerPoweredBy,
        userId,
        uri,
        this, // pass the player
        bitrateAsBitsPerSecond,
        isLivestreamClaim
      );
    } else {
      // populates data for watchman, sends prom and matomo event
      analytics.video.videoStartEvent(
        claimId,
        0,
        playerPoweredBy,
        userId,
        uri,
        this, // pass the player
        // $FlowFixMe
        this.tech(true).vhs?.playlists?.media?.()?.attributes?.BANDWIDTH,
        isLivestreamClaim
      );
    }

    // hit backend to mark a view
    doAnalyticsViewForUri(uri).then(claimRewards);
  }

  function onInitialPlay() {
    const player = playerRef.current;

    updateMediaSession();

    // $FlowIssue
    player.bigPlayButton?.hide();

    if (player && (player.muted() || player.volume() === 0)) {
      // The css starts as "hidden". We make it visible here without
      // re-rendering the whole thing.
      showTapButton(TAP.UNMUTE);
    } else {
      showTapButton(TAP.NONE);
    }
  }

  function onVolumeChange() {
    const player = playerRef.current;
    if (player && !player.muted()) {
      showTapButton(TAP.NONE);
    }
  }

  function onError() {
    const player = playerRef.current;
    const error = player && player.error();

    // Attempt auto-recovery for network and decode errors
    if (error && (error.code === 2 || error.code === 3)) {
      if (!player.appState.recoveryAttempts) {
        player.appState.recoveryAttempts = 1;
        retryVideoAfterFailure();
      } else if (player.appState.recoveryAttempts < 4) {
        player.appState.recoveryAttempts++;
        retryVideoAfterFailure();
      } else {
        // After 4 failed attempts, show manual retry button
        showTapButton(TAP.RETRY);
      }
    } else {
      // For other errors, show retry button immediately
      showTapButton(TAP.RETRY);
    }

    // Reattach initial play listener in case we recover from error successfully
    player.one('play', onInitialPlay);

    if (player && player.loadingSpinner) {
      player.loadingSpinner.hide();
    }
  }

  // when user clicks 'Unmute' button, turn audio on and hide unmute button
  function unmuteAndHideHint() {
    const player = playerRef.current;
    if (player) {
      player.muted(false);
      if (player.volume() === 0) {
        player.volume(1.0);
      }
    }
    showTapButton(TAP.NONE);
  }

  function retryVideoAfterFailure(manual: boolean = false) {
    const player = playerRef.current;
    if (player) {
      if (manual) {
        // If manual retry, ignore previous recovery attempts
        player.appState.recoveryAttempts = 1;
      }
      const attempt = player.appState.recoveryAttempts || 1;
      lastPlaybackTime = player.currentTime();

      showTapButton(TAP.RETRY);

      // Exponential backoff delays: attempt 1 is near immediate, then 1s, 5s, and 15s.
      const backoffDelays = [250, 1000, 5000, 15000];
      const timeoutDelay = backoffDelays[attempt - 1] || backoffDelays[backoffDelays.length - 1];

      setTimeout(() => {
        const appendCacheBuster = (src) => {
          try {
            const url = new URL(src, window.location.href);
            url.searchParams.set('cb', Date.now().toString());
            return url.toString();
          } catch (error) {
            return src; // Fallback to original src if URL construction fails
          }
        };

        let newSrcObject;
        if (player.claimSrcVhs) {
          newSrcObject = { ...player.claimSrcVhs };
          newSrcObject.src = appendCacheBuster(player.claimSrcVhs.src);
        } else if (player.claimSrcOriginal) {
          newSrcObject = { ...player.claimSrcOriginal };
          newSrcObject.src = appendCacheBuster(player.claimSrcOriginal.src);
        }

        if (newSrcObject && newSrcObject.src && newSrcObject.type) {
          player.src(newSrcObject);
          player.load();

          // Restore playback position after metadata is loaded
          player.one('loadedmetadata', () => {
            player.currentTime(lastPlaybackTime);
          });

          player
            .play()
            .then(() => {
              showTapButton(TAP.NONE);
            })
            .catch(() => {
              showTapButton(TAP.RETRY);
            });
        } else {
          showTapButton(TAP.RETRY);
        }
      }, timeoutDelay);
    }
  }

  function showTapButton(tapButton) {
    // Note: This is not a good design by me (inf.persistence) -- do not copy
    // this style. I didn't know how to avoid renders back then.
    // But the button should probably be implemented on the videojs side (as a
    // plugin), and not one level up in React.
    const setButtonVisibility = (theRef, newState) => {
      // Use the DOM to control the state of the button to prevent re-renders.
      if (theRef.current) {
        const curState = theRef.current.style.visibility === 'visible';
        if (newState !== curState) {
          theRef.current.style.visibility = newState ? 'visible' : 'hidden';
        }
      }
    };

    switch (tapButton) {
      case TAP.NONE:
        setButtonVisibility(tapToUnmuteRef, false);
        setButtonVisibility(tapToRetryRef, false);
        break;
      case TAP.UNMUTE:
        setButtonVisibility(tapToUnmuteRef, true);
        setButtonVisibility(tapToRetryRef, false);
        break;
      case TAP.RETRY:
        setButtonVisibility(tapToUnmuteRef, false);
        setButtonVisibility(tapToRetryRef, true);
        break;
      default:
        if (isDev) throw new Error('showTapButton: unexpected ref');
        break;
    }
  }

  function updateMediaSession() {
    if ('mediaSession' in navigator) {
      const player = playerRef.current;
      const thumbnail = getThumbnailCdnUrl({
        thumbnail: claimValues?.thumbnail?.url,
        width: THUMBNAIL_WIDTH_POSTER,
        height: THUMBNAIL_HEIGHT_POSTER,
      });

      // $FlowFixMe
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: claimValues.title,
        artist: channelTitle,
        artwork: thumbnail ? [{ src: thumbnail }] : undefined,
      });

      // $FlowFixMe
      navigator.mediaSession.setActionHandler('seekbackward', function () {
        player.currentTime(Math.max(0, player.currentTime() - 10));
      });
      // $FlowFixMe
      navigator.mediaSession.setActionHandler('seekforward', function () {
        player.currentTime(Math.max(0, player.currentTime() + 10));
      });
    }
  }

  function removeControlBar() {
    setTimeout(function () {
      window.player.controlBar.el().classList.remove('vjs-transitioning-video');
      window.player.controlBar.show();
    }, 1000 * 2); // wait 2 seconds to hide control bar
  }

  function determineVideoFps() {
    const videoNode = document.querySelector('video');

    if (!videoNode) return;

    let last_media_time, last_frame_num, fps;
    let fps_rounder = [];
    let frame_not_seeked = true;

    function get_fps_average() {
      return fps_rounder.reduce((a, b) => a + b, 0) / fps_rounder.length;
    }

    function ticker(useless, metadata) {
      const media_time_diff = Math.abs(metadata.mediaTime - last_media_time);
      const frame_num_diff = Math.abs(metadata.presentedFrames - last_frame_num);
      const diff = media_time_diff / frame_num_diff;

      if (diff && diff < 1 && frame_not_seeked && fps_rounder.length < 50 && videoNode.playbackRate === 1) {
        fps_rounder.push(diff);
        fps = Math.round(1 / get_fps_average());
      }

      frame_not_seeked = true;
      last_media_time = metadata.mediaTime;
      last_frame_num = metadata.presentedFrames;

      // after collecting 10 pieces of data, declare the videofps and end the loop
      if (fps_rounder.length < 10) {
        window.videoFps = fps;
        // $FlowIssue
        videoNode.requestVideoFrameCallback(ticker);
      }
    }

    // $FlowIssue
    videoNode.requestVideoFrameCallback(ticker);

    videoNode.addEventListener('seeked', function () {
      fps_rounder.pop();
      frame_not_seeked = false;
    });
  }

  function resetRecoveryAttempts() {
    const player = playerRef.current;
    let startTime = player.currentTime();
    setTimeout(() => {
      if (player.currentTime() > startTime) {
        if (player.appState) {
          player.appState.recoveryAttempts = 0;
        }
      }
    }, 500);
  }

  function initializeEvents() {
    const player = playerRef.current;

    player.one('play', onInitialPlay);
    player.on('volumechange', onVolumeChange);
    player.on('error', onError);

    player.on('playing', resetRecoveryAttempts);

    // custom tracking plugin, event used for watchman data, and marking view/getting rewards
    player.on('tracking:firstplay', doTrackingFirstPlay);
    // used for tracking buffering for watchman
    player.on('tracking:buffered', doTrackingBuffered);

    // need this method to calculate FPS client side
    if ('requestVideoFrameCallback' in HTMLVideoElement.prototype && !IS_MOBILE) {
      player.one('playing', determineVideoFps);
    }

    player.on('playing', removeControlBar);
    player.on(VJS_EVENTS.PLAYER_CLOSED, () => {
      player.off('play', onInitialPlay);
      player.off('volumechange', onVolumeChange);
      player.off('error', onError);
      // custom tracking plugin, event used for watchman data, and marking view/getting rewards
      player.off('tracking:firstplay', doTrackingFirstPlay);
      // used for tracking buffering for watchman
      player.off('tracking:buffered', doTrackingBuffered);
      player.off('playing', removeControlBar);
      player.off('playing', determineVideoFps);
      player.off('playing', resetRecoveryAttempts);
      player.off('timeupdate', liveEdgeRestoreSpeed);
    });

    if (isLivestreamClaim) {
      window.liveSeeking = true;
      player.liveTracker.on('liveedgechange', () => {
        if (player.paused()) {
          // when liveedge changes, add the window variable so that the timeout isn't triggered
          // when it's changed back again
          window.liveEdgePaused = true;
          return;
        } else {
          if (window.liveEdgePaused) delete window.liveEdgePaused;
        }

        if (window.liveSeeking) {
          player.liveTracker.seekToLiveEdge();
        }
      });
      player.on('timeupdate', liveEdgeRestoreSpeed);
    } else {
      window.liveSeeking = false;
    }
  }

  function liveEdgeRestoreSpeed() {
    const player = playerRef.current;

    if (player.playbackRate() !== 1) {
      player.liveTracker.handleSeeked_();

      // Only respond to when we fall behind
      if (player.liveTracker.atLiveEdge()) {
        player.playbackRate(1);
        player.liveTracker.seekToLiveEdge();
      }
    }
  }

  return {
    retryVideoAfterFailure,
    unmuteAndHideHint,
    initializeEvents,
  };
};

export default VideoJsEvents;
