import React from 'react';
import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';
import classnames from 'classnames';
import './style.scss';

export type VideoSource = {
  deviceId: string;
  label: string;
  kind: 'camera' | 'screen';
};

export type AudioSource = {
  deviceId: string;
  label: string;
};

type Props = {
  activeVideoIds: Set<string>;
  activeAudioIds: Set<string>;
  onToggleVideo: (source: VideoSource) => void;
  onToggleAudio: (source: AudioSource) => void;
  disabled?: boolean;
};

export default function LivestreamSourceSelector(props: Props) {
  const { activeVideoIds, activeAudioIds, onToggleVideo, onToggleAudio, disabled } = props;
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
          label: d.label || __('Camera %number%', { number: i + 1 }),
          kind: 'camera' as const,
        }));

      if (screenSupported) {
        cameras.push({
          deviceId: '__screen__',
          label: __('Screen Share'),
          kind: 'screen',
        });
      }

      const mics: AudioSource[] = devices
        .filter((d) => d.kind === 'audioinput')
        .map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label || __('Microphone %number%', { number: i + 1 }),
        }));

      setVideoSources(cameras);
      setAudioSources(mics);
    });
  }

  return (
    <div className="livestream-sources">
      <div className="livestream-sources__box">
        <h3 className="livestream-sources__title">
          <Icon icon={ICONS.CAMERA} size={14} />
          {__('Video')}
        </h3>
        <div className="livestream-sources__list">
          {videoSources.map((source) => {
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
                <span
                  className={classnames('livestream-sources__checkbox', {
                    'livestream-sources__checkbox--checked': isActive,
                  })}
                />
                <Icon icon={source.kind === 'screen' ? ICONS.VIEW : ICONS.CAMERA} size={14} />
                <span className="livestream-sources__item-label">{source.label}</span>
              </button>
            );
          })}
          {videoSources.length === 0 && (
            <span className="livestream-sources__empty">{__('No video sources found')}</span>
          )}
        </div>
      </div>

      <div className="livestream-sources__box">
        <h3 className="livestream-sources__title">
          <Icon icon={ICONS.AUDIO} size={14} />
          {__('Audio')}
        </h3>
        <div className="livestream-sources__list">
          {audioSources.map((source) => {
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
                  className={classnames('livestream-sources__checkbox', {
                    'livestream-sources__checkbox--checked': isActive,
                  })}
                />
                <span className="livestream-sources__item-label">{source.label}</span>
              </button>
            );
          })}
          {audioSources.length === 0 && (
            <span className="livestream-sources__empty">{__('No audio sources found')}</span>
          )}
        </div>
      </div>
    </div>
  );
}
