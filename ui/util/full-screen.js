/*
  Polyfill functions for the HTML5 fullscreen api:
  https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API
*/

import { platform } from 'ui/util/platform';

const IOS_FS_CLASS = 'ios-fullscreen';
let iosFsElement = null;

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

export const fullscreenElement = () => {
  if (platform.isIPhone()) {
    return iosFsElement;
  }
  const index = getPrefix();
  const prefix = prefixes.fullscreenElement[index];
  return document[prefix];
};

export const requestFullscreen = (elem) => {
  if (platform.isIPhone()) {
    const docEl = document.documentElement;
    if (docEl) docEl.classList.add(IOS_FS_CLASS);
    iosFsElement = elem;
    document.dispatchEvent(new Event('fullscreenchange'));
    elem.dispatchEvent(new Event('fullscreenchange'));
    return;
  }
  const index = getPrefix();
  const prefix = prefixes.requestFullscreen[index];
  elem[prefix] && elem[prefix]();
};

export const exitFullscreen = () => {
  if (platform.isIPhone() && iosFsElement) {
    const docEl = document.documentElement;
    if (docEl) docEl.classList.remove(IOS_FS_CLASS);
    iosFsElement = null;
    document.dispatchEvent(new Event('fullscreenchange'));
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
