import React from 'react';
import { WEB_PUBLISH_SIZE_LIMIT_GB } from 'config';
import { useAppDispatch } from 'redux/hooks';
import { doToast } from 'redux/actions/notifications';
import { doUpdatePublishForm } from 'redux/actions/publish';
import { cacheOptimizedFile, cacheHlsPackage, CachedHlsPackage, CachedHlsTier } from 'util/uploadCache';
import './style.scss';

// Lazy-import mediabunny to keep it out of the main bundle
async function loadMediaBunny() {
  const mb = await import('odysee-media-usagi');
  return mb;
}

export type LadderTier = {
  name: string;
  height: number;
  width: number;
  bitrate: number; // bps, naturally.
};

type Props = {
  file: File;
  fileBitrate: number; // bps
  fileSizeTooBig?: boolean;
  variant: 'error' | 'mandatory' | 'recommended';
  onOptimized: (optimizedFile: File, hlsPackage?: CachedHlsPackage) => void;
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

const roundEven = (num: number) => Math.round(num / 2) * 2;

function buildLadderTiers(sourceWidth: number, sourceHeight: number): LadderTier[] {
  const aspect = sourceHeight > 0 ? sourceWidth / sourceHeight : 16 / 9;

  const standardTiers = [
    { name: '1080p', height: 1080, bitrate: 8_000_000 },
    { name: '720p', height: 720, bitrate: 5_000_000 },
    { name: '480p', height: 480, bitrate: 2_500_000 },
    { name: '360p', height: 360, bitrate: 1_000_000 },
  ];

  // Include 1080p if source is >= 1080p. If not—filter to tiers <= sourceHeight.
  const eligible = standardTiers.filter((t) => t.height <= sourceHeight || (t.height === 1080 && sourceHeight >= 1000));
  const resultTiers = eligible.length > 0 ? eligible : [standardTiers[standardTiers.length - 1]];

  return resultTiers.map((t) => ({
    name: t.name,
    height: t.height,
    width: roundEven(t.height * aspect),
    bitrate: t.bitrate,
  }));
}

export default function VideoOptimizer({ file, fileBitrate, fileSizeTooBig, variant, onOptimized, onSkip }: Props) {
  const dispatch = useAppDispatch();
  const [state, setState] = React.useState<OptimizeState>('idle');
  const [analysis, setAnalysis] = React.useState<AnalysisResult | null>(null);
  const [ladderTiers, setLadderTiers] = React.useState<LadderTier[]>([]);
  const [progress, setProgress] = React.useState(0);
  const [currentTierInfo, setCurrentTierInfo] = React.useState<{ name: string; index: number; total: number } | null>(
    null
  );
  const [estimatedSize, setEstimatedSize] = React.useState<number | null>(null);
  const [selectedOption, setSelectedOption] = React.useState<'ladder' | 'single' | 'original'>('ladder');
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

        const width = videoTrack?.displayWidth || 1920;
        const height = videoTrack?.displayHeight || 1080;
        const bitrateMbps = fileBitrate > 0 ? fileBitrate / 1e6 : 5;
        // Prev was 5; 5 isn't high—respectfully.
        const isHighBitrate = bitrateMbps > 8;
        let recommendedAction: 'transcode' | 'none' = 'none';
        if (isHighBitrate || fileSizeTooBig || height >= 720) {
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

        const tiers = buildLadderTiers(width, height);
        setLadderTiers(tiers);

        const maxBytes = WEB_PUBLISH_SIZE_LIMIT_GB * 1e9 * 0.95;
        const maxBitrateMbps = duration && duration > 0 ? (maxBytes * 8) / (duration * 1e6) : Infinity;
        const resolutionCap = getTargetBitrate(height);
        const targetMbps = Math.min(bitrateMbps, resolutionCap, maxBitrateMbps);

        setTargetBitrateMbps(targetMbps);
        setEstimatedSize(((targetMbps * 1e6 * (duration || 0)) / 8) * 1.05);

        setState('ready');
      } catch (e) {
        console.warn('[VideoOptimizer] Analysis failed, fallbacking:', e); // eslint-disable-line no-console
        if (!canceled) {
          const fallbackResult: AnalysisResult = {
            bitrateMbps: fileBitrate > 0 ? fileBitrate / 1e6 : 5,
            duration: 0,
            width: 1920,
            height: 1080,
            recommendedAction: 'transcode',
          };
          setAnalysis(fallbackResult);
          setLadderTiers(buildLadderTiers(1920, 1080));
          setTargetBitrateMbps(5);
          setState('ready');
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
  }, [file, fileBitrate, fileSizeTooBig]);

  async function handleOptimize() {
    if (!analysis) return;

    if (selectedOption === 'original') {
      onSkip();
      return;
    }

    setState('optimizing');
    setProgress(0);
    let canceled = false;

    if (selectedOption === 'single') {
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
        console.error('[VideoOptimizer] Single optimization failed:', e); // eslint-disable-line no-console
        setState('error');
        dispatch(
          doToast({
            isError: true,
            message: __('Video optimization failed. You can still publish the original.'),
          })
        );
      } finally {
        if (input) input.dispose();
      }
      return;
    }

    const mb = await loadMediaBunny();
    const cachedTiers: CachedHlsTier[] = [];
    const totalTiers = ladderTiers.length;

    try {
      for (let i = 0; i < ladderTiers.length; i++) {
        if (canceled) break;
        const tier = ladderTiers[i];
        setCurrentTierInfo({ name: tier.name, index: i + 1, total: totalTiers });

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
            width: tier.width,
            height: tier.height,
            bitrate: tier.bitrate,
            keyFrameInterval: 2,
          },
          audio: {
            codec: 'aac',
            bitrate: 384_000, // 128kbps just kills the audio quality completely.
          },
        });

        cancelRef.current = () => {
          canceled = true;
          conversion.cancel();
        };

        conversion.onProgress = (p: number) => {
          if (!canceled) {
            const overall = (i + p) / totalTiers;
            setProgress(overall);
          }
        };

        await conversion.execute();
        input.dispose();

        if (canceled) return;

        const tierBlob = new Blob([target.buffer], { type: 'video/mp4' });
        cachedTiers.push({
          name: tier.name,
          height: tier.height,
          width: tier.width,
          bitrate: tier.bitrate,
          blob: tierBlob,
          fileName: `v${i}.mp4`,
        });
      }

      if (canceled) return;

      let masterM3u8 = '#EXTM3U\n#EXT-X-VERSION:3\n';
      const playlists: Record<string, string> = {};

      cachedTiers.forEach((tier, idx) => {
        masterM3u8 += `#EXT-X-STREAM-INF:BANDWIDTH=${tier.bitrate},RESOLUTION=${tier.width}x${tier.height},CLOSED-CAPTIONS=NONE\nv${idx}.m3u8\n`;
        playlists[`v${idx}.m3u8`] =
          `#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:10\n#EXTINF:10.0,\nv${idx}.mp4\n#EXT-X-ENDLIST\n`;
      });

      const hlsPackage: CachedHlsPackage = {
        masterPlaylist: masterM3u8,
        playlists,
        tiers: cachedTiers,
        cachedAt: Date.now(),
      };

      const cacheKey = `hls-${file.name}-${file.size}`;
      cacheHlsPackage(cacheKey, hlsPackage).catch(() => {});

      setState('done');
      setProgress(1);

      dispatch(
        doToast({
          message: __('Generated %count% video quality renditions locally!', {
            count: cachedTiers.length,
          }),
        })
      );
      onOptimized(file, hlsPackage);
    } catch (e: unknown) {
      cancelRef.current = null;
      if (e instanceof Error && e.message?.includes('cancel')) {
        setState('ready');
        setProgress(0);
        return;
      }
      console.error('[VideoOptimizer] Ladder optimization failed:', e); // eslint-disable-line no-console
      setState('error');
      dispatch(
        doToast({
          isError: true,
          message: __('Transcoding failed. You can still publish the original video.'),
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

  if (state === 'error' || !analysis) {
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
            <h3 className="publish-status-card__title">{__('Video Transcoding & Quality')}</h3>
            <p className="publish-status-card__description">
              {__(
                'Transcode your video locally before publishing so viewers have ' +
                  'multiple quality choices. Do note that if you choose to transcode, '
              )}
            </p>
          </div>
        </div>

        {/* Options */}
        <div className="video-optimizer__options">
          <label
            className={`video-optimizer__option ${selectedOption === 'ladder' ? 'video-optimizer__option--selected' : ''}`}
          >
            <input
              type="radio"
              name="optimize_mode"
              checked={selectedOption === 'ladder'}
              onChange={() => setSelectedOption('ladder')}
            />
            <div className="video-optimizer__option-info">
              <strong>{__('Multiple Quality Transcode')}</strong>
              <p className="video-optimizer__option-desc">
                {__(
                  'Encodes your video into multiple resolutions,' +
                    " it'll use your local machine's compute to do so." +
                    ' Viewers however will have full quality controls in the player.'
                )}
              </p>
              <div className="video-optimizer__stats">
                <div className="video-optimizer__stat">
                  <span className="video-optimizer__stat-label">{__('Generated Renditions')}</span>
                  <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                    {ladderTiers.map((t) => (
                      <span key={t.name} className="publish-file-info__pill publish-file-info__pill--good">
                        {t.name}
                      </span>
                    ))}
                    <span className="publish-file-info__pill">{__('Source')}</span>
                  </div>
                </div>
              </div>
            </div>
          </label>

          <label
            className={`video-optimizer__option ${selectedOption === 'single' ? 'video-optimizer__option--selected' : ''}`}
          >
            <input
              type="radio"
              name="optimize_mode"
              checked={selectedOption === 'single'}
              onChange={() => setSelectedOption('single')}
            />
            <div className="video-optimizer__option-info">
              <strong>{__('Optimized Source Quality')}</strong>
              <p className="video-optimizer__option-desc">
                {__('Compresses and downscales the video to one with a standard bitrate for fast buffering.')}
              </p>
              <div className="video-optimizer__stats">
                <div className="video-optimizer__stat">
                  <span className="video-optimizer__stat-label">{__('Target Bitrate')}</span>
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

          {variant !== 'mandatory' && (
            <label
              className={`video-optimizer__option ${selectedOption === 'original' ? 'video-optimizer__option--selected' : ''}`}
            >
              <input
                type="radio"
                name="optimize_mode"
                checked={selectedOption === 'original'}
                onChange={() => setSelectedOption('original')}
              />
              <div className="video-optimizer__option-info">
                <strong>{__('Original Source Only')}</strong>
                <p className="video-optimizer__option-desc">{__('Publish your exact video as-is.')}</p>
              </div>
            </label>
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
              <span className="video-optimizer__progress-label">
                {currentTierInfo
                  ? __('Transcoding %name% (%index% of %total%)...', {
                      name: currentTierInfo.name,
                      index: String(currentTierInfo.index),
                      total: String(currentTierInfo.total),
                    })
                  : __('Transcoding video...')}
              </span>
            </div>
          </div>
        )}

        {/* Ready to Start button */}
        {state === 'ready' && selectedOption !== 'original' && (
          <div className="video-optimizer__actions" style={{ marginTop: 'var(--spacing-s)' }}>
            <button className="button button--primary" onClick={handleOptimize}>
              {selectedOption === 'ladder' ? __('Start Transcoding') : __('Start Optimizing')}
            </button>
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
            <span>
              {selectedOption === 'ladder'
                ? __('Renditions has been generated and is ready to publish!')
                : __('Video is optimized and is ready to publish!')}
            </span>
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
