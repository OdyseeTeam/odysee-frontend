// @flow
import * as OVERLAY from './overlays';
import * as KEYCODES from 'constants/keycodes';
import { VIDEO_PLAYBACK_RATES } from 'constants/player';
import isUserTyping from 'util/detect-typing';

// time to seek in seconds
const SEEK_STEP_5 = 5;
const SEEK_STEP = 10;

const VOLUME_STEP = 0.05;
const VOLUME_STEP_FINE = 0.01;

// check if active (clicked) element is part of video div, used for keyboard shortcuts (volume etc)
function activeElementIsPartOfVideoElement() {
  const videoElementParent = document.getElementsByClassName('video-js-parent')[0];
  const activeElement = document.activeElement;
  return videoElementParent.contains(activeElement);
}

function volumeUp(event, player, checkIsActive = true, amount = VOLUME_STEP) {
  // dont run if video element is not active element (otherwise runs when scrolling using keypad)
  const videoElementIsActive = activeElementIsPartOfVideoElement();
  if (!player || (checkIsActive && !videoElementIsActive)) return;
  event.preventDefault();
  player.volume(player.volume() + amount);
  OVERLAY.showVolumeverlay(player, Math.round(player.volume() * 100));
  player.userActive(true);
}

function volumeDown(event, player, checkIsActive = true, amount = VOLUME_STEP) {
  // dont run if video element is not active element (otherwise runs when scrolling using keypad)
  const videoElementIsActive = activeElementIsPartOfVideoElement();
  if (!player || (checkIsActive && !videoElementIsActive)) return;
  event.preventDefault();
  player.volume(player.volume() - amount);
  OVERLAY.showVolumeverlay(player, Math.round(player.volume() * 100));
  player.userActive(true);
}

function seekVideo(stepSize: number, player, jumpTo?: boolean) {
  const containerEl = player.el();
  const videoNode = containerEl && containerEl.querySelector('video, audio');

  if (!videoNode || !player) return;

  const duration = videoNode.duration;
  const currentTime = videoNode.currentTime;

  if (isNaN(duration) || isNaN(currentTime)) {
    return;
  }

  const newDuration = jumpTo ? duration * stepSize : currentTime + stepSize;
  if (newDuration < 0) {
    videoNode.currentTime = 0;
  } else if (newDuration > duration) {
    videoNode.currentTime = duration;
  } else {
    videoNode.currentTime = newDuration;
  }
  OVERLAY.showSeekedOverlay(player, Math.abs(jumpTo ? stepSize * 100 : stepSize), !jumpTo && stepSize > 0, jumpTo);
  player.userActive(true);
}

function toggleFullscreen(player) {
  if (!player) return;
  if (!player.isFullscreen()) {
    player.requestFullscreen();
  } else {
    player.exitFullscreen();
  }
}

function toggleMute(player) {
  const containerEl = player.el();
  const videoNode = containerEl && containerEl.querySelector('video, audio');
  if (!videoNode) return;
  videoNode.muted = !videoNode.muted;
}

function togglePlay(player) {
  const containerEl = player.el();
  const videoNode = containerEl && containerEl.querySelector('video, audio');
  if (!videoNode) return;
  videoNode.paused ? videoNode.play() : videoNode.pause();
}

function changePlaybackSpeed(shouldSpeedUp: boolean, player) {
  if (!player) return;
  const isSpeedUp = shouldSpeedUp;
  const rate = player.playbackRate();
  let rateIndex = VIDEO_PLAYBACK_RATES.findIndex((x) => x === rate);
  if (rateIndex >= 0) {
    rateIndex = isSpeedUp ? Math.min(rateIndex + 1, VIDEO_PLAYBACK_RATES.length - 1) : Math.max(rateIndex - 1, 0);
    const nextRate = VIDEO_PLAYBACK_RATES[rateIndex];

    OVERLAY.showPlaybackRateOverlay(player, nextRate, isSpeedUp);
    player.userActive(true);
    player.playbackRate(nextRate);
  }
}

const VideoJsShorcuts = ({
  playNext,
  playPrevious,
  toggleVideoTheaterMode,
  isMobile,
}: {
  playNext: any, // function
  playPrevious: any, // function
  toggleVideoTheaterMode: any, // function
  isMobile: boolean,
}) => {
  function toggleTheaterMode(player) {
    if (!player) return;
    // TODO: have to fix this
    toggleVideoTheaterMode();
    if (player.isFullscreen()) {
      player.exitFullscreen();
    }
  }

  function handleKeyDown(e: KeyboardEvent, player) {
    const containerEl = player.el();
    const videoNode = containerEl && containerEl.querySelector('video, audio');

    if (!videoNode || !player || isUserTyping()) return;
    handleSingleKeyActions(e, player);
    handleShiftKeyActions(e, player);
  }

  function handleShiftKeyActions(e: KeyboardEvent, player) {
    if (e.altKey || e.ctrlKey || e.metaKey || !e.shiftKey) return;
    if (e.keyCode === KEYCODES.PERIOD) changePlaybackSpeed(true, player);
    if (e.keyCode === KEYCODES.COMMA) changePlaybackSpeed(false, player);
    if (e.keyCode === KEYCODES.N) playNext();
    if (e.keyCode === KEYCODES.P) playPrevious();
  }

  // eslint-disable-next-line flowtype/no-types-missing-file-annotation
  function handleSingleKeyActions(e: KeyboardEvent, player) {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;

    if (e.keyCode === KEYCODES.SPACEBAR || e.keyCode === KEYCODES.K) {
      e.preventDefault();
      togglePlay(player);
    }

    if (e.keyCode === KEYCODES.F) toggleFullscreen(player);
    if (e.keyCode === KEYCODES.M) toggleMute(player);
    if (e.keyCode === KEYCODES.UP) volumeUp(e, player);
    if (e.keyCode === KEYCODES.DOWN) volumeDown(e, player);
    if (e.keyCode === KEYCODES.T && !isMobile) toggleTheaterMode(player);
    if (e.keyCode === KEYCODES.L) seekVideo(SEEK_STEP, player);
    if (e.keyCode === KEYCODES.J) seekVideo(-SEEK_STEP, player);
    if (e.keyCode === KEYCODES.RIGHT) seekVideo(SEEK_STEP_5, player);
    if (e.keyCode === KEYCODES.LEFT) seekVideo(-SEEK_STEP_5, player);
    if (e.keyCode === KEYCODES.ZERO) seekVideo(0, player, true);
    if (e.keyCode === KEYCODES.ONE) seekVideo(10 / 100, player, true);
    if (e.keyCode === KEYCODES.TWO) seekVideo(20 / 100, player, true);
    if (e.keyCode === KEYCODES.THREE) seekVideo(30 / 100, player, true);
    if (e.keyCode === KEYCODES.FOUR) seekVideo(40 / 100, player, true);
    if (e.keyCode === KEYCODES.FIVE) seekVideo(50 / 100, player, true);
    if (e.keyCode === KEYCODES.SIX) seekVideo(60 / 100, player, true);
    if (e.keyCode === KEYCODES.SEVEN) seekVideo(70 / 100, player, true);
    if (e.keyCode === KEYCODES.EIGHT) seekVideo(80 / 100, player, true);
    if (e.keyCode === KEYCODES.NINE) seekVideo(90 / 100, player, true);
    if (e.keyCode === KEYCODES.COMMA) {
      const videoPlayer = document.querySelector('video');
      // $FlowIssue
      if (!window.videoFps || !videoPlayer || !player.paused()) return;
      const currentTime = videoPlayer.currentTime;
      videoPlayer.currentTime = currentTime - 1 / window.videoFps;
    }
    if (e.keyCode === KEYCODES.PERIOD && window.videoFps) {
      const videoPlayer = document.querySelector('video');
      // $FlowIssue
      if (!window.videoFps || !videoPlayer || !player.paused()) return;
      const currentTime = videoPlayer.currentTime;
      videoPlayer.currentTime = currentTime + 1 / window.videoFps;
    }
  }

  const handleVideoScrollWheel = (event, player) => {
    const containerEl = player.el();
    const videoNode = containerEl && containerEl.querySelector('video');

    // SHIFT key required. Scrolling the page will be the priority.
    if (!videoNode || !player || isUserTyping() || !event.shiftKey) return;

    event.preventDefault();

    const delta = event.deltaY;

    if (delta > 0) {
      volumeDown(event, player, false, VOLUME_STEP_FINE);
    } else if (delta < 0) {
      volumeUp(event, player, false, VOLUME_STEP_FINE);
    }
  };

  const handleVolumeBarScrollWheel = (event, volumeElement, player) => {
    const containerEl = player.el();
    const videoNode = containerEl && containerEl.querySelector('video');

    if (!volumeElement || !player || !videoNode || isUserTyping()) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const delta = event.deltaY;
    const changeAmount = event.shiftKey ? VOLUME_STEP_FINE : VOLUME_STEP;

    if (delta > 0) {
      volumeDown(event, player, false, changeAmount);
    } else if (delta < 0) {
      volumeUp(event, player, false, changeAmount);
    }
  };

  const createKeyDownShortcutsHandler = (player: any) => {
    return function curried_func(e: any) {
      handleKeyDown(e, player);
    };
  };
  const createVideoScrollShortcutsHandler = (player: any) => {
    return function curried_func(e: any) {
      handleVideoScrollWheel(e, player);
    };
  };
  const createVolumePanelScrollShortcutsHandler = (volumeElement: any, player: any) => {
    return function curried_func(e: any) {
      handleVolumeBarScrollWheel(e, volumeElement, player);
    };
  };

  return {
    createKeyDownShortcutsHandler,
    createVideoScrollShortcutsHandler,
    createVolumePanelScrollShortcutsHandler,
  };
};

export default VideoJsShorcuts;
