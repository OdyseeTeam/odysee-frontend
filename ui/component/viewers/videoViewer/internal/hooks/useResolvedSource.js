// @flow
import { useState, useEffect, useRef } from 'react';
import Lbry from 'lbry';
import { Lbryio } from 'lbryinc';
import { getStripeEnvironment } from 'util/stripe';

const stripeEnvironment = getStripeEnvironment();
const HLS_FILETYPE = 'application/x-mpegURL';

type ResolvedSource = {
  src: string,
  type: string,
  isHls: boolean,
  originalSrc: ?{ src: string, type: string },
  hlsSrc: ?{ src: string, type: string },
  thumbnailBasePath: ?string,
};

export default function useResolvedSource(
  source: string,
  sourceType: string,
  isLivestreamClaim: boolean,
  userClaimId: ?string,
  isProtectedContent: boolean,
  activeLivestreamForChannel: ?LivestreamActiveClaim,
  uri: string,
  doSetVideoSourceLoaded: (uri: string) => void
): ?ResolvedSource {
  const [resolved, setResolved] = useState(null);
  const playerServerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      const isLivestream = isLivestreamClaim && userClaimId;

      if (isLivestream) {
        if (isProtectedContent && activeLivestreamForChannel) {
          const protectedResponse = await Lbry.get({
            uri: activeLivestreamForChannel.uri,
            base_streaming_url: activeLivestreamForChannel.videoUrl,
            environment: stripeEnvironment,
          });
          if (cancelled) return;
          setResolved({
            src: protectedResponse.streaming_url,
            type: HLS_FILETYPE,
            isHls: true,
            originalSrc: null,
            hlsSrc: { src: protectedResponse.streaming_url, type: HLS_FILETYPE },
            thumbnailBasePath: null,
          });
        } else if (activeLivestreamForChannel && activeLivestreamForChannel.videoUrl) {
          const liveUrl = activeLivestreamForChannel.videoUrl;
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

      const response = await fetch(source, { method: 'HEAD', cache: 'no-store' });
      if (cancelled) return;

      playerServerRef.current = response.headers.get('x-powered-by');
      const originalSrc = { type: sourceType, src: source };

      let trimmedUrl = new URL(response.url);
      trimmedUrl.hash = '';
      trimmedUrl.search = '';
      trimmedUrl = trimmedUrl.toString();

      if (response && response.redirected && response.url && trimmedUrl.endsWith('m3u8') && response.status < 400) {
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
          error_message: `PlayerSourceLoadError: Url: ${response.url} | Redirected: ${String(
            response.redirected
          )} | Status: ${response.status} | X-Powered-By: ${playerServerRef.current || 'header missing'}`,
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
