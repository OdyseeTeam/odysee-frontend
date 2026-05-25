import React from 'react';
import ReactDOM from 'react-dom';
import {
  LivestreamPublishContext,
  INITIAL_PUBLISH_STATE,
  type LivestreamPublishState,
  type LivestreamPublishStatus,
  type LivestreamStudioProps,
} from 'contexts/livestreamPublish';
import type { AudioMixer } from 'util/audioMixer';
import type { VideoSource, AudioSource } from 'component/livestreamSourceSelector/view';

const LivestreamStudio = React.lazy(() => import('component/livestreamStudio'));

type Props = {
  children: React.ReactNode;
};

async function stopPublishSessionInline(pc: RTCPeerConnection | null, resourceUrl: string | null) {
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
  const sourceStreamsRef = React.useRef<Map<string, MediaStream>>(new Map());
  const mediaElementsRef = React.useRef<Map<string, HTMLMediaElement>>(new Map());
  const audioMixerRef = React.useRef<AudioMixer | null>(null);
  const activatedVideoSourcesRef = React.useRef<Map<string, VideoSource>>(new Map());
  const activatedAudioSourcesRef = React.useRef<Map<string, AudioSource>>(new Map());
  const screenAudioByVideoIdRef = React.useRef<Map<string, string>>(new Map());
  const widgetCanvasesRef = React.useRef<Map<string, HTMLCanvasElement>>(new Map());
  const widgetAnimRef = React.useRef<Map<string, number>>(new Map());

  const studioHostRef = React.useRef<HTMLDivElement | null>(null);
  if (!studioHostRef.current && typeof document !== 'undefined') {
    studioHostRef.current = document.createElement('div');
    studioHostRef.current.className = 'livestream-studio-portal-host';
  }

  React.useEffect(() => {
    const host = studioHostRef.current;
    if (host && !host.parentNode) document.body.appendChild(host);
    return () => {
      if (host && host.parentNode) host.parentNode.removeChild(host);
    };
  }, []);

  const [studioProps, setStudioPropsState] = React.useState<LivestreamStudioProps | null>(null);
  const [isAttachedToSetup, setIsAttachedToSetup] = React.useState(false);

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
        return () => {
          listenersRef.current.delete(fn);
        };
      },
      actions: {
        setStatus: (status: LivestreamPublishStatus) => updateState({ status }),
        setMediaStream: (mediaStream: MediaStream | null) => updateState({ mediaStream }),
        setErrorMessage: (errorMessage: string | null) => updateState({ errorMessage }),
        setClaimUri: (claimUri: string | null) => updateState({ claimUri }),
        setFloatingPreviewEnabled: (floatingPreviewEnabled: boolean) => updateState({ floatingPreviewEnabled }),
        updateStats: (stats: Partial<LivestreamPublishState>) => updateState(stats),
        setPc: (pc: RTCPeerConnection | null) => {
          pcRef.current = pc;
        },
        setResourceUrl: (url: string | null) => {
          resourceUrlRef.current = url;
        },
        stopStream: async (options?: { preservePreview?: boolean }) => {
          const stream = stateRef.current.mediaStream;
          if (!stream) return;
          const preservePreview = Boolean(options?.preservePreview);
          updateState({ status: 'stopping' });
          try {
            await stopPublishSessionInline(pcRef.current, resourceUrlRef.current);
          } finally {
            if (!preservePreview) {
              stream.getTracks().forEach((t) => t.stop());
            }
            pcRef.current = null;
            resourceUrlRef.current = null;
            updateState({
              status: preservePreview ? 'preview' : 'idle',
              mediaStream: preservePreview ? stream : null,
              errorMessage: null,
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
            });
          }
        },
        setStudioProps: (props: LivestreamStudioProps | null) => setStudioPropsState(props),
        setStudioMount: (el: HTMLElement | null) => {
          const host = studioHostRef.current;
          if (!host) return;
          if (el) {
            if (host.parentNode !== el) el.appendChild(host);
            setIsAttachedToSetup(true);
          } else {
            if (host.parentNode !== document.body) document.body.appendChild(host);
            setIsAttachedToSetup(false);
          }
        },
      },
      refs: {
        pcRef,
        resourceUrlRef,
        sourceStreamsRef,
        mediaElementsRef,
        audioMixerRef,
        activatedVideoSourcesRef,
        activatedAudioSourcesRef,
        screenAudioByVideoIdRef,
        widgetCanvasesRef,
        widgetAnimRef,
      },
    }),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <LivestreamPublishContext.Provider value={contextValue}>
      {children}
      {studioProps && studioHostRef.current && (
        <React.Suspense fallback={null}>
          {ReactDOM.createPortal(
            <LivestreamStudio {...studioProps} isFloating={!isAttachedToSetup} />,
            studioHostRef.current
          )}
        </React.Suspense>
      )}
    </LivestreamPublishContext.Provider>
  );
}
