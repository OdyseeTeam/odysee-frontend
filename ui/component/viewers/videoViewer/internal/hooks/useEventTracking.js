// @flow
import { useEffect, useRef } from 'react';
import Player from '../player';
import analytics from 'analytics';

export default function useEventTracking(
  claimId: ?string,
  userId: ?number,
  claimValues: any,
  channelTitle: string,
  embedded: boolean,
  uri: string,
  isLivestreamClaim: boolean,
  doAnalyticsViewForUri: (string) => any,
  doAnalyticsBuffer: (string, any) => void,
  claimRewards: () => void
) {
  const store = Player.usePlayer();
  const media = Player.useMedia();
  const firstPlayTrackedRef = useRef(false);
  const startTimeRef = useRef(null);
  const bufferStartRef = useRef(null);

  useEffect(() => {
    if (!media || !claimId) return;

    firstPlayTrackedRef.current = false;
    startTimeRef.current = null;
    bufferStartRef.current = null;

    const handlePlay = () => {
      if (startTimeRef.current === null) {
        startTimeRef.current = performance.now();
      }
    };

    const handlePlaying = () => {
      if (!firstPlayTrackedRef.current && startTimeRef.current !== null) {
        firstPlayTrackedRef.current = true;
        // $FlowFixMe
        const secondsToLoad = (performance.now() - startTimeRef.current) / 1000;

        analytics.event.playerVideoStarted(embedded);

        if (!isLivestreamClaim && claimValues?.source?.size) {
          const contentInBits = Number(claimValues.source.size) * 8;
          const durationInSeconds = claimValues.video?.duration;
          let bitrateAsBitsPerSecond;
          if (durationInSeconds) {
            bitrateAsBitsPerSecond = Math.round(contentInBits / durationInSeconds);
          }

          const playerShim = {
            // $FlowFixMe
            currentSource: () => ({
              type: media.currentSrc && media.currentSrc.endsWith('.m3u8') ? 'application/x-mpegURL' : 'video/mp4',
              src: media.currentSrc,
            }),
          };
          analytics.video.videoStartEvent(
            claimId,
            secondsToLoad,
            'player-v10',
            userId,
            uri,
            playerShim,
            bitrateAsBitsPerSecond,
            isLivestreamClaim
          );
        } else {
          const playerShim = {
            // $FlowFixMe
            currentSource: () => ({
              type: media.currentSrc && media.currentSrc.endsWith('.m3u8') ? 'application/x-mpegURL' : 'video/mp4',
              src: media.currentSrc,
            }),
          };
          analytics.video.videoStartEvent(
            claimId,
            0,
            'player-v10',
            userId,
            uri,
            playerShim,
            undefined,
            isLivestreamClaim
          );
        }

        doAnalyticsViewForUri(uri).then(claimRewards);
      }

      if (bufferStartRef.current !== null) {
        // $FlowFixMe
        const bufferDuration = (performance.now() - bufferStartRef.current) / 1000;
        doAnalyticsBuffer(uri, {
          timeAtBuffer: store.state.currentTime,
          bufferDuration,
          isLivestream: isLivestreamClaim,
          playPoweredBy: isLivestreamClaim ? 'lvs' : 'player-v10',
        });
        bufferStartRef.current = null;
      }
    };

    const handleWaiting = () => {
      if (firstPlayTrackedRef.current) {
        bufferStartRef.current = performance.now();
      }
    };

    media.addEventListener('play', handlePlay);
    media.addEventListener('playing', handlePlaying);
    media.addEventListener('waiting', handleWaiting);

    return () => {
      media.removeEventListener('play', handlePlay);
      media.removeEventListener('playing', handlePlaying);
      media.removeEventListener('waiting', handleWaiting);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media, claimId, uri]);
}
