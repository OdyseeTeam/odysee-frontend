// @flow
import { useEffect } from 'react';
import Player from '../player';
import analytics from 'analytics';
import { platform } from 'util/platform';

const IS_MOBILE = platform.isMobile();

export default function useAnalytics() {
  const media = Player.useMedia();
  const paused = Player.usePlayer((s) => s.paused);

  useEffect(() => {
    analytics.video.videoIsPlaying(!paused);
  }, [paused]);

  // FPS detection
  useEffect(() => {
    if (!media || IS_MOBILE || !('requestVideoFrameCallback' in HTMLVideoElement.prototype)) return;
    if (!(media instanceof HTMLVideoElement)) return;

    let fpsRounder = [];
    let lastMediaTime;
    let lastFrameNum;
    let frameNotSeeked = true;

    function getFpsAverage() {
      return fpsRounder.reduce((a, b) => a + b, 0) / fpsRounder.length;
    }

    function ticker(useless, metadata) {
      const mediaTimeDiff = Math.abs(metadata.mediaTime - lastMediaTime);
      const frameNumDiff = Math.abs(metadata.presentedFrames - lastFrameNum);
      const diff = mediaTimeDiff / frameNumDiff;

      if (diff && diff < 1 && frameNotSeeked && fpsRounder.length < 50 && media.playbackRate === 1) {
        fpsRounder.push(diff);
        window.videoFps = Math.round(1 / getFpsAverage());
      }

      frameNotSeeked = true;
      lastMediaTime = metadata.mediaTime;
      lastFrameNum = metadata.presentedFrames;

      if (fpsRounder.length < 10) {
        // $FlowIssue
        media.requestVideoFrameCallback(ticker);
      }
    }

    // $FlowIssue
    media.requestVideoFrameCallback(ticker);

    const handleSeeked = () => {
      fpsRounder.pop();
      frameNotSeeked = false;
    };

    media.addEventListener('seeked', handleSeeked);

    return () => {
      media.removeEventListener('seeked', handleSeeked);
      delete window.videoFps;
    };
  }, [media]);
}
