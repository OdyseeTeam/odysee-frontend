import React from 'react';
import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';
import { icons as customIcons } from 'component/common/icon-custom';
import classnames from 'classnames';
import './style.scss';

const OdyseePlay = customIcons[ICONS.PLAY];
const OdyseeRepeat = customIcons[ICONS.REPEAT];

function TruncatedLabel({ label }: { label: string }) {
  const match = label.match(/^(.*?)(\s*\(\d+\))$/);
  const base = match ? match[1] : label;
  const suffix = match ? match[2] : '';
  return (
    <span className="livestream-sources__item-label" title={label}>
      <span className="livestream-sources__item-label-base">{base}</span>
      {suffix && <span className="livestream-sources__item-label-suffix">{suffix}</span>}
    </span>
  );
}

export type VideoSource = {
  deviceId: string;
  label: string;
  kind: 'camera' | 'screen' | 'image' | 'videofile';
};

export type AudioSource = {
  deviceId: string;
  label: string;
  groupId?: string;
  kind?: 'mic' | 'audiofile';
};

type Props = {
  activeVideoIds: Set<string>;
  activeAudioIds: Set<string>;
  activeVideoOrder?: string[];
  activeImageSources?: VideoSource[];
  onToggleVideo: (source: VideoSource) => void;
  onToggleAudio: (source: AudioSource) => void;
  onReorderVideo?: (fromId: string, toId: string) => void;
  audioVolumes?: Record<string, number>;
  masterVolume?: number;
  onAudioVolumeChange?: (id: string, volume: number) => void;
  onMasterVolumeChange?: (volume: number) => void;
  getAudioLevel?: (id: string) => number;
  getMasterAudioLevel?: () => number;
  extraAudioSources?: AudioSource[];
  getAudioElement?: (id: string) => HTMLMediaElement | null;
  getVideoElement?: (id: string) => HTMLMediaElement | null;
  disabled?: boolean;
};

export default function LivestreamSourceSelector(props: Props) {
  const {
    activeVideoIds,
    activeAudioIds,
    activeVideoOrder,
    activeImageSources,
    onToggleVideo,
    onToggleAudio,
    onReorderVideo,
    audioVolumes,
    masterVolume,
    onAudioVolumeChange,
    onMasterVolumeChange,
    getAudioLevel,
    getMasterAudioLevel,
    extraAudioSources,
    getAudioElement,
    getVideoElement,
    disabled,
  } = props;
  const dragSourceRef = React.useRef<string | null>(null);
  const [videoSources, setVideoSources] = React.useState<VideoSource[]>([]);
  const [audioSources, setAudioSources] = React.useState<AudioSource[]>([]);
  const screenSupported =
    typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getDisplayMedia === 'function';

  React.useEffect(() => {
    enumerateDevices();

    const onVisibilityChange = () => {
      if (!document.hidden) enumerateDevices();
    };
    navigator.mediaDevices?.addEventListener('devicechange', enumerateDevices);
    window.addEventListener('focus', enumerateDevices);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      navigator.mediaDevices?.removeEventListener('devicechange', enumerateDevices);
      window.removeEventListener('focus', enumerateDevices);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  function enumerateDevices() {
    navigator.mediaDevices?.enumerateDevices().then((devices) => {
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      const audioInputs = devices.filter((d) => d.kind === 'audioinput');

      const cleanLabel = (raw: string) => raw.replace(/\s*\([0-9a-f]{4}:[0-9a-f]{4}\)\s*/gi, '').trim();

      const cameraLabel = (d: MediaDeviceInfo, i: number) =>
        cleanLabel(d.label || __('Camera %number%', { number: i + 1 }));

      const cameras: VideoSource[] = videoInputs.map((d, i) => ({
        deviceId: d.deviceId,
        label: cameraLabel(d, i),
        kind: 'camera' as const,
      }));

      if (screenSupported) {
        cameras.push({
          deviceId: '__screen__',
          label: __('Screen Share'),
          kind: 'screen',
        });
      }

      cameras.push({
        deviceId: '__image__',
        label: __('Image'),
        kind: 'image',
      });

      cameras.push({
        deviceId: '__videofile__',
        label: __('Video'),
        kind: 'videofile',
      });

      const mics: AudioSource[] = [];
      const usedAudioDeviceIds = new Set<string>();
      const pairedGroupIds = new Set<string>();

      videoInputs.forEach((cam, i) => {
        const groupId = cam.groupId;
        if (!groupId) return;
        const match = audioInputs.find((a) => a.groupId === groupId);
        const camLabel = cameraLabel(cam, i);
        if (match) {
          mics.push({
            deviceId: match.deviceId,
            label: cleanLabel(match.label) || `${camLabel} – ${__('Microphone')}`,
            groupId,
          });
          if (match.deviceId) usedAudioDeviceIds.add(match.deviceId);
        } else {
          mics.push({
            deviceId: `__camera_mic_${groupId}`,
            label: `${camLabel} – ${__('Microphone')}`,
            groupId,
          });
        }
        pairedGroupIds.add(groupId);
      });

      audioInputs
        .filter((a) => !usedAudioDeviceIds.has(a.deviceId) && (!a.groupId || !pairedGroupIds.has(a.groupId)))
        .forEach((d, i) => {
          mics.push({
            deviceId: d.deviceId,
            label: cleanLabel(d.label) || __('Microphone %number%', { number: i + 1 }),
            groupId: d.groupId || undefined,
          });
        });

      mics.push({
        deviceId: '__audiofile__',
        label: __('Audio'),
        kind: 'audiofile',
      });

      setVideoSources(cameras);
      setAudioSources(mics);
    });
  }

  const allVideoSources = [...videoSources, ...(activeImageSources || [])];

  const activeVideoSources = (() => {
    const active = allVideoSources.filter((s) => activeVideoIds.has(s.deviceId));
    if (activeVideoOrder) {
      return active.sort((a, b) => {
        const ai = activeVideoOrder.indexOf(a.deviceId);
        const bi = activeVideoOrder.indexOf(b.deviceId);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      });
    }
    return active;
  })();
  const inactiveVideoSources = videoSources.filter((s) => !activeVideoIds.has(s.deviceId));
  const allAudioSources = [...audioSources, ...(extraAudioSources || [])];
  const activeAudioSources = allAudioSources.filter((s) => activeAudioIds.has(s.deviceId));
  const inactiveAudioSources = audioSources.filter((s) => !activeAudioIds.has(s.deviceId));

  function renderVideoItem(source: VideoSource) {
    const isActive = activeVideoIds.has(source.deviceId);
    const videoEl = isActive && getVideoElement ? getVideoElement(source.deviceId) : null;
    if (videoEl) {
      return (
        <div
          key={source.deviceId}
          className="livestream-sources__item livestream-sources__item--audio livestream-sources__item--active"
        >
          <button className="livestream-sources__item-toggle" onClick={() => onToggleVideo(source)} disabled={disabled}>
            <span className="livestream-sources__checkbox livestream-sources__checkbox--checked" />
            <TruncatedLabel label={source.label} />
          </button>
          <MediaPlayerControls element={videoEl} />
        </div>
      );
    }
    return (
      <button
        key={source.deviceId}
        className={classnames('livestream-sources__item', {
          'livestream-sources__item--active': isActive,
        })}
        onClick={() => onToggleVideo(source)}
        disabled={disabled}
      >
        {source.kind === 'image' || source.kind === 'videofile' ? (
          <span className="livestream-sources__add-icon">+</span>
        ) : (
          <span
            className={classnames('livestream-sources__checkbox', {
              'livestream-sources__checkbox--checked': isActive,
            })}
          />
        )}
        {source.kind === 'screen' ? (
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
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        ) : source.kind === 'image' ? (
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
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        ) : source.kind === 'videofile' ? (
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
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
        ) : (
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
            <path d="M23 7l-7 5 7 5V7z" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
        )}
        <TruncatedLabel label={source.label} />
      </button>
    );
  }

  function renderAudioItem(source: AudioSource) {
    const isActive = activeAudioIds.has(source.deviceId);
    const volume = audioVolumes?.[source.deviceId] ?? 1;
    const isPicker = source.kind === 'audiofile';
    return (
      <div
        key={source.deviceId}
        className={classnames('livestream-sources__item livestream-sources__item--audio', {
          'livestream-sources__item--active': isActive,
        })}
      >
        <button className="livestream-sources__item-toggle" onClick={() => onToggleAudio(source)} disabled={disabled}>
          {isPicker ? (
            <span className="livestream-sources__add-icon">+</span>
          ) : (
            <span
              className={classnames('livestream-sources__checkbox', {
                'livestream-sources__checkbox--checked': isActive,
              })}
            />
          )}
          {isPicker && (
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
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          )}
          <TruncatedLabel label={source.label} />
          {isActive && onAudioVolumeChange && (
            <span className="livestream-sources__volume-value">{Math.round(volume * 100)}%</span>
          )}
        </button>
        {isActive && getAudioElement && getAudioElement(source.deviceId) && (
          <MediaPlayerControls element={getAudioElement(source.deviceId)} />
        )}
        {isActive && onAudioVolumeChange && (
          <>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => onAudioVolumeChange(source.deviceId, parseFloat(e.target.value))}
              className="livestream-sources__volume-slider"
            />
            {getAudioLevel && <MeterBar getLevel={() => getAudioLevel(source.deviceId)} resetSignal={volume} />}
          </>
        )}
      </div>
    );
  }

  function renderMasterRow() {
    if (!onMasterVolumeChange || activeAudioIds.size < 2) return null;
    const v = masterVolume ?? 1;
    return (
      <div className="livestream-sources__item livestream-sources__item--audio livestream-sources__item--master">
        <div className="livestream-sources__item-toggle livestream-sources__item-toggle--static">
          <span className="livestream-sources__item-label">{__('Master')}</span>
          <span className="livestream-sources__volume-value">{Math.round(v * 100)}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={v}
          onChange={(e) => onMasterVolumeChange(parseFloat(e.target.value))}
          className="livestream-sources__volume-slider"
        />
        {getMasterAudioLevel && <MeterBar getLevel={getMasterAudioLevel} resetSignal={v} />}
      </div>
    );
  }

  return (
    <div className="livestream-sources">
      <div className="livestream-sources__box">
        <h3 className="livestream-sources__title">
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
            <path d="M23 7l-7 5 7 5V7z" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
          {__('Video')}
        </h3>
        {activeVideoSources.length > 0 && (
          <div className="livestream-sources__subbox">
            <span className="livestream-sources__subbox-label">{__('Active')}</span>
            <div className="livestream-sources__list">
              {activeVideoSources.map((source, idx) => (
                <div
                  key={source.deviceId}
                  className="livestream-sources__active-row"
                  draggable
                  onDragStart={() => {
                    dragSourceRef.current = source.deviceId;
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragSourceRef.current && dragSourceRef.current !== source.deviceId && onReorderVideo) {
                      onReorderVideo(dragSourceRef.current, source.deviceId);
                    }
                    dragSourceRef.current = null;
                  }}
                >
                  <div className="livestream-sources__item livestream-sources__item--active">
                    {source.kind === 'image' ? (
                      <span
                        className="livestream-sources__remove-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleVideo(source);
                        }}
                      >
                        ×
                      </span>
                    ) : (
                      <span
                        className="livestream-sources__checkbox livestream-sources__checkbox--checked"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleVideo(source);
                        }}
                      />
                    )}
                    {source.kind === 'screen' ? (
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
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                        <line x1="8" y1="21" x2="16" y2="21" />
                        <line x1="12" y1="17" x2="12" y2="21" />
                      </svg>
                    ) : source.kind === 'image' ? (
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
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    ) : (
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
                        <path d="M23 7l-7 5 7 5V7z" />
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                      </svg>
                    )}
                    <TruncatedLabel label={source.label} />
                  </div>
                  <div className="livestream-sources__reorder-btns">
                    <button
                      className="livestream-sources__reorder-btn"
                      disabled={idx === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (idx > 0 && onReorderVideo)
                          onReorderVideo(source.deviceId, activeVideoSources[idx - 1].deviceId);
                      }}
                    >
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <polyline points="18 15 12 9 6 15" />
                      </svg>
                    </button>
                    <button
                      className="livestream-sources__reorder-btn"
                      disabled={idx === activeVideoSources.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (idx < activeVideoSources.length - 1 && onReorderVideo)
                          onReorderVideo(source.deviceId, activeVideoSources[idx + 1].deviceId);
                      }}
                    >
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="livestream-sources__subbox">
          <span className="livestream-sources__subbox-label">{__('Available')}</span>
          <div className="livestream-sources__list">
            {inactiveVideoSources.map(renderVideoItem)}
            {inactiveVideoSources.length === 0 && videoSources.length > 0 && (
              <span className="livestream-sources__empty">{__('All sources active')}</span>
            )}
            {videoSources.length === 0 && (
              <span className="livestream-sources__empty">{__('No video sources found')}</span>
            )}
          </div>
        </div>
      </div>

      <div className="livestream-sources__box">
        <h3 className="livestream-sources__title">
          <Icon icon={ICONS.AUDIO} size={14} />
          {__('Audio')}
        </h3>
        {activeAudioSources.length > 0 && (
          <div className="livestream-sources__subbox">
            <span className="livestream-sources__subbox-label">{__('Active')}</span>
            <div className="livestream-sources__list">
              {renderMasterRow()}
              {activeAudioSources.map(renderAudioItem)}
            </div>
          </div>
        )}
        <div className="livestream-sources__subbox">
          <span className="livestream-sources__subbox-label">{__('Available')}</span>
          <div className="livestream-sources__list">
            {inactiveAudioSources.map(renderAudioItem)}
            {inactiveAudioSources.length === 0 && audioSources.length > 0 && (
              <span className="livestream-sources__empty">{__('All sources active')}</span>
            )}
            {audioSources.length === 0 && (
              <span className="livestream-sources__empty">{__('No audio sources found')}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MeterBar({ getLevel, resetSignal }: { getLevel: () => number; resetSignal?: unknown }) {
  const fillRef = React.useRef<HTMLDivElement | null>(null);
  const peakRef = React.useRef<HTMLDivElement | null>(null);
  const peakRefValue = React.useRef(0);

  React.useEffect(() => {
    peakRefValue.current = 0;
    if (peakRef.current) peakRef.current.style.left = '0%';
  }, [resetSignal]);

  React.useEffect(() => {
    let raf = 0;
    let peakHoldUntil = 0;
    const PEAK_HOLD_MS = 2500;
    const PEAK_DECAY_PER_SEC = 0.08;
    let lastTs = performance.now();
    const tick = (ts: number) => {
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;
      const rms = getLevel();
      const level = Math.max(0, Math.min(1, rms * 3));
      if (level > peakRefValue.current) {
        peakRefValue.current = level;
        peakHoldUntil = ts + PEAK_HOLD_MS;
      } else if (ts > peakHoldUntil) {
        peakRefValue.current = Math.max(level, peakRefValue.current - PEAK_DECAY_PER_SEC * dt);
      }
      if (peakRef.current) {
        const p = peakRefValue.current;
        peakRef.current.style.left = `${p * 100}%`;
        peakRef.current.style.backgroundColor = p >= 0.85 ? '#e74c3c' : p >= 0.7 ? '#f0c33c' : '#2dd06e';
      }
      if (fillRef.current) fillRef.current.style.clipPath = `inset(0 ${(1 - level) * 100}% 0 0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [getLevel]);

  return (
    <div className="livestream-sources__meter">
      <div className="livestream-sources__meter-fill" ref={fillRef} />
      <div className="livestream-sources__meter-peak" ref={peakRef} />
    </div>
  );
}

function MediaPlayerControls({ element }: { element: HTMLMediaElement }) {
  const [paused, setPaused] = React.useState(element.paused);
  const [loop, setLoop] = React.useState(element.loop);
  const [progress, setProgress] = React.useState(0);
  const [duration, setDuration] = React.useState(element.duration || 0);

  React.useEffect(() => {
    const onPlay = () => setPaused(false);
    const onPause = () => setPaused(true);
    const onLoaded = () => setDuration(element.duration || 0);
    element.addEventListener('play', onPlay);
    element.addEventListener('pause', onPause);
    element.addEventListener('loadedmetadata', onLoaded);
    return () => {
      element.removeEventListener('play', onPlay);
      element.removeEventListener('pause', onPause);
      element.removeEventListener('loadedmetadata', onLoaded);
    };
  }, [element]);

  React.useEffect(() => {
    let raf = 0;
    const tick = () => {
      setProgress(element.currentTime);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [element]);

  const formatTime = (s: number) => {
    if (!isFinite(s) || s < 0) return '0:00';
    const m = Math.floor(s / 60);
    const ss = Math.floor(s % 60)
      .toString()
      .padStart(2, '0');
    return `${m}:${ss}`;
  };

  return (
    <div className="livestream-sources__player">
      <div className="livestream-sources__player-row">
        <div className="livestream-sources__player-buttons">
          <button
            type="button"
            className="livestream-sources__player-btn"
            onClick={() => (element.paused ? element.play() : element.pause())}
            title={paused ? __('Play') : __('Pause')}
          >
            {paused ? (
              <OdyseePlay size={12} color="currentColor" />
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            )}
          </button>
          <button
            type="button"
            className="livestream-sources__player-btn"
            onClick={() => {
              element.pause();
              element.currentTime = 0;
            }}
            title={__('Stop')}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <rect x="5" y="5" width="14" height="14" rx="1.5" />
            </svg>
          </button>
          <button
            type="button"
            className={classnames('livestream-sources__player-btn', {
              'livestream-sources__player-btn--active': loop,
            })}
            onClick={() => {
              element.loop = !element.loop;
              setLoop(element.loop);
            }}
            title={__('Loop')}
          >
            <OdyseeRepeat size={12} color="currentColor" />
          </button>
        </div>
        <span className="livestream-sources__player-time">
          {formatTime(progress)} / {formatTime(duration)}
        </span>
      </div>
      <PlayerProgress
        progress={progress}
        duration={duration}
        onSeek={(v) => {
          element.currentTime = v;
        }}
      />
    </div>
  );
}

function PlayerProgress({
  progress,
  duration,
  onSeek,
}: {
  progress: number;
  duration: number;
  onSeek: (value: number) => void;
}) {
  const trackRef = React.useRef<HTMLDivElement | null>(null);
  const draggingRef = React.useRef(false);

  const setFromClientX = (clientX: number) => {
    const track = trackRef.current;
    if (!track || !duration) return;
    const rect = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onSeek(ratio * duration);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    draggingRef.current = true;
    setFromClientX(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    setFromClientX(e.clientX);
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = false;
    try {
      (e.target as Element).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const fillPct = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div
      className="livestream-sources__seek"
      ref={trackRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="livestream-sources__seek-track">
        <div className="livestream-sources__seek-fill" style={{ width: `${fillPct}%` }} />
      </div>
      <div className="livestream-sources__seek-thumb" style={{ left: `${fillPct}%` }} />
    </div>
  );
}
