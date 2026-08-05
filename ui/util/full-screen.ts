/*
  Polyfill functions for the HTML5 fullscreen api:
  https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API
*/

import { platform } from 'util/platform';

const IOS_FS_CLASS = 'ios-fullscreen';
let iosFsElement = null;
let iosFsMode = null;
let removeIosNativeExitListener = null;

function syncViewportHeight() {
  const docEl = document.documentElement;
  if (docEl) docEl.style.setProperty('--ios-fs-height', window.innerHeight + 'px');
}

const prefixes = {
  exitFullscreen: ['exitFullscreen', 'msExitFullscreen', 'mozCancelFullScreen', 'webkitExitFullscreen'],
  fullscreenChange: ['fullscreenchange', 'MSFullscreenChange', 'mozfullscreenchange', 'webkitfullscreenchange'],
  fullscreenEnabled: ['fullscreenEnabled', 'msFullscreenEnabled', 'mozFullScreenEnabled', 'webkitFullscreenEnabled'],
  fullscreenElement: ['fullscreenElement', 'msFullscreenElement', 'mozFullScreenElement', 'webkitFullscreenElement'],
  requestFullscreen: ['requestFullscreen', 'msRequestFullscreen', 'mozRequestFullScreen', 'webkitRequestFullscreen'],
};

const getPrefix = () => {
  let prefixIndex = 0;
  prefixes.fullscreenEnabled.some((prefix, index) => {
    if (document[prefix] || document[prefix] === false) {
      prefixIndex = index;
      return true;
    }
  });
  return prefixIndex;
};

function getVideoElement(elem) {
  if (!elem) return null;
  if (elem.tagName === 'VIDEO') return elem;
  if (typeof elem.querySelector === 'function') return elem.querySelector('video');
  return null;
}

function dispatchFullscreenChange(elem) {
  document.dispatchEvent(new Event('fullscreenchange'));
  elem.dispatchEvent(new Event('fullscreenchange'));
}

function isEmbeddedPlayerFullscreenTarget(elem) {
  return Boolean(elem?.classList?.contains('video-js-parent'));
}

function enterIosCssFullscreen(elem) {
  const docEl = document.documentElement;
  if (docEl) docEl.classList.add(IOS_FS_CLASS);
  iosFsElement = elem;
  iosFsMode = 'css';
  syncViewportHeight();
  window.addEventListener('resize', syncViewportHeight);
  dispatchFullscreenChange(elem);
}

function clearIosFullscreenState(elem, dispatchEvent = true) {
  if (removeIosNativeExitListener) {
    removeIosNativeExitListener();
    removeIosNativeExitListener = null;
  }

  const docEl = document.documentElement;
  if (docEl) {
    docEl.classList.remove(IOS_FS_CLASS);
    docEl.style.removeProperty('--ios-fs-height');
  }
  window.removeEventListener('resize', syncViewportHeight);
  iosFsElement = null;
  iosFsMode = null;
  if (dispatchEvent) {
    document.dispatchEvent(new Event('fullscreenchange'));
    if (elem) elem.dispatchEvent(new Event('fullscreenchange'));
  }
}

function trackWebkitVideoFullscreen(video) {
  iosFsElement = video;
  iosFsMode = 'webkit-video';
  dispatchFullscreenChange(video);

  const handleNativeExit = () => {
    if (iosFsElement === video && iosFsMode === 'webkit-video') {
      clearIosFullscreenState(video);
    }
  };

  video.addEventListener('webkitendfullscreen', handleNativeExit, { once: true });
  removeIosNativeExitListener = () => video.removeEventListener('webkitendfullscreen', handleNativeExit);
}

function trackStandardVideoFullscreen(video) {
  iosFsElement = video;
  iosFsMode = 'standard-video';

  const handleNativeExit = () => {
    if (iosFsElement === video && iosFsMode === 'standard-video' && !document.fullscreenElement) {
      clearIosFullscreenState(video, false);
    }
  };

  document.addEventListener('fullscreenchange', handleNativeExit);
  removeIosNativeExitListener = () => document.removeEventListener('fullscreenchange', handleNativeExit);
}

function requestVideoFullscreen(video, onReject?) {
  if (!video) return false;

  try {
    if (video.webkitEnterFullscreen) {
      video.webkitEnterFullscreen();
      trackWebkitVideoFullscreen(video);
      return true;
    }

    if (video.requestFullscreen) {
      const result = video.requestFullscreen();
      trackStandardVideoFullscreen(video);
      if (result && typeof result.catch === 'function') {
        result.catch(() => {
          clearIosFullscreenState(video, false);
          if (onReject) onReject();
        });
      }
      return true;
    }
  } catch {
    clearIosFullscreenState(video);
  }

  return false;
}

export const fullscreenElement = () => {
  if (platform.isIPhone()) {
    const index = getPrefix();
    const prefix = prefixes.fullscreenElement[index];
    return iosFsElement || document[prefix];
  }
  const index = getPrefix();
  const prefix = prefixes.fullscreenElement[index];
  return document[prefix];
};

export const requestFullscreen = (elem) => {
  if (platform.isIPhone()) {
    if (
      isEmbeddedPlayerFullscreenTarget(elem) &&
      requestVideoFullscreen(getVideoElement(elem), () => enterIosCssFullscreen(elem))
    ) {
      return;
    }

    enterIosCssFullscreen(elem);
    return;
  }
  const index = getPrefix();
  const prefix = prefixes.requestFullscreen[index];
  if (!elem[prefix]) return;
  try {
    const result = elem[prefix]();
    if (result && typeof result.catch === 'function') {
      result.catch(() => {
        requestVideoFullscreen(getVideoElement(elem));
      });
    }
  } catch {
    requestVideoFullscreen(getVideoElement(elem));
  }
};

export const exitFullscreen = () => {
  if (platform.isIPhone() && iosFsElement) {
    const elem = iosFsElement;

    if (iosFsMode === 'webkit-video' && elem.webkitExitFullscreen) {
      elem.webkitExitFullscreen();
      clearIosFullscreenState(elem);
      return;
    }

    if (iosFsMode === 'standard-video') {
      const index = getPrefix();
      const prefix = prefixes.exitFullscreen[index];
      if (!document[prefix]) {
        clearIosFullscreenState(elem);
        return;
      }

      const result = document[prefix]();
      if (result && typeof result.catch === 'function') {
        result.catch(() => {});
      }
      return;
    }

    clearIosFullscreenState(elem);
    return;
  }
  const index = getPrefix();
  const prefix = prefixes.exitFullscreen[index];
  document[prefix] && document[prefix]();
};

export const onFullscreenChange = (target, action, callback) => {
  if (platform.isIPhone()) {
    target[`${action}EventListener`]('fullscreenchange', callback, false);
    return;
  }
  const index = getPrefix();
  const prefix = prefixes.fullscreenChange[index];
  target[`${action}EventListener`](prefix, callback, false);
};
