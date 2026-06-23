import { useState, useEffect, useRef } from 'react';
import Lbry from 'lbry';
import { Lbryio } from 'lbryinc';
import { getStripeEnvironment } from 'util/stripe';
import { HLS_FILETYPE, resolveNonLivestreamSource } from 'util/playback-url';

const stripeEnvironment = getStripeEnvironment();

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
  userId,
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

      const resolvedSource = await resolveNonLivestreamSource({
        source,
        sourceType,
        isProtectedContent,
        userId,
        isCancelled: () => cancelled,
      });
      if (resolvedSource.cancelled) return;
      playerServerRef.current = resolvedSource.playerServer;
      if (resolvedSource.resolved) {
        setResolved(resolvedSource.resolved);
      }
      if (resolvedSource.errorEvent) {
        Lbryio.call('event', 'desktop_error', {
          error_message: `PlayerSourceLoadError: Url: ${
            resolvedSource.errorEvent.url
          } | Redirected: ${String(resolvedSource.errorEvent.redirected)} | Status: ${
            resolvedSource.errorEvent.status
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
  }, [source, sourceType, isLivestreamClaim, userClaimId, userId]);

  return resolved;
}
