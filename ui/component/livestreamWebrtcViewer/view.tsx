import React from 'react';
import * as SETTINGS from 'constants/settings';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectClientSetting } from 'redux/selectors/settings';
import { doSetClientSetting } from 'redux/actions/settings';
import { selectPrefsReady } from 'redux/selectors/sync';
import { getLivestreamWebrtcPlaybackUrl } from 'constants/livestream';
import { startWebrtcViewer, stopWebrtcViewer, type WebrtcViewerResult } from 'util/livestreamWebrtcViewer';
import classnames from 'classnames';
import './style.scss';

type Props = {
  channelClaimId: string;
  isCurrentClaimLive: boolean;
  /** Called when user exits WebRTC mode to go back to HLS */
  onExit: () => void;
};

type ViewerStatus = 'idle' | 'connecting' | 'playing' | 'error';

export default function LivestreamWebrtcViewer({ channelClaimId, isCurrentClaimLive, onExit }: Props) {
  const dispatch = useAppDispatch();
  const prefsReady = useAppSelector(selectPrefsReady);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const viewerRef = React.useRef<WebrtcViewerResult | null>(null);
  const [viewerStatus, setViewerStatus] = React.useState<ViewerStatus>('idle');
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const signalingUrl = getLivestreamWebrtcPlaybackUrl(channelClaimId);
  const canConnect = Boolean(signalingUrl && isCurrentClaimLive);

  // Connect immediately on mount
  React.useEffect(() => {
    if (!canConnect || !signalingUrl) return;

    let canceled = false;
    const ac = new AbortController();
    setViewerStatus('connecting');
    setErrorMsg(null);

    startWebrtcViewer(signalingUrl, ac.signal)
      .then((result) => {
        if (canceled) {
          stopWebrtcViewer(result);
          return;
        }
        viewerRef.current = result;
        setViewerStatus('playing');
        const el = videoRef.current;
        if (el) {
          el.srcObject = result.stream;
          el.play().catch(() => {});
        }
      })
      .catch((e) => {
        if (canceled) return;
        setViewerStatus('error');
        setErrorMsg(e instanceof Error ? e.message : String(e));
      });

    return () => {
      canceled = true;
      ac.abort();
      stopWebrtcViewer(viewerRef.current);
      viewerRef.current = null;
    };
  }, [canConnect, signalingUrl]);

  function handleExit() {
    stopWebrtcViewer(viewerRef.current);
    viewerRef.current = null;
    setViewerStatus('idle');
    onExit();
  }

  function handleDisableAndExit() {
    dispatch(doSetClientSetting(SETTINGS.P2P_DELIVERY, false, prefsReady));
    handleExit();
  }

  return (
    <div
      className={classnames('webrtc-viewer', {
        'webrtc-viewer--playing': viewerStatus === 'playing',
        'webrtc-viewer--connecting': viewerStatus === 'connecting',
        'webrtc-viewer--error': viewerStatus === 'error',
      })}
    >
      <video ref={videoRef} className="webrtc-viewer__video" playsInline autoPlay />

      {viewerStatus === 'connecting' && (
        <div className="webrtc-viewer__overlay">
          <div className="webrtc-viewer__spinner" />
          <span className="webrtc-viewer__overlay-text">{__('Connecting P2P...')}</span>
        </div>
      )}

      {viewerStatus === 'error' && (
        <div className="webrtc-viewer__overlay">
          <p className="webrtc-viewer__overlay-text">{__('P2P connection failed')}</p>
          {errorMsg && <p className="webrtc-viewer__overlay-sub">{errorMsg}</p>}
          <button className="webrtc-viewer__overlay-btn" onClick={handleExit}>
            {__('Switch to standard player')}
          </button>
        </div>
      )}

      {/* Top-right controls: P2P badge + exit button */}
      {viewerStatus === 'playing' && (
        <div className="webrtc-viewer__top-bar">
          <span className="webrtc-viewer__badge">
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            {__('P2P')}
          </span>
          <button className="webrtc-viewer__exit-btn" onClick={handleExit} title={__('Exit P2P mode')}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
