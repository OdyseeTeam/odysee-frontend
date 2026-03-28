import React from 'react';
import { fetchStreamMetrics, type StreamMetrics } from 'util/livestreamMetrics';

const POLL_INTERVAL_MS = 5000;

/**
 * Polls the /stream/metrics endpoint every 5 seconds while the stream is active.
 *
 * @param channelClaimId  Active channel's claim ID.
 * @param channelName     Active channel's name (e.g. `@MyChannel`).
 * @param signature       Signature from `Lbry.channel_sign`.
 * @param signingTs       Signing timestamp from `Lbry.channel_sign`.
 * @param active          Whether polling should be active (e.g. user is live).
 */
export default function useLivestreamMetrics(
  channelClaimId: string | undefined,
  channelName: string | undefined,
  signature: string | undefined,
  signingTs: string | undefined,
  active: boolean
): StreamMetrics | null {
  const [metrics, setMetrics] = React.useState<StreamMetrics | null>(null);

  React.useEffect(() => {
    if (!active || !channelClaimId || !channelName || !signature || !signingTs) {
      setMetrics(null);
      return;
    }

    let canceled = false;
    const controller = new AbortController();

    async function poll() {
      const data = await fetchStreamMetrics(channelClaimId!, channelName!, signature!, signingTs!, controller.signal);
      if (!canceled) setMetrics(data);
    }

    // Initial fetch
    void poll();

    const interval = window.setInterval(() => void poll(), POLL_INTERVAL_MS);

    return () => {
      canceled = true;
      controller.abort();
      window.clearInterval(interval);
    };
  }, [channelClaimId, channelName, signature, signingTs, active]);

  return metrics;
}
