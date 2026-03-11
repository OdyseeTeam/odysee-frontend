// @flow
import { useEffect, useState } from 'react';

export default function useChromecast(source: ?string, title: ?string, channelTitle: ?string) {
  const [castAvailable, setCastAvailable] = useState(false);
  useEffect(() => {
    if (typeof window.chrome === 'undefined' || !window.chrome?.cast) return;

    const checkCastAvailability = () => {
      try {
        if (window.cast?.framework?.CastContext) {
          setCastAvailable(true);
        }
      } catch (e) {
        // Cast not available
      }
    };

    window.__onGCastApiAvailable = (isAvailable) => {
      if (isAvailable) {
        try {
          const context = window.cast.framework.CastContext.getInstance();
          context.setOptions({
            receiverApplicationId: window.chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
            autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
          });
          setCastAvailable(true);
        } catch (e) {
          // Chromecast init failed
        }
      }
    };

    checkCastAvailability();

    return () => {
      try {
        // $FlowFixMe
        const session = window.cast?.framework?.CastContext?.getInstance()?.getCurrentSession();
        if (session) session.endSession(false);
      } catch (e) {}
    };
  }, []);

  return { castAvailable };
}
