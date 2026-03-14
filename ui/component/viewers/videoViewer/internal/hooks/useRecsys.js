// @flow
import { useEffect, useRef } from 'react';
import Player from '../player';
// $FlowFixMe
import RecSys from 'extras/recsys/recsys';

const PlayerEvent = {
  event: { start: 0, stop: 1, scrub: 2, speed: 3, ended: 4 },
};

function newRecsysPlayerEvent(eventType, offset, arg) {
  return arg != null ? { event: eventType, offset, arg } : { event: eventType, offset };
}

export default function useRecsys(videoId: ?string, userId: ?number, embedded: boolean, shareTelemetry: boolean) {
  const store = Player.usePlayer();
  const media = Player.useMedia();

  const inPauseRef = useRef(false);
  const lastTimeUpdateRef = useRef(null);
  const currentTimeUpdateRef = useRef(null);
  const watchedDurationRef = useRef({ total: 0, lastTimestamp: -1 });
  const prevStateRef = useRef({ paused: true, ended: false, playbackRate: 1 });

  useEffect(() => {
    if (!shareTelemetry || !videoId || !media) return;

    const unsubscribe = store.subscribe(() => {
      const s = store.state;
      const prev = prevStateRef.current;

      // Play
      if (prev.paused && !s.paused) {
        const recsysEvent = newRecsysPlayerEvent(PlayerEvent.event.start, s.currentTime);
        RecSys.onRecsysPlayerEvent(videoId, recsysEvent, embedded);
        inPauseRef.current = false;
        lastTimeUpdateRef.current = s.currentTime;
      }

      // Pause
      if (!prev.paused && s.paused && !s.ended) {
        const recsysEvent = newRecsysPlayerEvent(PlayerEvent.event.stop, s.currentTime);
        RecSys.onRecsysPlayerEvent(videoId, recsysEvent);
        inPauseRef.current = true;
      }

      // Ended
      if (!prev.ended && s.ended) {
        const recsysEvent = newRecsysPlayerEvent(PlayerEvent.event.ended, s.currentTime);
        RecSys.onRecsysPlayerEvent(videoId, recsysEvent);
      }

      // Rate change
      if (prev.playbackRate !== s.playbackRate) {
        const recsysEvent = newRecsysPlayerEvent(PlayerEvent.event.speed, s.currentTime, s.playbackRate);
        RecSys.onRecsysPlayerEvent(videoId, recsysEvent);
      }

      // Time update (track watched duration)
      if (s.currentTime !== currentTimeUpdateRef.current) {
        const nextTime = s.currentTime;
        if (!inPauseRef.current && lastTimeUpdateRef.current !== null) {
          if (Math.abs(lastTimeUpdateRef.current - nextTime) < 0.5) {
            lastTimeUpdateRef.current = currentTimeUpdateRef.current;
          }
        }
        currentTimeUpdateRef.current = nextTime;

        const curTimeSec = nextTime.toFixed(0);
        const wd = watchedDurationRef.current;
        if (wd.lastTimestamp !== curTimeSec && !inPauseRef.current) {
          wd.total += 1;
          wd.lastTimestamp = curTimeSec;
          RecSys.updateRecsysEntry(videoId, 'totalPlayTime', wd.total);
          if (wd.total === 1 || wd.total % 5 === 0) {
            RecSys.saveEntries();
          }
        }
      }

      // Seeked
      if (prev.seeking && !s.seeking) {
        const fromTime = lastTimeUpdateRef.current;
        if (fromTime !== null && fromTime !== s.currentTime) {
          const recsysEvent = newRecsysPlayerEvent(PlayerEvent.event.scrub, fromTime, s.currentTime);
          RecSys.onRecsysPlayerEvent(videoId, recsysEvent);
        }
      }

      prevStateRef.current = {
        paused: s.paused,
        ended: s.ended,
        playbackRate: s.playbackRate,
        seeking: s.seeking,
        currentTime: s.currentTime,
      };
    });

    const wd = watchedDurationRef.current;
    return () => {
      unsubscribe();
      const s = store.state;
      const recsysEvent = newRecsysPlayerEvent(PlayerEvent.event.stop, s.currentTime);
      RecSys.onRecsysPlayerEvent(videoId, recsysEvent);
      RecSys.onPlayerDispose(videoId, embedded, wd.total);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, shareTelemetry, media]);
}
