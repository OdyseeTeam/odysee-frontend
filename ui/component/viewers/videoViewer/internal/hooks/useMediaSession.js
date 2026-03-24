// @flow
import { useEffect } from 'react';
import Player from '../player';
import { THUMBNAIL_HEIGHT_POSTER, THUMBNAIL_WIDTH_POSTER } from 'config';
import { getThumbnailCdnUrl } from 'util/thumbnail';

export default function useMediaSession(claimValues: any, channelTitle: string) {
  const store = Player.usePlayer();
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
    navigator.mediaSession.setActionHandler('seekbackward', () => {
      const state = store.state;
      state.seek(Math.max(0, state.currentTime - 10));
    });
    // $FlowFixMe
    navigator.mediaSession.setActionHandler('seekforward', () => {
      const state = store.state;
      state.seek(Math.max(0, state.currentTime + 10));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media, claimValues?.title, channelTitle]);
}
