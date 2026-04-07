import React from 'react';
import { useAppDispatch } from 'redux/hooks';
import { doUpdateFile } from 'redux/actions/publish';
import { doToast } from 'redux/actions/notifications';
import { cacheOptimizedFile } from 'util/uploadCache';
import classnames from 'classnames';
import './style.scss';

type Props = {
  file: File;
  format: string;
  videoCodec: string;
  audioCodec: string;
  variant: 'error' | 'mandatory' | 'recommended';
};

type TransmuxState = 'idle' | 'transmuxing' | 'done' | 'error';

export default function VideoFormatNotice({ file, format, videoCodec, audioCodec, variant }: Props) {
  const dispatch = useAppDispatch();
  const [state, setState] = React.useState<TransmuxState>('idle');
  const [progress, setProgress] = React.useState(0);
  const cancelRef = React.useRef<(() => void) | null>(null);

  // Check if the codecs are compatible with MP4 transmuxing (no re-encode needed)
  const videoCompatible =
    !videoCodec || ['avc', 'h264', 'hevc', 'h265', 'av1'].some((c) => videoCodec.toLowerCase().includes(c));
  const audioCompatible =
    !audioCodec || ['aac', 'mp3', 'ac3', 'eac3', 'opus'].some((c) => audioCodec.toLowerCase().includes(c));
  const canTransmux = videoCompatible && audioCompatible;

  async function handleConvert() {
    setState('transmuxing');
    setProgress(0);
    let input;

    try {
      const mb = await import('odysee-media-usagi');
      input = new mb.Input({
        formats: mb.ALL_FORMATS,
        source: new mb.BlobSource(file),
      });
      const target = new mb.BufferTarget();
      const output = new mb.Output({
        format: new mb.Mp4OutputFormat(),
        target,
      });

      const conversionOptions: any = { input, output };

      if (canTransmux) {
        // Transmux: copy codecs without re-encoding (fast)
        conversionOptions.video = { forceTranscode: false };
        conversionOptions.audio = { forceTranscode: false };
      } else {
        // Need to transcode incompatible codecs
        conversionOptions.video = { codec: 'avc', bitrate: 5_000_000 };
        conversionOptions.audio = { codec: 'aac', bitrate: 128_000 };
      }

      const conversion = await mb.Conversion.init(conversionOptions);

      let canceled = false;
      cancelRef.current = () => {
        canceled = true;
        conversion.cancel();
      };

      conversion.onProgress = (p: number) => {
        if (!canceled) setProgress(p);
      };

      await conversion.execute();
      cancelRef.current = null;

      if (canceled) return;

      const blob = new Blob([target.buffer], { type: 'video/mp4' });
      const mp4File = new File([blob], file.name.replace(/\.[^.]+$/, '.mp4'), {
        type: 'video/mp4',
      });

      setState('done');
      // Cache in IndexedDB so the file survives page refresh during upload
      const cacheKey = `converted-${file.name}-${file.size}`;
      cacheOptimizedFile(cacheKey, mp4File).catch(() => {});
      dispatch(doToast({ message: __('Video converted to MP4!') }));
      dispatch(doUpdateFile(mp4File, false));
    } catch (e: unknown) {
      cancelRef.current = null;
      if (e instanceof Error && e.message?.includes('cancel')) {
        setState('idle');
        setProgress(0);
        return;
      }
      console.error('[FormatConvert] Failed:', e); // eslint-disable-line no-console
      setState('error');
      dispatch(
        doToast({
          isError: true,
          message: __('Format conversion failed. You can still try publishing the original.'),
        })
      );
    } finally {
      if (input) {
        input.dispose();
      }
    }
  }

  function handleCancel() {
    cancelRef.current?.();
    cancelRef.current = null;
    setState('idle');
    setProgress(0);
  }

  if (state === 'done') return null;

  const progressPercent = Math.round(progress * 100);

  return (
    <div className={`format-notice publish-status-card publish-status-card--${variant}`}>
      <div className="publish-status-card__header">
        <div className="publish-status-card__icon">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>

        <div className="publish-status-card__text">
          <h3 className="publish-status-card__title">
            {__('Format Conversion')}
            <span className="format-notice__label">
              {variant === 'mandatory' ? __('Mandatory') : variant === 'error' ? __('Required') : __('Recommended')}
            </span>
          </h3>
          <p className="publish-status-card__description">
            {variant === 'mandatory'
              ? canTransmux
                ? __('Your %format% file must be converted to MP4 for playback compatibility.', {
                    format: format.toUpperCase(),
                  })
                : __('Your %format% file needs transcoding to MP4 for reliable playback. This may take a moment.', {
                    format: format.toUpperCase(),
                  })
              : canTransmux
                ? __('Your %format% file will be automatically converted to MP4 for better playback compatibility.', {
                    format: format.toUpperCase(),
                  })
                : __('Your %format% file will be automatically transcoded to MP4 for reliable playback.', {
                    format: format.toUpperCase(),
                  })}
          </p>
          <span className="format-notice__hint">
            {canTransmux ? __('Fast, no quality loss') : __('May take a few minutes, slight quality change')}
          </span>
        </div>

        {state === 'idle' &&
          (variant === 'mandatory' ? (
            <label className="publish-status-card__action" style={{ pointerEvents: 'none', opacity: 0.7 }}>
              <input type="checkbox" checked readOnly />
              <span>{__('Convert')}</span>
            </label>
          ) : (
            <label className="publish-status-card__action" onClick={handleConvert}>
              <input type="checkbox" defaultChecked />
              <span>{__('Convert')}</span>
            </label>
          ))}
      </div>

      <div className="format-notice__body">
        {state === 'idle' && null}

        {state === 'transmuxing' && (
          <>
            <div className="format-notice__progress">
              <div className="format-notice__progress-bar">
                <div className="format-notice__progress-fill" style={{ width: `${progressPercent}%` }} />
              </div>
              <span className="format-notice__progress-text">{progressPercent}%</span>
            </div>
            <button className="format-notice__btn format-notice__btn--cancel" onClick={handleCancel}>
              {__('Cancel')}
            </button>
          </>
        )}

        {state === 'error' && (
          <p className="format-notice__text format-notice__text--error">
            {__('Conversion failed. You can still publish the original file.')}
          </p>
        )}
      </div>
    </div>
  );
}
