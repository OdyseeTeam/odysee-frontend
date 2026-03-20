// @flow
import { useEffect, useRef } from 'react';
import Player from '../player';

const LIVE_EDGE_THRESHOLD = 15;

export default function useLivestreamEdge(isLivestream: boolean) {
  const media = Player.useMedia();
  const seekingRef = useRef(true);

  useEffect(() => {
    if (!isLivestream || !media) return;

    seekingRef.current = true;

    const seekToLiveEdge = () => {
      if (media.duration && isFinite(media.duration)) {
        media.currentTime = media.duration;
      } else if (media.seekable && media.seekable.length > 0) {
        media.currentTime = media.seekable.end(media.seekable.length - 1);
      }
    };

    const isAtLiveEdge = () => {
      if (!media.duration || !isFinite(media.duration)) return true;
      return media.duration - media.currentTime < LIVE_EDGE_THRESHOLD;
    };

    const onTimeUpdate = () => {
      if (media.playbackRate !== 1 && isAtLiveEdge()) {
        media.playbackRate = 1;
        seekToLiveEdge();
      }
    };

    const hls = media._hls;
    let hlsHandler = null;

    if (hls) {
      hlsHandler = () => {
        if (media.paused) return;
        if (seekingRef.current) {
          seekToLiveEdge();
        }
      };
      hls.on('hlsLevelUpdated', hlsHandler);
    }

    media.addEventListener('timeupdate', onTimeUpdate);

    return () => {
      media.removeEventListener('timeupdate', onTimeUpdate);
      if (hls && hlsHandler) {
        hls.off('hlsLevelUpdated', hlsHandler);
      }
    };
  }, [isLivestream, media]);
}
