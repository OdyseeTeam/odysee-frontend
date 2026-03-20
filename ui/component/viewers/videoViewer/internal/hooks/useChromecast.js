// @flow
import { useEffect, useState, useCallback, useRef } from 'react';

function isSessionActive(session) {
  if (!session) return false;
  const state = session.getSessionState();
  const fw = window.cast && window.cast.framework;
  if (!fw) return false;
  return state === fw.SessionState.SESSION_STARTED || state === fw.SessionState.SESSION_RESUMED;
}

export function isCastSessionActive(): boolean {
  try {
    const cast = window.cast;
    if (!cast || !cast.framework || !cast.framework.CastContext) return false;
    const ctx = cast.framework.CastContext.getInstance();
    if (!ctx) return false;
    return isSessionActive(ctx.getCurrentSession());
  } catch (e) {
    return false;
  }
}

const DEFAULT_CAST_STATE = {
  currentTime: 0,
  duration: 0,
  volume: 1,
  isMuted: false,
  isPaused: true,
  playerState: 'IDLE',
  deviceName: '',
};

export default function useChromecast() {
  const [castAvailable, setCastAvailable] = useState(false);
  const [isCasting, setIsCasting] = useState(false);
  const [castState, setCastState] = useState(DEFAULT_CAST_STATE);
  const contextRef = useRef(null);
  const remotePlayerRef = useRef(null);
  const controllerRef = useRef(null);
  const pollRef = useRef(null);
  const castActionsRef = useRef(null);

  const updateCastState = useCallback(() => {
    const player = remotePlayerRef.current;
    if (!player) return;
    const ctx = contextRef.current;
    const session = ctx ? ctx.getCurrentSession() : null;
    const device = session ? session.getCastDevice() : null;
    setCastState({
      currentTime: player.currentTime || 0,
      duration: player.duration || 0,
      volume: player.volumeLevel != null ? player.volumeLevel : 1,
      isMuted: Boolean(player.isMuted),
      isPaused: Boolean(player.isPaused),
      playerState: player.playerState || 'IDLE',
      deviceName: device ? device.friendlyName || '' : '',
    });
  }, []);

  const startRemoteSync = useCallback(() => {
    try {
      const player = new window.cast.framework.RemotePlayer();
      const controller = new window.cast.framework.RemotePlayerController(player);
      remotePlayerRef.current = player;
      controllerRef.current = controller;

      const events = window.cast.framework.RemotePlayerEventType;
      const handler = () => updateCastState();
      controller.addEventListener(events.IS_PAUSED_CHANGED, handler);
      controller.addEventListener(events.PLAYER_STATE_CHANGED, handler);
      controller.addEventListener(events.DURATION_CHANGED, handler);
      controller.addEventListener(events.VOLUME_LEVEL_CHANGED, handler);
      controller.addEventListener(events.IS_MUTED_CHANGED, handler);

      pollRef.current = setInterval(updateCastState, 1000);
      updateCastState();
    } catch (e) {}
  }, [updateCastState]);

  const stopRemoteSync = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    remotePlayerRef.current = null;
    controllerRef.current = null;
    setCastState(DEFAULT_CAST_STATE);
  }, []);

  useEffect(() => {
    const initCast = (isAvailable) => {
      if (!isAvailable) return;
      try {
        const ctx = window.cast.framework.CastContext.getInstance();
        ctx.setOptions({
          receiverApplicationId: window.chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
          autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
        });
        contextRef.current = ctx;
        setCastAvailable(true);

        ctx.addEventListener(window.cast.framework.CastContextEventType.SESSION_STATE_CHANGED, () => {
          const session = ctx.getCurrentSession();
          const active = isSessionActive(session);
          setIsCasting(active);
          if (active) {
            startRemoteSync();
          } else {
            stopRemoteSync();
          }
        });

        if (isSessionActive(ctx.getCurrentSession())) {
          setIsCasting(true);
          startRemoteSync();
        }
      } catch (e) {}
    };

    if (window.cast && window.cast.framework && window.cast.framework.CastContext) {
      initCast(true);
    } else {
      window.__onGCastApiAvailable = initCast;
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [startRemoteSync, stopRemoteSync]);

  const loadMedia = useCallback(
    (src: string, title: ?string, subtitle: ?string, poster: ?string, contentType: ?string) => {
      const ctx = contextRef.current;
      if (!ctx) return;
      const session = ctx.getCurrentSession();
      if (!session) return;

      const ct = contentType || (src.includes('.m3u8') ? 'application/x-mpegURL' : 'video/mp4');
      const mediaInfo = new window.chrome.cast.media.MediaInfo(src, ct);
      mediaInfo.metadata = new window.chrome.cast.media.GenericMediaMetadata();
      mediaInfo.metadata.title = title || '';
      mediaInfo.metadata.subtitle = subtitle || '';
      if (poster) {
        mediaInfo.metadata.images = [new window.chrome.cast.Image(poster)];
      }

      const request = new window.chrome.cast.media.LoadRequest(mediaInfo);
      session.loadMedia(request).then(
        () => updateCastState(),
        () => {}
      );
    },
    [updateCastState]
  );

  const play = useCallback(() => {
    const controller = controllerRef.current;
    const player = remotePlayerRef.current;
    if (controller && player && player.isPaused) {
      controller.playOrPause();
    }
  }, []);

  const pause = useCallback(() => {
    const controller = controllerRef.current;
    const player = remotePlayerRef.current;
    if (controller && player && !player.isPaused) {
      controller.playOrPause();
    }
  }, []);

  const seek = useCallback((time: number) => {
    const player = remotePlayerRef.current;
    const controller = controllerRef.current;
    if (player && controller) {
      player.currentTime = time;
      controller.seek();
    }
  }, []);

  const setVolume = useCallback((level: number) => {
    const player = remotePlayerRef.current;
    const controller = controllerRef.current;
    if (player && controller) {
      player.volumeLevel = level;
      controller.setVolumeLevel();
    }
  }, []);

  const toggleMute = useCallback(() => {
    const controller = controllerRef.current;
    if (controller) {
      controller.muteOrUnmute();
    }
  }, []);

  const stop = useCallback(() => {
    const controller = controllerRef.current;
    if (controller) {
      controller.stop();
    }
    const ctx = contextRef.current;
    if (ctx) {
      const session = ctx.getCurrentSession();
      if (session) session.endSession(true);
    }
    setIsCasting(false);
    stopRemoteSync();
  }, [stopRemoteSync]);

  if (!castActionsRef.current) {
    castActionsRef.current = { loadMedia, play, pause, seek, setVolume, toggleMute, stop };
  }
  const ca = castActionsRef.current;
  ca.loadMedia = loadMedia;
  ca.play = play;
  ca.pause = pause;
  ca.seek = seek;
  ca.setVolume = setVolume;
  ca.toggleMute = toggleMute;
  ca.stop = stop;

  return { castAvailable, isCasting, castState, castActions: ca };
}
