import React from 'react';
import type { AudioMixer } from 'util/audioMixer';
import type { VideoSource, AudioSource } from 'component/livestreamSourceSelector/view';
import type { WebrtcPublishPresetId } from 'constants/webrtcPublish';

export type LivestreamStudioProps = {
  streamKey: string | null;
  livestreamUri?: string;
  livestreamEnabled: boolean;
  hasApprovedLivestreamClaim: boolean;
  presetId: WebrtcPublishPresetId;
  signature?: string;
  signingTs?: string;
};

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
  setStudioProps: (props: LivestreamStudioProps | null) => void;
  setStudioMount: (el: HTMLElement | null) => void;
};

export type LivestreamPublishRefs = {
  pcRef: React.MutableRefObject<RTCPeerConnection | null>;
  resourceUrlRef: React.MutableRefObject<string | null>;
  sourceStreamsRef: React.MutableRefObject<Map<string, MediaStream>>;
  mediaElementsRef: React.MutableRefObject<Map<string, HTMLMediaElement>>;
  audioMixerRef: React.MutableRefObject<AudioMixer | null>;
  activatedVideoSourcesRef: React.MutableRefObject<Map<string, VideoSource>>;
  activatedAudioSourcesRef: React.MutableRefObject<Map<string, AudioSource>>;
  screenAudioByVideoIdRef: React.MutableRefObject<Map<string, string>>;
  widgetCanvasesRef: React.MutableRefObject<Map<string, HTMLCanvasElement>>;
  widgetAnimRef: React.MutableRefObject<Map<string, number>>;
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
    setStudioProps: () => {},
    setStudioMount: () => {},
  },
  refs: {
    pcRef: { current: null },
    resourceUrlRef: { current: null },
    sourceStreamsRef: { current: new Map() },
    mediaElementsRef: { current: new Map() },
    audioMixerRef: { current: null },
    activatedVideoSourcesRef: { current: new Map() },
    activatedAudioSourcesRef: { current: new Map() },
    screenAudioByVideoIdRef: { current: new Map() },
    widgetCanvasesRef: { current: new Map() },
    widgetAnimRef: { current: new Map() },
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
