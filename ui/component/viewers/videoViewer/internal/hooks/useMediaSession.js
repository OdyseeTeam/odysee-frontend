// @flow
import { useEffect } from 'react';
import Player from '../player';
import { THUMBNAIL_HEIGHT_POSTER, THUMBNAIL_WIDTH_POSTER } from 'config';
import { getThumbnailCdnUrl } from 'util/thumbnail';

export default function useMediaSession(claimValues: any, channelTitle: string) {
  const media = Player.useMedia();

  useEffect(() => {
    if (!media || !('mediaSession' in navigator) || !claimValues) return;

    const thumbnail = getThumbnailCdnUrl({
      thumbnail: claimValues?.thumbnail?.url,
      width: THUMBNAIL_WIDTH_POSTER,
      height: THUMBNAIL_HEIGHT_POSTER,
    });

    // $FlowFixMe
    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: claimValues.title,
      artist: channelTitle,
      artwork: thumbnail ? [{ src: thumbnail }] : undefined,
    });

    // $FlowFixMe
    navigator.mediaSession.setActionHandler('play', () => media.play());
    // $FlowFixMe
    navigator.mediaSession.setActionHandler('pause', () => media.pause());
    // $FlowFixMe
    navigator.mediaSession.setActionHandler('seekbackward', () => {
      media.currentTime = Math.max(0, media.currentTime - 10);
    });
    // $FlowFixMe
    navigator.mediaSession.setActionHandler('seekforward', () => {
      media.currentTime = Math.min(media.duration || Infinity, media.currentTime + 10);
    });
    // $FlowFixMe
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime != null) {
        media.currentTime = details.seekTime;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media, claimValues, channelTitle]);
}
