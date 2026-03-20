// @flow
import { useEffect, useRef } from 'react';
import Player from '../player';

const LIVE_SYNC_DURATION = 4;
const LIVE_EDGE_THRESHOLD = LIVE_SYNC_DURATION + 10;

export default function useLivestreamEdge(isLivestream: boolean) {
  const media = Player.useMedia();
  const seekingRef = useRef(true);

  useEffect(() => {
    if (!isLivestream || !media) return;

    seekingRef.current = true;

    const getLiveSyncPosition = () => {
      const hls = media._hls;
      if (hls && hls.liveSyncPosition != null) {
        return hls.liveSyncPosition;
      }
      if (media.seekable && media.seekable.length > 0) {
        return media.seekable.end(media.seekable.length - 1) - LIVE_SYNC_DURATION;
      }
      return null;
    };

    const seekToLiveEdge = () => {
      const syncPos = getLiveSyncPosition();
      if (syncPos != null) {
        media.currentTime = syncPos;
      }
    };

    const isAtLiveEdge = () => {
      const syncPos = getLiveSyncPosition();
      if (syncPos == null) return true;
      return syncPos - media.currentTime < LIVE_EDGE_THRESHOLD;
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
