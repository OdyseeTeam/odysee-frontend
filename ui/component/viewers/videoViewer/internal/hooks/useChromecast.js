// @flow
import { useEffect, useState, useCallback, useRef } from 'react';

export default function useChromecast() {
  const [castAvailable, setCastAvailable] = useState(false);
  const [isCasting, setIsCasting] = useState(false);
  const contextRef = useRef(null);

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

        const onSessionChanged = () => {
          const session = ctx.getCurrentSession();
          setIsCasting(
            session != null && session.getSessionState() === window.cast.framework.SessionState.SESSION_STARTED
          );
        };

        ctx.addEventListener(window.cast.framework.CastContextEventType.SESSION_STATE_CHANGED, onSessionChanged);
      } catch (e) {}
    };

    if (window.cast?.framework?.CastContext) {
      initCast(true);
    } else {
      window.__onGCastApiAvailable = initCast;
    }
  }, []);

  const startCast = useCallback((src: string, title: ?string, channelTitle: ?string) => {
    const ctx = contextRef.current;
    if (!ctx) return;

    ctx.requestSession().then(
      () => {
        const session = ctx.getCurrentSession();
        if (!session) return;

        const mediaInfo = new window.chrome.cast.media.MediaInfo(src, 'video/mp4');
        mediaInfo.metadata = new window.chrome.cast.media.GenericMediaMetadata();
        mediaInfo.metadata.title = title || '';
        mediaInfo.metadata.subtitle = channelTitle || '';

        const request = new window.chrome.cast.media.LoadRequest(mediaInfo);
        session.loadMedia(request).then(
          () => setIsCasting(true),
          () => {}
        );
      },
      () => {}
    );
  }, []);

  const stopCast = useCallback(() => {
    const ctx = contextRef.current;
    if (!ctx) return;
    const session = ctx.getCurrentSession();
    if (session) {
      session.endSession(true);
      setIsCasting(false);
    }
  }, []);

  return { castAvailable, isCasting, startCast, stopCast };
}
