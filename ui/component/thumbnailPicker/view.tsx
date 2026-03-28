import React, { useEffect, useState, useRef, useCallback } from 'react';
import { THUMBNAIL_CDN_SIZE_LIMIT_BYTES } from 'config';
import { Input, BlobSource, VideoSampleSink, ALL_FORMATS } from 'mediabunny';
import type { VideoSample } from 'mediabunny';
import Button from 'component/button';
import Spinner from 'component/spinner';
import { useAppDispatch } from 'redux/hooks';
import { doUploadThumbnail } from 'redux/actions/publish';
import { doToast } from 'redux/actions/notifications';
import './style.lazy.scss';

const DEFAULT_PERCENTAGES = [0.1, 0.25, 0.5, 0.75, 0.9];
const THUMBNAIL_WIDTH = 320;

type FrameData = {
  blobUrl: string;
  blob: Blob;
  timestamp: number;
  label: string;
};

type PickerMode = 'auto' | 'manual';

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

type Props = {
  filePath: File;
  onThumbnailSelected?: (thumbnailUrl: string) => void;
};

function ThumbnailPicker(props: Props) {
  const { filePath, onThumbnailSelected } = props;
  const dispatch = useAppDispatch();

  const [frames, setFrames] = useState<FrameData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<PickerMode>('auto');
  const [duration, setDuration] = useState(0);
  const [manualTimestamp, setManualTimestamp] = useState(0);
  const [manualFrame, setManualFrame] = useState<FrameData | null>(null);
  const [manualLoading, setManualLoading] = useState(false);

  const inputRef = useRef<Input | null>(null);
  const frameUrlsRef = useRef<string[]>([]);
  const manualVideoRef = useRef<HTMLVideoElement>(null);
  const manualVideoUrlRef = useRef<string | null>(null);
  const extractionIdRef = useRef(0);
  const manualFrameUrlRef = useRef<string | null>(null);

  const cleanupFrameUrls = useCallback((urls?: string[]) => {
    const urlsToRevoke = urls || frameUrlsRef.current;
    urlsToRevoke.forEach((blobUrl) => URL.revokeObjectURL(blobUrl));

    if (!urls) {
      frameUrlsRef.current = [];
    }
  }, []);

  const cleanupInput = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.dispose();
      inputRef.current = null;
    }
  }, []);

  const cleanupManualFrame = useCallback(() => {
    if (manualFrameUrlRef.current) {
      URL.revokeObjectURL(manualFrameUrlRef.current);
      manualFrameUrlRef.current = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    extractionIdRef.current += 1;
    cleanupFrameUrls();
    cleanupManualFrame();
    cleanupInput();
    if (manualVideoUrlRef.current) {
      URL.revokeObjectURL(manualVideoUrlRef.current);
      manualVideoUrlRef.current = null;
    }
  }, [cleanupFrameUrls, cleanupInput, cleanupManualFrame]);

  const extractFrames = useCallback(
    async (percentages: number[]) => {
      const extractionId = extractionIdRef.current + 1;
      extractionIdRef.current = extractionId;

      setLoading(true);
      setError(null);
      setSelectedIndex(null);
      setFrames([]);
      setDuration(0);
      cleanupManualFrame();
      setManualFrame(null);
      cleanupFrameUrls();
      cleanupInput();

      let input: Input | null = null;
      let newFrameUrls: string[] = [];

      try {
        const source = new BlobSource(filePath);
        input = new Input({ formats: ALL_FORMATS, source });
        inputRef.current = input;

        const duration = await input.computeDuration();
        if (extractionId === extractionIdRef.current) {
          setDuration(duration || 0);
        }
        const videoTrack = await input.getPrimaryVideoTrack();

        if (!videoTrack) {
          if (extractionId === extractionIdRef.current) {
            setError(__('No video track found in the file.'));
          }
          return;
        }

        const sink = new VideoSampleSink(videoTrack);
        const timestamps = percentages.map((p) => p * duration);
        const newFrames: FrameData[] = [];

        for await (const sample of sink.samplesAtTimestamps(timestamps)) {
          if (!sample) {
            continue;
          }

          if (extractionId !== extractionIdRef.current) {
            sample.close();
            return;
          }

          const blob = await videoSampleToBlob(sample);
          if (blob) {
            const blobUrl = URL.createObjectURL(blob);
            newFrames.push({
              blobUrl,
              blob,
              timestamp: sample.timestamp,
              label: formatTimestamp(sample.timestamp),
            });
            newFrameUrls.push(blobUrl);
          }
          sample.close();
        }

        if (extractionId !== extractionIdRef.current) {
          cleanupFrameUrls(newFrameUrls);
          return;
        }

        frameUrlsRef.current = newFrameUrls;
        setFrames(newFrames);

        if (newFrames.length === 0) {
          setError(__('Could not extract any frames from the video.'));
        }
      } catch (err) {
        console.error('ThumbnailPicker: frame extraction failed', err); // eslint-disable-line no-console
        cleanupFrameUrls(newFrameUrls);

        if (extractionId === extractionIdRef.current) {
          setError(__("Something didn't work. Please try again."));
        }
      } finally {
        if (inputRef.current === input) {
          cleanupInput();
        } else if (input) {
          input.dispose();
        }

        if (extractionId === extractionIdRef.current) {
          setLoading(false);
        }
      }
    },
    [cleanupFrameUrls, cleanupInput, filePath]
  );

  useEffect(() => {
    setMode('auto');
    setManualTimestamp(0);
    setManualFrame(null);
    extractFrames(DEFAULT_PERCENTAGES);

    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filePath]);

  function handleRegenerate() {
    const randomPercentages = Array.from({ length: 5 }, () => 0.05 + Math.random() * 0.9).toSorted((a, b) => a - b);
    extractFrames(randomPercentages);
  }

  function handleShowManualMode() {
    const nextTimestamp =
      selectedIndex !== null && frames[selectedIndex] ? frames[selectedIndex].timestamp : duration ? duration / 2 : 0;

    setError(null);
    cleanupManualFrame();
    setManualFrame(null);
    setManualTimestamp(nextTimestamp);
    setMode('manual');
  }

  async function handleManualPreview() {
    if (!duration) return;

    setError(null);
    setManualLoading(true);
    cleanupManualFrame();
    setManualFrame(null);

    let input: Input | null = null;

    try {
      const source = new BlobSource(filePath);
      input = new Input({ formats: ALL_FORMATS, source });

      const videoTrack = await input.getPrimaryVideoTrack();
      if (!videoTrack) {
        setError(__('No video track found in the file.'));
        return;
      }

      const sink = new VideoSampleSink(videoTrack);
      for await (const sample of sink.samplesAtTimestamps([manualTimestamp])) {
        if (!sample) {
          continue;
        }

        const blob = await videoSampleToBlob(sample);
        const timestamp = sample.timestamp;
        const blobUrl = blob ? URL.createObjectURL(blob) : null;
        sample.close();

        if (!blob || !blobUrl) {
          break;
        }

        manualFrameUrlRef.current = blobUrl;
        setManualFrame({
          blobUrl,
          blob,
          timestamp,
          label: formatTimestamp(timestamp),
        });
        return;
      }

      setError(__('Could not extract a frame at that position.'));
    } catch (err) {
      console.error('ThumbnailPicker: manual frame extraction failed', err); // eslint-disable-line no-console
      setError(__("Something didn't work. Please try again."));
    } finally {
      if (input) {
        input.dispose();
      }
      setManualLoading(false);
    }
  }

  async function handleUpload() {
    const frame = mode === 'manual' ? manualFrame : selectedIndex !== null ? frames[selectedIndex] : null;

    if (!frame) return;
    setUploading(true);

    try {
      let file = new File([frame.blob], 'thumbnail.jpeg', {
        type: 'image/jpeg',
      });

      if (file.size > THUMBNAIL_CDN_SIZE_LIMIT_BYTES) {
        // Re-encode at lower quality
        const lowerBlob = await reEncodeBlob(frame.blobUrl, 0.7);
        if (lowerBlob) {
          file = new File([lowerBlob], 'thumbnail.jpeg', {
            type: 'image/jpeg',
          });
        }
      }

      await Promise.resolve(
        dispatch(doUploadThumbnail(undefined, file, undefined, undefined, undefined, onThumbnailSelected))
      );
    } catch (err) {
      dispatch(
        doToast({
          isError: true,
          message: __("Something didn't work. Please try again."),
        })
      );
    }

    setUploading(false);
  }

  return (
    <div className="thumbnail-picker">
      {mode === 'auto' && (
        <>
          <div className="thumbnail-picker__mode-header">
            <div>
              <h3 className="thumbnail-picker__title">{__('Auto-generated thumbnails')}</h3>
              <p className="thumbnail-picker__subtitle">{__('Select one, or switch to manual frame selection.')}</p>
            </div>
            {duration > 0 && (
              <Button
                button="link"
                label={__('Manual selection')}
                onClick={handleShowManualMode}
                disabled={loading || uploading}
              />
            )}
          </div>

          {loading && (
            <div className="thumbnail-picker__loading">
              <div className="thumbnail-picker__grid thumbnail-picker__grid--skeleton">
                {DEFAULT_PERCENTAGES.map((_, i) => (
                  <div key={i} className="thumbnail-picker__item thumbnail-picker__item--skeleton">
                    <div className="thumbnail-picker__skeleton-box" />
                  </div>
                ))}
              </div>
              <div className="thumbnail-picker__spinner">
                <Spinner type="small" text={<span>{__('Extracting frames')}...</span>} />
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="thumbnail-picker__error">
              <p>{error}</p>
              <Button button="secondary" label={__('Try again')} onClick={handleRegenerate} />
            </div>
          )}

          {!loading && !error && frames.length > 0 && (
            <>
              <div className="thumbnail-picker__grid">
                {frames.map((frame, index) => (
                  <button
                    key={frame.blobUrl}
                    className={
                      'thumbnail-picker__item' + (selectedIndex === index ? ' thumbnail-picker__item--selected' : '')
                    }
                    onClick={() => setSelectedIndex(index)}
                    type="button"
                  >
                    <img
                      src={frame.blobUrl}
                      alt={__('Thumbnail at %timestamp%', { timestamp: frame.label })}
                      className="thumbnail-picker__image"
                    />
                    <span className="thumbnail-picker__label">{frame.label}</span>
                  </button>
                ))}
              </div>

              <div className="thumbnail-picker__actions">
                <Button
                  button="primary"
                  label={uploading ? __('Uploading...') : __('Use selected thumbnail')}
                  disabled={selectedIndex === null || uploading}
                  onClick={handleUpload}
                />
                <Button button="link" label={__('Regenerate')} onClick={handleRegenerate} disabled={uploading} />
              </div>
            </>
          )}
        </>
      )}

      {mode === 'manual' && duration > 0 && (
        <div className="thumbnail-picker__manual">
          <div className="thumbnail-picker__mode-header">
            <div>
              <h3 className="thumbnail-picker__title">{__('Manual frame selection')}</h3>
              <p className="thumbnail-picker__subtitle">{__('Scrub through the video to find the perfect frame.')}</p>
            </div>
            <Button
              button="link"
              label={__('Back to auto')}
              onClick={() => {
                setError(null);
                setMode('auto');
              }}
              disabled={manualLoading || uploading}
            />
          </div>

          {/* Video scrubber */}
          <div className="thumbnail-picker__manual-video">
            <video
              ref={(el) => {
                manualVideoRef.current = el;
                if (el && !manualVideoUrlRef.current) {
                  manualVideoUrlRef.current = URL.createObjectURL(filePath);
                  el.src = manualVideoUrlRef.current;
                  el.currentTime = manualTimestamp;
                }
              }}
              className="thumbnail-picker__video"
              muted
              playsInline
            />
          </div>

          <div className="thumbnail-picker__manual-controls">
            <div className="thumbnail-picker__manual-range-row">
              <input
                id="thumbnail-picker-manual-range"
                className="thumbnail-picker__manual-range"
                type="range"
                min={0}
                max={duration}
                step={Math.max(duration / 200, 0.25)}
                value={manualTimestamp}
                onChange={(event) => {
                  const ts = Number(event.target.value);
                  setManualTimestamp(ts);
                  if (manualVideoRef.current) manualVideoRef.current.currentTime = ts;
                }}
              />
              <span className="thumbnail-picker__manual-timestamp">{formatTimestamp(manualTimestamp)}</span>
            </div>
          </div>

          {error && (
            <div className="thumbnail-picker__error">
              <p>{error}</p>
            </div>
          )}

          <div className="thumbnail-picker__actions">
            <Button
              button="secondary"
              label={manualLoading ? __('Capturing...') : __('Capture this frame')}
              onClick={handleManualPreview}
              disabled={manualLoading || uploading}
            />
          </div>

          {manualFrame && (
            <div className="thumbnail-picker__manual-preview">
              <div className="thumbnail-picker__item thumbnail-picker__item--selected">
                <img
                  src={manualFrame.blobUrl}
                  alt={__('Thumbnail at %timestamp%', { timestamp: manualFrame.label })}
                  className="thumbnail-picker__image"
                />
                <span className="thumbnail-picker__label">{manualFrame.label}</span>
              </div>
              <div className="thumbnail-picker__actions">
                <Button
                  button="primary"
                  label={uploading ? __('Uploading...') : __('Use this frame')}
                  disabled={manualLoading || uploading}
                  onClick={handleUpload}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

async function videoSampleToBlob(sample: VideoSample): Promise<Blob | null> {
  try {
    const width = sample.displayWidth;
    const height = sample.displayHeight;

    if (!width || !height) {
      return null;
    }

    const scale = Math.min(1, THUMBNAIL_WIDTH / width);
    const canvasWidth = Math.round(width * scale);
    const canvasHeight = Math.round(height * scale);

    const canvas = new OffscreenCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    sample.draw(ctx, 0, 0, canvasWidth, canvasHeight);

    const blob = await canvas.convertToBlob({
      type: 'image/jpeg',
      quality: 0.9,
    });
    return blob;
  } catch {
    return null;
  }
}

async function reEncodeBlob(blobUrl: string, quality: number): Promise<Blob | null> {
  try {
    const response = await fetch(blobUrl);
    const originalBlob = await response.blob();
    const bitmap = await createImageBitmap(originalBlob);

    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    return await canvas.convertToBlob({ type: 'image/jpeg', quality });
  } catch {
    return null;
  }
}

export default ThumbnailPicker;
