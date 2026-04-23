import React from 'react';
import { WEB_PUBLISH_SIZE_LIMIT_GB } from 'config';
import { useAppDispatch } from 'redux/hooks';
import { doToast } from 'redux/actions/notifications';
import { doUpdatePublishForm } from 'redux/actions/publish';
import { cacheOptimizedFile } from 'util/uploadCache';
import './style.scss';

// Lazy-import mediabunny to keep it out of the main bundle
async function loadMediaBunny() {
  const mb = await import('odysee-media-usagi');
  return mb;
}

type Props = {
  file: File;
  fileBitrate: number; // bps
  fileSizeTooBig?: boolean;
  variant: 'error' | 'mandatory' | 'recommended';
  onOptimized: (optimizedFile: File) => void;
  onSkip: () => void;
};

type AnalysisResult = {
  bitrateMbps: number;
  duration: number;
  width: number;
  height: number;
  recommendedAction: 'transcode' | 'none';
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
function getTargetBitrate(height: number): number {
  if (height >= 2160) return 18;
  if (height >= 1440) return 12;
  if (height >= 1080) return 8;
  if (height >= 720) return 5;
  if (height >= 480) return 2.5;
  return 1;
}

export default function VideoOptimizer({ file, fileBitrate, fileSizeTooBig, variant, onOptimized, onSkip }: Props) {
  const dispatch = useAppDispatch();
  const [optimizeEnabled, setOptimizeEnabled] = React.useState(true);
  const [state, setState] = React.useState<OptimizeState>('idle');
  const [analysis, setAnalysis] = React.useState<AnalysisResult | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [estimatedSize, setEstimatedSize] = React.useState<number | null>(null);
  const [altTargetBitrateMbps, setAltTargetBitrateMbps] = React.useState(5);
  const [altHeight, setAltHeight] = React.useState(720);
  const [altEstimatedSize, setAltEstimatedSize] = React.useState<number | null>(null);
  const [selectedOption, setSelectedOption] = React.useState<'bitrate' | 'resolution'>('bitrate');
  const cancelRef = React.useRef<(() => void) | null>(null);
  const [targetBitrateMbps, setTargetBitrateMbps] = React.useState(5);

  // Auto-analyze on mount
  React.useEffect(() => {
    let canceled = false;

    async function analyze() {
      setState('analyzing');
      let input;

      try {
        const mb = await loadMediaBunny();
        input = new mb.Input({
          formats: mb.ALL_FORMATS,
          source: new mb.BlobSource(file),
        });

        const videoTrack = await input.getPrimaryVideoTrack();
        const duration = await input.computeDuration();

        const width = videoTrack?.displayWidth || 0;
        const height = videoTrack?.displayHeight || 0;
        const bitrateMbps = fileBitrate / 1e6;
        const isHighBitrate = bitrateMbps > 5;
        let recommendedAction: 'transcode' | 'none' = 'none';
        if (isHighBitrate) {
          recommendedAction = 'transcode';
        }

        if (canceled) return;

        const result: AnalysisResult = {
          bitrateMbps,
          duration: duration || 0,
          width,
          height,
          recommendedAction,
        };

        setAnalysis(result);

        const maxBytes = WEB_PUBLISH_SIZE_LIMIT_GB * 1e9 * 0.95;
        const maxBitrateMbps = duration && duration > 0 ? (maxBytes * 8) / (duration * 1e6) : Infinity;
        const resolutionCap = getTargetBitrate(height);
        const targetMbps = Math.min(bitrateMbps, resolutionCap, maxBitrateMbps);

        setTargetBitrateMbps(targetMbps);
        setEstimatedSize(((targetMbps * 1e6 * (duration || 0)) / 8) * 1.05);

        const lowerHeight =
          height >= 2160 ? 1440 : height >= 1440 ? 1080 : height >= 1080 ? 720 : height >= 720 ? 480 : 360;
        const altResolutionCap = getTargetBitrate(lowerHeight);
        const altBitrate = Math.min(bitrateMbps, altResolutionCap, maxBitrateMbps);

        setAltHeight(lowerHeight);
        setAltTargetBitrateMbps(altBitrate);
        setAltEstimatedSize(((altBitrate * 1e6 * (duration || 0)) / 8) * 1.05);

        setState('ready');
      } catch (e) {
        console.error('[VideoOptimizer] Analysis failed:', e); // eslint-disable-line no-console
        if (!canceled) {
          setState('error');
          setAnalysis(null);
        }
      } finally {
        if (input) {
          input.dispose();
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
    let input;

    try {
      const mb = await loadMediaBunny();
      input = new mb.Input({
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
    } finally {
      if (input) {
        input.dispose();
      }
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
      <div className={`publish-status-card publish-status-card--${variant}`}>
        <div className="publish-status-card__header">
          <div className="publish-status-card__icon">
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
          <div className="publish-status-card__text">
            <h3 className="publish-status-card__title">
              {__('Optimize Video')}
              <span className={`video-optimizer__label video-optimizer__label--${variant}`}>
                {variant === 'mandatory' ? __('Mandatory') : variant === 'error' ? __('Required') : __('Recommended')}
              </span>
            </h3>
            <p className="publish-status-card__description">
              {fileSizeTooBig
                ? __(
                    'Your file size exceeds the upload limit. Choose between reducing the bitrate or lowering the resolution to fit.'
                  )
                : __(
                    'Your video bitrate is %bitrate%. Choose between reducing the bitrate or lowering the resolution.',
                    {
                      bitrate: formatBitrate(analysis.bitrateMbps * 1e6),
                    }
                  )}
            </p>
          </div>
          {state === 'ready' && (
            <label
              className="publish-status-card__action"
              style={variant === 'mandatory' ? { pointerEvents: 'none', opacity: 0.7 } : undefined}
            >
              <input
                type="checkbox"
                checked={optimizeEnabled}
                readOnly={variant === 'mandatory'}
                onChange={(e) => {
                  if (variant !== 'mandatory') {
                    setOptimizeEnabled(e.target.checked);
                    dispatch(doUpdatePublishForm({ skipOptimize: !e.target.checked }));
                  }
                }}
              />
              <span>{__('Optimize')}</span>
            </label>
          )}
        </div>

        {/* Options */}
        <div className="video-optimizer__options">
          <label
            className={`video-optimizer__option ${selectedOption === 'bitrate' ? 'video-optimizer__option--selected' : ''}`}
          >
            <input
              type="radio"
              name="optimize_mode"
              checked={selectedOption === 'bitrate'}
              onChange={() => setSelectedOption('bitrate')}
            />
            <div className="video-optimizer__option-info">
              <strong>{__('Reduce Bitrate')}</strong>
              <div className="video-optimizer__stats">
                <div className="video-optimizer__stat">
                  <span className="video-optimizer__stat-label">{__('Bitrate')}</span>
                  <span className="video-optimizer__stat-value video-optimizer__stat-value--warn">
                    {formatBitrate(analysis.bitrateMbps * 1e6)}
                  </span>
                </div>
                <div className="video-optimizer__stat-arrow">→</div>
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
                {estimatedSize && (
                  <div className="video-optimizer__stat">
                    <span className="video-optimizer__stat-label">{__('Est. Size')}</span>
                    <span className="video-optimizer__stat-value">{formatSize(estimatedSize)}</span>
                  </div>
                )}
              </div>
            </div>
          </label>
          <label
            className={`video-optimizer__option ${selectedOption === 'resolution' ? 'video-optimizer__option--selected' : ''}`}
          >
            <input
              type="radio"
              name="optimize_mode"
              checked={selectedOption === 'resolution'}
              onChange={() => setSelectedOption('resolution')}
            />
            <div className="video-optimizer__option-info">
              <strong>{__('Lower Resolution')}</strong>
              <div className="video-optimizer__stats">
                <div className="video-optimizer__stat">
                  <span className="video-optimizer__stat-label">{__('Bitrate')}</span>
                  <span className="video-optimizer__stat-value video-optimizer__stat-value--warn">
                    {formatBitrate(analysis.bitrateMbps * 1e6)}
                  </span>
                </div>
                <div className="video-optimizer__stat-arrow">→</div>
                <div className="video-optimizer__stat">
                  <span className="video-optimizer__stat-label">{__('Target')}</span>
                  <span className="video-optimizer__stat-value video-optimizer__stat-value--good">
                    {formatBitrate(altTargetBitrateMbps * 1e6)}
                  </span>
                </div>
                <div className="video-optimizer__stat">
                  <span className="video-optimizer__stat-label">{__('Resolution')}</span>
                  <span className="video-optimizer__stat-value">{altHeight}p</span>
                </div>
                {altEstimatedSize && (
                  <div className="video-optimizer__stat">
                    <span className="video-optimizer__stat-label">{__('Est. Size')}</span>
                    <span className="video-optimizer__stat-value">{formatSize(altEstimatedSize)}</span>
                  </div>
                )}
              </div>
            </div>
          </label>
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

        {state === 'optimizing' && (
          <div className="video-optimizer__actions">
            <button className="video-optimizer__btn video-optimizer__btn--cancel" onClick={handleCancel}>
              {__('Cancel')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
