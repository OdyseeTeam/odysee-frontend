import React from 'react';
import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';
import classnames from 'classnames';
import './style.scss';

export type VideoSource = {
  deviceId: string;
  label: string;
  kind: 'camera' | 'screen' | 'image';
};

export type AudioSource = {
  deviceId: string;
  label: string;
};

type Props = {
  activeVideoIds: Set<string>;
  activeAudioIds: Set<string>;
  activeVideoOrder?: string[];
  activeImageSources?: VideoSource[];
  onToggleVideo: (source: VideoSource) => void;
  onToggleAudio: (source: AudioSource) => void;
  onReorderVideo?: (fromId: string, toId: string) => void;
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
    disabled,
  } = props;
  const dragSourceRef = React.useRef<string | null>(null);
  const [videoSources, setVideoSources] = React.useState<VideoSource[]>([]);
  const [audioSources, setAudioSources] = React.useState<AudioSource[]>([]);
  const screenSupported =
    typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getDisplayMedia === 'function';

  React.useEffect(() => {
    async function init() {
      const devices = await navigator.mediaDevices?.enumerateDevices();
      const hasLabels = devices?.some((d) => d.label);
      if (!hasLabels) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
          stream.getTracks().forEach((t) => t.stop());
        } catch {}
      }
      enumerateDevices();
    }
    init();
    navigator.mediaDevices?.addEventListener('devicechange', enumerateDevices);
    return () => {
      navigator.mediaDevices?.removeEventListener('devicechange', enumerateDevices);
    };
  }, []);

  function enumerateDevices() {
    navigator.mediaDevices?.enumerateDevices().then((devices) => {
      const cameras: VideoSource[] = devices
        .filter((d) => d.kind === 'videoinput')
        .map((d, i) => ({
          deviceId: d.deviceId,
          label: (d.label || __('Camera %number%', { number: i + 1 }))
            .replace(/\s*\([0-9a-f]{4}:[0-9a-f]{4}\)\s*/gi, '')
            .trim(),
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

      const mics: AudioSource[] = devices
        .filter((d) => d.kind === 'audioinput')
        .map((d, i) => ({
          deviceId: d.deviceId,
          label: (d.label || __('Microphone %number%', { number: i + 1 }))
            .replace(/\s*\([0-9a-f]{4}:[0-9a-f]{4}\)\s*/gi, '')
            .trim(),
        }));

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
  const activeAudioSources = audioSources.filter((s) => activeAudioIds.has(s.deviceId));
  const inactiveAudioSources = audioSources.filter((s) => !activeAudioIds.has(s.deviceId));

  function renderVideoItem(source: VideoSource) {
    const isActive = activeVideoIds.has(source.deviceId);
    return (
      <button
        key={source.deviceId}
        className={classnames('livestream-sources__item', {
          'livestream-sources__item--active': isActive,
        })}
        onClick={() => onToggleVideo(source)}
        disabled={disabled}
      >
        {source.kind === 'image' ? (
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
        <span className="livestream-sources__item-label">{source.label}</span>
      </button>
    );
  }

  function renderAudioItem(source: AudioSource) {
    const isActive = activeAudioIds.has(source.deviceId);
    return (
      <button
        key={source.deviceId}
        className={classnames('livestream-sources__item', {
          'livestream-sources__item--active': isActive,
        })}
        onClick={() => onToggleAudio(source)}
        disabled={disabled}
      >
        <span
          className={classnames('livestream-sources__checkbox', { 'livestream-sources__checkbox--checked': isActive })}
        />
        <span className="livestream-sources__item-label">{source.label}</span>
      </button>
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
                    <span className="livestream-sources__item-label">{source.label}</span>
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
            <div className="livestream-sources__list">{activeAudioSources.map(renderAudioItem)}</div>
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
