import React from 'react';

export type LivestreamPublishStatus =
  | 'idle'
  | 'requesting_permission'
  | 'preview'
  | 'connecting'
  | 'live'
  | 'stopping'
  | 'error';

export type LivestreamPublishState = {
  status: LivestreamPublishStatus;
  mediaStream: MediaStream | null;
  errorMessage: string | null;
  claimUri: string | null;
  floatingPreviewEnabled: boolean;
  resolution: string | null;
  fps: number | null;
  videoBitrateKbps: number | null;
  audioBitrateKbps: number | null;
  videoCodec: string | null;
  audioCodec: string | null;
  encoderImpl?: string | null;
  avgEncodeMs?: number | null;
  connectionState: string;
  qualityLimitationReason?: string | null;
  qualityLimitationDurations?: Record<string, number> | null;
  /** Timestamp (ms) when the stream went live. Persists across navigation. */
  liveStartedAt: number | null;
};

export type LivestreamPublishActions = {
  setStatus: (status: LivestreamPublishStatus) => void;
  setMediaStream: (stream: MediaStream | null) => void;
  setErrorMessage: (msg: string | null) => void;
  setClaimUri: (uri: string | null) => void;
  setFloatingPreviewEnabled: (enabled: boolean) => void;
  updateStats: (stats: Partial<LivestreamPublishState>) => void;
  setPc: (pc: RTCPeerConnection | null) => void;
  setResourceUrl: (url: string | null) => void;
  stopStream: (options?: { preservePreview?: boolean }) => Promise<void>;
};

export type LivestreamPublishRefs = {
  pcRef: React.MutableRefObject<RTCPeerConnection | null>;
  resourceUrlRef: React.MutableRefObject<string | null>;
};

export type LivestreamPublishStore = {
  getState: () => LivestreamPublishState;
  subscribe: (fn: () => void) => () => void;
  actions: LivestreamPublishActions;
  refs: LivestreamPublishRefs;
};

export const INITIAL_PUBLISH_STATE: LivestreamPublishState = {
  status: 'idle',
  mediaStream: null,
  errorMessage: null,
  claimUri: null,
  floatingPreviewEnabled: true,
  resolution: null,
  fps: null,
  videoBitrateKbps: null,
  audioBitrateKbps: null,
  videoCodec: null,
  audioCodec: null,
  encoderImpl: null,
  avgEncodeMs: null,
  connectionState: 'idle',
  qualityLimitationReason: null,
  qualityLimitationDurations: null,
  liveStartedAt: null,
};

export const LivestreamPublishContext = React.createContext<LivestreamPublishStore>({
  getState: () => INITIAL_PUBLISH_STATE,
  subscribe: () => () => {},
  actions: {
    setStatus: () => {},
    setMediaStream: () => {},
    setErrorMessage: () => {},
    setClaimUri: () => {},
    setFloatingPreviewEnabled: () => {},
    updateStats: () => {},
    setPc: () => {},
    setResourceUrl: () => {},
    stopStream: () => Promise.resolve(),
  },
  refs: {
    pcRef: { current: null },
    resourceUrlRef: { current: null },
  },
});

/** Hook that subscribes to the livestream publish store and re-renders on changes. */
export function useLivestreamPublish() {
  const store = React.useContext(LivestreamPublishContext);
  const [state, setState] = React.useState(() => store.getState());

  React.useEffect(() => {
    // Sync in case state changed between render and effect
    setState(store.getState());
    return store.subscribe(() => setState(store.getState()));
  }, [store]);

  return { state, actions: store.actions, refs: store.refs };
}
