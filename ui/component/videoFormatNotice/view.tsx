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
};

type TransmuxState = 'idle' | 'transmuxing' | 'done' | 'error';

export default function VideoFormatNotice({ file, format, videoCodec, audioCodec }: Props) {
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

    try {
      const mb = await import('mediabunny');
      const input = new mb.Input({
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
    <div className="format-notice">
      <div className="format-notice__icon">
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

      <div className="format-notice__body">
        {state === 'idle' && (
          <>
            <p className="format-notice__text">
              {canTransmux
                ? __('Your %format% file can be quickly converted to MP4 for better playback compatibility.', {
                    format: format.toUpperCase(),
                  })
                : __('Your %format% file needs transcoding to MP4 for reliable playback. This may take a moment.', {
                    format: format.toUpperCase(),
                  })}
            </p>
            <div className="format-notice__actions">
              <button className="format-notice__btn format-notice__btn--convert" onClick={handleConvert}>
                {canTransmux ? __('Convert to MP4') : __('Transcode to MP4')}
              </button>
              <span className="format-notice__hint">
                {canTransmux ? __('Near-instant, no quality loss') : __('Re-encodes to H.264/AAC')}
              </span>
            </div>
          </>
        )}

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
