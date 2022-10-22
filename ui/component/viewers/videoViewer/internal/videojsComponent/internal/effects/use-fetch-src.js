// @flow
import React from 'react';

import { HLS_FILETYPE } from 'constants/player';
import { platform } from 'util/platform';
import { FORCE_CONTENT_TYPE_PLAYER } from 'constants/claim';

import Lbry from 'lbry';

// $FlowFixMe
import { useSelector } from 'react-redux';

import { selectStreamingUrlForUri } from 'redux/selectors/file_info';
import {
  selectContentTypeForUri,
  selectProtectedContentTagForUri,
  selectContentTypeIsAudioForUri,
  selectIsLivestreamClaimForUri,
} from 'redux/selectors/claims';
import { selectActiveChannelLivestreamForUri } from 'redux/selectors/livestream';

import { getStripeEnvironment } from 'util/stripe';
const stripeEnvironment = getStripeEnvironment();

const IS_MOBILE = platform.isMobile();
const IS_IOS = platform.isIOS();

export default function useFetchStreamingSrc(
  uri: string,
  playerObj: any,
  reload: any,
  autoplay: any,
  playerServerRef: any
) {
  const streamingUrl = useSelector((state) => selectStreamingUrlForUri(state, uri));
  const contentType = useSelector((state) => selectContentTypeForUri(state, uri));
  const isAudio = useSelector((state) => selectContentTypeIsAudioForUri(state, uri));
  const isLivestream = useSelector((state) => selectIsLivestreamClaimForUri(state, uri));
  const isProtectedContent = useSelector((state) => Boolean(selectProtectedContentTagForUri(state, uri)));
  const activeLivestreamForChannel = useSelector((state) => selectActiveChannelLivestreamForUri(state, uri));

  const forcePlayer = FORCE_CONTENT_TYPE_PLAYER.includes(contentType);
  const playerType = forcePlayer ? 'video/mp4' : contentType;

  // This lifecycle hook is only called when playerObj exists to fetch the streaming src response.
  // That means the player element exists or was already initialized previously, and then also when `isAudio` or `streamingUrl` changes.
  React.useEffect(() => {
    if (playerObj) {
      (async () => {
        // TODO: pull this function into videojs-functions
        // determine which streamingUrl to use and load it
        if (isLivestream) {
          playerObj.isLivestream = true;
          playerObj.addClass('livestreamPlayer');

          // get the protected url if needed
          if (isProtectedContent) {
            // TODO: doFileGetForUri
            const protectedLivestreamResponse = await Lbry.get({
              uri: activeLivestreamForChannel.claimUri,
              base_streaming_url: activeLivestreamForChannel.url,
              environment: stripeEnvironment,
            });

            playerObj.src({ HLS_FILETYPE, src: protectedLivestreamResponse.streaming_url });
          } else {
            playerObj.src({ HLS_FILETYPE, src: activeLivestreamForChannel.url });
          }
        } else {
          playerObj.isLivestream = false;
          playerObj.removeClass('livestreamPlayer');

          const response = await fetch(streamingUrl, { method: 'HEAD', cache: 'no-store' });
          playerServerRef.current = response.headers.get('x-powered-by');
          playerObj.claimSrcOriginal = { type: playerType, src: streamingUrl };

          // remove query params for secured endpoints (which have query params on end of m3u8 path)
          let trimmedUrl = new URL(response.url);
          trimmedUrl.hash = '';
          trimmedUrl.search = '';
          trimmedUrl = trimmedUrl.toString();

          // change to m3u8 if applicable
          if (response && response.redirected && response.url && trimmedUrl.endsWith('m3u8')) {
            playerObj.claimSrcVhs = { type: HLS_FILETYPE, src: response.url };
            playerObj.src(playerObj.claimSrcVhs);
          } else {
            playerObj.src(playerObj.claimSrcOriginal);
          }
        }

        // bugfix thumbnails showing up if new video doesn't have them
        if (typeof playerObj.vttThumbnails.detach === 'function') {
          playerObj.vttThumbnails.detach();
        }

        // initialize hover thumbnails
        if (streamingUrl) {
          const trimmedPath = streamingUrl.substring(0, streamingUrl.lastIndexOf('/'));
          const thumbnailPath = trimmedPath + '/stream_sprite.vtt';

          // progress bar hover thumbnails
          if (!IS_MOBILE) {
            // if src is a function, it's already been initialized
            if (typeof playerObj.vttThumbnails.src === 'function') {
              playerObj.vttThumbnails.src(thumbnailPath);
            } else {
              // otherwise, initialize plugin
              playerObj.vttThumbnails({ src: thumbnailPath, showTimestamp: true });
            }
          }
        }

        playerObj.load();

        // allow tap to unmute if no perms on iOS
        if (autoplay) {
          const promise = playerObj.play();

          playerObj.userActive(true);

          if (promise !== undefined) {
            promise
              .then((_) => playerObj.controlBar.el().classList.add('vjs-transitioning-video'))
              .catch((error) => {
                const noPermissionError = typeof error === 'object' && error.name && error.name === 'NotAllowedError';

                if (noPermissionError) {
                  if (IS_IOS) {
                    // autoplay not allowed, mute video, play and show 'tap to unmute' button
                    playerObj.muted(true);
                    const mutedPlayPromise = playerObj.play();
                    if (mutedPlayPromise !== undefined) {
                      mutedPlayPromise
                        .then(() => {
                          const tapToUnmuteButton = document.querySelector('.video-js--tap-to-unmute');

                          tapToUnmuteButton && tapToUnmuteButton.style.setProperty('visibility', 'visible');
                          tapToUnmuteButton && tapToUnmuteButton.style.setProperty('display', 'inline', 'important');
                        })
                        .catch((error) => {
                          playerObj.addClass('vjs-paused');
                          playerObj.addClass('vjs-has-started');
                          const touchOverlay = document.querySelector('.vjs-touch-overlay');
                          const playControl = document.querySelector('.vjs-play-control');

                          touchOverlay && touchOverlay.classList.add('show-play-toggle');
                          playControl && playControl.classList.add('vjs-paused');
                        });
                    }
                  } else {
                    playerObj.bigPlayButton && playerObj.bigPlayButton.show();
                  }
                }
              });
          }
        }
      })();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run on these variables
  }, [playerObj, isAudio, streamingUrl, reload, isLivestream]);
}
