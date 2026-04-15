import { useState, useEffect, useRef } from 'react';
import Lbry from 'lbry';
import { Lbryio } from 'lbryinc';
import { getStripeEnvironment } from 'util/stripe';

const stripeEnvironment = getStripeEnvironment();
const HLS_FILETYPE = 'application/x-mpegURL';

function logLivestreamSource(label, payload) {
  console.log(`[Livestream Viewer] ${label}`, payload); // eslint-disable-line no-console
}

export default function useResolvedSource(
  source,
  sourceType,
  isLivestreamClaim,
  userClaimId,
  isProtectedContent,
  activeLivestreamForChannel,
  uri,
  doSetVideoSourceLoaded
) {
  const [resolved, setResolved] = useState(null);
  const playerServerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      const isLivestream = isLivestreamClaim && userClaimId;

      if (isLivestream) {
        if (isProtectedContent && activeLivestreamForChannel) {
          logLivestreamSource('Resolving protected livestream source', {
            uri,
            preferredUrl: activeLivestreamForChannel.videoUrl || null,
            publicUrl: activeLivestreamForChannel.videoUrlPublic || null,
          });
          const protectedResponse = await Lbry.get({
            uri: activeLivestreamForChannel.uri,
            base_streaming_url: activeLivestreamForChannel.videoUrl,
            environment: stripeEnvironment,
          });
          if (cancelled) return;
          logLivestreamSource('Resolved protected livestream source', {
            uri,
            finalSrc: protectedResponse.streaming_url,
            preferredUrl: activeLivestreamForChannel.videoUrl || null,
            publicUrl: activeLivestreamForChannel.videoUrlPublic || null,
          });
          setResolved({
            src: protectedResponse.streaming_url,
            type: HLS_FILETYPE,
            isHls: true,
            originalSrc: null,
            hlsSrc: {
              src: protectedResponse.streaming_url,
              type: HLS_FILETYPE,
            },
            thumbnailBasePath: null,
          });
        } else if (activeLivestreamForChannel && activeLivestreamForChannel.videoUrl) {
          const liveUrl = activeLivestreamForChannel.videoUrl;
          logLivestreamSource('Resolved public livestream source', {
            uri,
            finalSrc: liveUrl,
            preferredUrl: activeLivestreamForChannel.videoUrl || null,
            publicUrl: activeLivestreamForChannel.videoUrlPublic || null,
          });
          setResolved({
            src: liveUrl,
            type: HLS_FILETYPE,
            isHls: true,
            originalSrc: null,
            hlsSrc: { src: liveUrl, type: HLS_FILETYPE },
            thumbnailBasePath: null,
          });
        }
        doSetVideoSourceLoaded(uri);
        return;
      }

      let response;
      const MAX_RETRIES = 5;
      const RETRY_DELAYS = [2000, 3000, 5000, 8000, 12000];
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        try {
          response = await fetch(source, {
            method: 'HEAD',
            cache: 'no-store',
            signal: controller.signal,
          });
        } catch (e) {
          clearTimeout(timeout);
          if (cancelled) return;
          if (source) {
            setResolved({
              src: source,
              type: sourceType,
              isHls: false,
              originalSrc: { type: sourceType, src: source },
              hlsSrc: null,
              thumbnailBasePath: null,
            });
          }
          doSetVideoSourceLoaded(uri);
          return;
        } finally {
          clearTimeout(timeout);
        }
        if (cancelled) return;
        if (response.status < 400 || attempt === MAX_RETRIES) break;
        await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt] || 5000));
        if (cancelled) return;
      }
      if (cancelled) return;

      playerServerRef.current = response.headers.get('x-powered-by');
      const originalSrc = { type: sourceType, src: source };

      const trimmedUrl = new URL(response.url);
      trimmedUrl.hash = '';
      trimmedUrl.search = '';
      const trimmedUrlString = trimmedUrl.toString();

      if (
        response &&
        response.redirected &&
        response.url &&
        trimmedUrlString.endsWith('m3u8') &&
        response.status < 400
      ) {
        const hlsSrc = { type: HLS_FILETYPE, src: response.url };
        const trimmedPath = response.url.substring(0, response.url.lastIndexOf('/'));
        setResolved({
          src: response.url,
          type: HLS_FILETYPE,
          isHls: true,
          originalSrc,
          hlsSrc,
          thumbnailBasePath: trimmedPath,
        });
      } else {
        if (source) {
          setResolved({
            src: source,
            type: sourceType,
            isHls: false,
            originalSrc,
            hlsSrc: null,
            thumbnailBasePath: null,
          });
        }
      }

      if (response.status >= 400) {
        Lbryio.call('event', 'desktop_error', {
          error_message: `PlayerSourceLoadError: Url: ${
            response.url
          } | Redirected: ${String(response.redirected)} | Status: ${
            response.status
          } | X-Powered-By: ${playerServerRef.current || 'header missing'}`,
        });
      }

      doSetVideoSourceLoaded(uri);
    }

    resolve().catch(console.error);

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, sourceType, isLivestreamClaim, userClaimId]);

  return resolved;
}
