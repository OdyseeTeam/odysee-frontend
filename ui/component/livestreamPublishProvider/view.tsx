import React from 'react';
import {
  LivestreamPublishContext,
  INITIAL_PUBLISH_STATE,
  type LivestreamPublishState,
  type LivestreamPublishStatus,
} from 'contexts/livestreamPublish';

type Props = {
  children: React.ReactNode;
};

/**
 * Inline stop logic so this module has zero heavy imports (keeps Vite HMR fast).
 * Mirrors stopWhipPublish() from util/livestreamWhip without importing it.
 */
async function stopStreamInline(
  pc: RTCPeerConnection | null,
  resourceUrl: string | null,
  stream: MediaStream
) {
  stream.getTracks().forEach((t) => t.stop());
  try {
    if (resourceUrl) await fetch(resourceUrl, { method: 'DELETE' });
  } catch {} // eslint-disable-line no-empty
  try {
    pc?.close();
  } catch {} // eslint-disable-line no-empty
}

export default function LivestreamPublishProvider({ children }: Props) {
  const stateRef = React.useRef<LivestreamPublishState>({ ...INITIAL_PUBLISH_STATE });
  const listenersRef = React.useRef<Set<() => void>>(new Set());
  const pcRef = React.useRef<RTCPeerConnection | null>(null);
  const resourceUrlRef = React.useRef<string | null>(null);

  function notify() {
    listenersRef.current.forEach((fn) => fn());
  }

  function updateState(partial: Partial<LivestreamPublishState>) {
    stateRef.current = { ...stateRef.current, ...partial };
    notify();
  }

  const contextValue = React.useMemo(
    () => ({
      getState: () => stateRef.current,
      subscribe: (fn: () => void) => {
        listenersRef.current.add(fn);
        return () => { listenersRef.current.delete(fn); };
      },
      actions: {
        setStatus: (status: LivestreamPublishStatus) => updateState({ status }),
        setMediaStream: (mediaStream: MediaStream | null) => updateState({ mediaStream }),
        setErrorMessage: (errorMessage: string | null) => updateState({ errorMessage }),
        setClaimUri: (claimUri: string | null) => updateState({ claimUri }),
        setFloatingPreviewEnabled: (floatingPreviewEnabled: boolean) => updateState({ floatingPreviewEnabled }),
        updateStats: (stats: Partial<LivestreamPublishState>) => updateState(stats),
        setPc: (pc: RTCPeerConnection | null) => { pcRef.current = pc; },
        setResourceUrl: (url: string | null) => { resourceUrlRef.current = url; },
        stopStream: async () => {
          const stream = stateRef.current.mediaStream;
          if (!stream) return;
          updateState({ status: 'stopping' });
          try {
            await stopStreamInline(pcRef.current, resourceUrlRef.current, stream);
          } finally {
            pcRef.current = null;
            resourceUrlRef.current = null;
            updateState({
              status: 'idle',
              mediaStream: null,
              errorMessage: null,
              resolution: null,
              fps: null,
              videoBitrateKbps: null,
              audioBitrateKbps: null,
              videoCodec: null,
              audioCodec: null,
              encoderImpl: null,
              connectionState: 'idle',
              qualityLimitationReason: null,
              liveStartedAt: null,
            });
          }
        },
      },
      refs: { pcRef, resourceUrlRef },
    }),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return <LivestreamPublishContext.Provider value={contextValue}>{children}</LivestreamPublishContext.Provider>;
}
