import React from 'react';
import classnames from 'classnames';
import { useAppDispatch } from 'redux/hooks';
import { doUpdatePublishForm } from 'redux/actions/publish';
import { doToast } from 'redux/actions/notifications';
import { cacheOptimizedFile } from 'util/uploadCache';
import './style.scss';

// Lazy-import mediabunny to keep it out of the main bundle
async function loadMediaBunny() {
  const mb = await import('mediabunny');
  return mb;
}

type Props = {
  file: File;
  fileBitrate: number; // bps
  onOptimized: (optimizedFile: File) => void;
  onSkip: () => void;
};

type AnalysisResult = {
  bitrateMbps: number;
  duration: number;
  width: number;
  height: number;
  videoCodec: string;
  audioCodec: string;
  needsFaststart: boolean; // moov atom not at beginning
  isHighBitrate: boolean;
  recommendedAction: 'faststart' | 'transcode' | 'none';
};

type OptimizeState = 'idle' | 'analyzing' | 'ready' | 'optimizing' | 'done' | 'error';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatSize(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${(bytes / 1e3).toFixed(0)} KB`;
}

function formatBitrate(bps: number): string {
  return `${(bps / 1e6).toFixed(1)} Mbps`;
}

/** Resolution-aware target bitrate. Never targets higher than the current bitrate. */
function getTargetBitrate(height: number, currentMbps: number): number {
  let target: number;
  if (height >= 2160) target = 12;       // 4K
  else if (height >= 1440) target = 8;   // 1440p
  else if (height >= 1080) target = 5;   // 1080p
  else if (height >= 720) target = 3;    // 720p
  else if (height >= 480) target = 1.5;  // 480p
  else target = 1;                        // below 480p
  // Don't target higher than what the file already has
  return Math.min(target, currentMbps * 0.7);
}

export default function VideoOptimizer({ file, fileBitrate, onOptimized, onSkip }: Props) {
  const dispatch = useAppDispatch();
  const [state, setState] = React.useState<OptimizeState>('idle');
  const [analysis, setAnalysis] = React.useState<AnalysisResult | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [estimatedSize, setEstimatedSize] = React.useState<number | null>(null);
  const cancelRef = React.useRef<(() => void) | null>(null);
  const [targetBitrateMbps, setTargetBitrateMbps] = React.useState(5);

  // Auto-analyze on mount
  React.useEffect(() => {
    let canceled = false;

    async function analyze() {
      setState('analyzing');
      try {
        const mb = await loadMediaBunny();
        const input = new mb.Input({
          formats: mb.ALL_FORMATS,
          source: new mb.BlobSource(file),
        });

        const videoTrack = await input.getPrimaryVideoTrack();
        const audioTrack = await input.getPrimaryAudioTrack();
        const duration = await input.computeDuration();

        const width = videoTrack?.displayWidth || 0;
        const height = videoTrack?.displayHeight || 0;
        const videoCodec = videoTrack?.codec || 'unknown';
        const audioCodec = audioTrack?.codec || 'unknown';
        const bitrateMbps = fileBitrate / 1e6;
        const isHighBitrate = bitrateMbps > 5;

        // Check if moov atom is at the beginning (faststart)
        // If we can read metadata quickly, it's likely already faststart
        // MediaBunny doesn't expose moov position directly, but we can infer:
        // if the file is MP4 and high bitrate, recommend transcode
        const isMp4 = file.type === 'video/mp4' || file.name.toLowerCase().endsWith('.mp4');
        const needsFaststart = false; // MediaBunny handles this internally during output

        let recommendedAction: 'faststart' | 'transcode' | 'none' = 'none';
        if (isHighBitrate) {
          recommendedAction = 'transcode';
        }

        if (canceled) return;

        const result: AnalysisResult = {
          bitrateMbps,
          duration: duration || 0,
          width,
          height,
          videoCodec,
          audioCodec,
          needsFaststart,
          isHighBitrate,
          recommendedAction,
        };

        setAnalysis(result);
        // Resolution-aware target bitrate (Mbps)
        const targetMbps = getTargetBitrate(height, bitrateMbps);
        setTargetBitrateMbps(targetMbps);
        // Estimate output size
        setEstimatedSize(((targetMbps * 1e6 * (duration || 0)) / 8) * 1.05);

        setState('ready');
        input.dispose();
      } catch (e) {
        console.error('[VideoOptimizer] Analysis failed:', e); // eslint-disable-line no-console
        if (!canceled) {
          setState('error');
          setAnalysis(null);
        }
      }
    }

    analyze();
    return () => {
      canceled = true;
    };
  }, [file, fileBitrate]);

  async function handleOptimize() {
    if (!analysis) return;
    setState('optimizing');
    setProgress(0);

    try {
      const mb = await loadMediaBunny();
      const input = new mb.Input({
        formats: mb.ALL_FORMATS,
        source: new mb.BlobSource(file),
      });

      const target = new mb.BufferTarget();
      const output = new mb.Output({
        format: new mb.Mp4OutputFormat(),
        target,
      });

      const conversion = await mb.Conversion.init({
        input,
        output,
        video: {
          codec: 'avc',
          bitrate: targetBitrateMbps * 1e6,
          keyFrameInterval: 2,
        },
        audio: {
          codec: 'aac',
          bitrate: 128_000,
        },
      });

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

      const optimizedBlob = new Blob([target.buffer], { type: 'video/mp4' });
      const optimizedFile = new File([optimizedBlob], file.name.replace(/\.[^.]+$/, '_optimized.mp4'), {
        type: 'video/mp4',
      });

      setState('done');
      setProgress(1);

      // Cache in IndexedDB so the file survives page refresh during upload
      const cacheKey = `optimized-${file.name}-${file.size}`;
      cacheOptimizedFile(cacheKey, optimizedFile).catch(() => {});

      dispatch(
        doToast({
          message: __('Video optimized! Size: %size%', {
            size: formatSize(optimizedFile.size),
          }),
        })
      );
      onOptimized(optimizedFile);
    } catch (e: unknown) {
      cancelRef.current = null;
      if (e instanceof Error && e.message?.includes('cancel')) {
        setState('ready');
        setProgress(0);
        return;
      }
      console.error('[VideoOptimizer] Optimization failed:', e); // eslint-disable-line no-console
      setState('error');
      dispatch(
        doToast({
          isError: true,
          message: __('Video optimization failed. You can still publish the original.'),
        })
      );
    }
  }

  function handleCancel() {
    cancelRef.current?.();
    cancelRef.current = null;
    setState('ready');
    setProgress(0);
  }

  // Don't show anything if not a high bitrate video
  if (state === 'idle' || state === 'analyzing') {
    return (
      <div className="video-optimizer video-optimizer--analyzing">
        <div className="video-optimizer__spinner" />
        <span className="video-optimizer__analyzing-text">{__('Analyzing video...')}</span>
      </div>
    );
  }

  if (state === 'error' || !analysis || analysis.recommendedAction === 'none') {
    return null;
  }

  const progressPercent = Math.round(progress * 100);

  return (
    <div className="video-optimizer">
      <div className="video-optimizer__card">
        {/* Header */}
        <div className="video-optimizer__header">
          <div className="video-optimizer__icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <div className="video-optimizer__header-text">
            <h3 className="video-optimizer__title">{__('Optimize Video')}</h3>
            <p className="video-optimizer__subtitle">
              {__('Your video bitrate is %bitrate%. Optimizing improves playback reliability.', {
                bitrate: formatBitrate(analysis.bitrateMbps * 1e6),
              })}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="video-optimizer__stats">
          <div className="video-optimizer__stat">
            <span className="video-optimizer__stat-label">{__('Current')}</span>
            <span className="video-optimizer__stat-value video-optimizer__stat-value--warn">
              {formatBitrate(analysis.bitrateMbps * 1e6)}
            </span>
          </div>
          <div className="video-optimizer__stat-arrow">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </div>
          <div className="video-optimizer__stat">
            <span className="video-optimizer__stat-label">{__('Target')}</span>
            <span className="video-optimizer__stat-value video-optimizer__stat-value--good">
              {formatBitrate(targetBitrateMbps * 1e6)}
            </span>
          </div>
          <div className="video-optimizer__stat">
            <span className="video-optimizer__stat-label">{__('Resolution')}</span>
            <span className="video-optimizer__stat-value">{analysis.height}p</span>
          </div>
          <div className="video-optimizer__stat">
            <span className="video-optimizer__stat-label">{__('Duration')}</span>
            <span className="video-optimizer__stat-value">{formatDuration(analysis.duration)}</span>
          </div>
          {estimatedSize && (
            <div className="video-optimizer__stat">
              <span className="video-optimizer__stat-label">{__('Est. Size')}</span>
              <span className="video-optimizer__stat-value">{formatSize(estimatedSize)}</span>
            </div>
          )}
        </div>

        {/* Progress bar (during optimization) */}
        {state === 'optimizing' && (
          <div className="video-optimizer__progress-section">
            <div className="video-optimizer__progress-bar">
              <div className="video-optimizer__progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="video-optimizer__progress-info">
              <span className="video-optimizer__progress-percent">{progressPercent}%</span>
              <span className="video-optimizer__progress-label">{__('Optimizing...')}</span>
            </div>
          </div>
        )}

        {/* Done state */}
        {state === 'done' && (
          <div className="video-optimizer__done">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{__('Video optimized and ready to publish!')}</span>
          </div>
        )}

        {/* Actions */}
        {state === 'ready' && (
          <div className="video-optimizer__actions">
            <button className="video-optimizer__btn video-optimizer__btn--primary" onClick={handleOptimize}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              {__('Optimize Video')}
            </button>
            <button className="video-optimizer__btn video-optimizer__btn--secondary" onClick={onSkip}>
              {__('Skip & Publish Original')}
            </button>
          </div>
        )}

        {state === 'optimizing' && (
          <div className="video-optimizer__actions">
            <button className="video-optimizer__btn video-optimizer__btn--secondary" onClick={handleCancel}>
              {__('Cancel')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
