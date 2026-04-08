import React, { useEffect, useState, useRef, useCallback } from 'react';
import { THUMBNAIL_CDN_SIZE_LIMIT_BYTES } from 'config';
import { Input, BlobSource, VideoSampleSink, ALL_FORMATS } from 'odysee-media-usagi';
import type { VideoSample } from 'odysee-media-usagi';
import Button from 'component/button';
import Spinner from 'component/spinner';
import Icon from 'component/common/icon';
import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { doUploadThumbnail } from 'redux/actions/publish';
import { doOpenModal } from 'redux/actions/app';
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
  filePath?: File;
  hasVideo?: boolean;
  onThumbnailSelected?: (thumbnailUrl: string) => void;
};

function ThumbnailPicker(props: Props) {
  const { filePath, hasVideo = false, onThumbnailSelected } = props;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedThumbUrl, setUploadedThumbUrl] = useState<string | null>(null);
  const [urlThumbUrl, setUrlThumbUrl] = useState<string | null>(null);
  const currentThumbnail = useAppSelector((state) => state.publish.thumbnail);
  const editingURI = useAppSelector((state) => state.publish.editingURI);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState('');
  const dispatch = useAppDispatch();

  const [frames, setFrames] = useState<FrameData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractionFailed, setExtractionFailed] = useState(false);
  const [mode, setMode] = useState<PickerMode>('auto');
  const [duration, setDuration] = useState(0);
  const [manualTimestamp, setManualTimestamp] = useState(0);
  const [manualFrame, setManualFrame] = useState<FrameData | null>(null);
  const [manualLoading, setManualLoading] = useState(false);
  const [extractorExpanded, setExtractorExpanded] = useState(false);
  const expandedVideoRef = useRef<HTMLVideoElement>(null);

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
      setExtractionFailed(false);
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

        if (newFrames.length > 0) {
          setSelectedIndex(0);
          uploadFrame(newFrames[0]);
        } else {
          setError(__('Could not extract any frames from the video.'));
        }
      } catch (err) {
        console.warn('[ThumbnailPicker] Frame extraction not supported for this format'); // eslint-disable-line no-console
        cleanupFrameUrls(newFrameUrls);
        if (extractionId === extractionIdRef.current) {
          setExtractionFailed(true);
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
    if (editingURI && currentThumbnail) {
      setSelectedIndex(-4);
      setLoading(false);
    } else if (hasVideo && filePath) {
      extractFrames(DEFAULT_PERCENTAGES);
    } else {
      setLoading(false);
    }

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

  async function uploadFrame(frame: FrameData) {
    if (uploading) return;
    setUploading(true);
    try {
      let file = new File([frame.blob], 'thumbnail.jpeg', { type: 'image/jpeg' });
      if (file.size > THUMBNAIL_CDN_SIZE_LIMIT_BYTES) {
        const lowerBlob = await reEncodeBlob(frame.blobUrl, 0.7);
        if (lowerBlob) {
          file = new File([lowerBlob], 'thumbnail.jpeg', { type: 'image/jpeg' });
        }
      }
      await Promise.resolve(
        dispatch(doUploadThumbnail(undefined, file, undefined, undefined, undefined, onThumbnailSelected))
      );
    } catch (err) {
      dispatch(doToast({ isError: true, message: __("Something didn't work. Please try again.") }));
    }
    setUploading(false);
  }

  async function captureCustomFrame(): Promise<FrameData | null> {
    const video = manualVideoRef.current;
    if (!video || !video.videoWidth) return null;
    const scale = Math.min(1, THUMBNAIL_WIDTH / video.videoWidth);
    const w = Math.round(video.videoWidth * scale);
    const h = Math.round(video.videoHeight * scale);
    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, w, h);
    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.9 });
    const blobUrl = URL.createObjectURL(blob);
    return { blobUrl, blob, timestamp: video.currentTime, label: formatTimestamp(video.currentTime) };
  }

  async function handleUpload() {
    let frame: FrameData | null = null;
    if (selectedIndex === -1) {
      frame = await captureCustomFrame();
    } else if (selectedIndex !== null && frames[selectedIndex]) {
      frame = frames[selectedIndex];
    }

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
          {loading && (
            <div className="thumbnail-picker__loading">
              <div className="thumbnail-picker__grid thumbnail-picker__grid--skeleton">
                {Array.from({ length: 8 }, (_, i) => (
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

          {!loading && !error && (
            <>
              <div className="thumbnail-picker__grid">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.gif,.webp"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      dispatch(
                        doOpenModal(MODALS.CONFIRM_THUMBNAIL_UPLOAD, {
                          file,
                          cb: (url: string) => {
                            setUploadedThumbUrl(url);
                            setSelectedIndex(-2);
                            onThumbnailSelected?.(url);
                          },
                        })
                      );
                    }
                    e.target.value = '';
                  }}
                />
                <button
                  className={
                    'thumbnail-picker__item' +
                    (uploadedThumbUrl ? '' : ' thumbnail-picker__item--action') +
                    (selectedIndex === -2 ? ' thumbnail-picker__item--selected' : '')
                  }
                  onClick={() => {
                    if (uploadedThumbUrl) {
                      setSelectedIndex(-2);
                    } else {
                      fileInputRef.current?.click();
                    }
                  }}
                  type="button"
                >
                  {uploadedThumbUrl ? (
                    <img src={uploadedThumbUrl} className="thumbnail-picker__image" alt={__('Uploaded thumbnail')} />
                  ) : (
                    <div className="thumbnail-picker__action-content">
                      <Icon icon={ICONS.PUBLISH} size={24} />
                      <span>{__('Upload')}</span>
                    </div>
                  )}
                </button>
                <button
                  className={
                    'thumbnail-picker__item' +
                    (urlThumbUrl ? '' : ' thumbnail-picker__item--action') +
                    (selectedIndex === -3 ? ' thumbnail-picker__item--selected' : '')
                  }
                  onClick={() => {
                    if (urlThumbUrl) {
                      setSelectedIndex(-3);
                    } else {
                      dispatch(
                        doOpenModal(MODALS.CONFIRM_THUMBNAIL_URL, {
                          cb: (url: string) => {
                            setUrlThumbUrl(url);
                            setSelectedIndex(-3);
                          },
                        })
                      );
                    }
                  }}
                  type="button"
                >
                  {urlThumbUrl ? (
                    <img src={urlThumbUrl} className="thumbnail-picker__image" alt={__('URL thumbnail')} />
                  ) : (
                    <div className="thumbnail-picker__action-content">
                      <Icon icon={ICONS.COPY_LINK} size={24} />
                      <span>{__('URL')}</span>
                    </div>
                  )}
                </button>
                {editingURI && currentThumbnail && (
                  <button
                    className={
                      'thumbnail-picker__item' + (selectedIndex === -4 ? ' thumbnail-picker__item--selected' : '')
                    }
                    onClick={() => {
                      setSelectedIndex(-4);
                      onThumbnailSelected?.(currentThumbnail);
                    }}
                    type="button"
                  >
                    <img src={currentThumbnail} className="thumbnail-picker__image" alt={__('Current thumbnail')} />
                    <span className="thumbnail-picker__label">{__('Current')}</span>
                  </button>
                )}
                {hasVideo && filePath && !extractionFailed && (
                  <button
                    className={
                      'thumbnail-picker__item thumbnail-picker__item--custom' +
                      (selectedIndex === -1 ? ' thumbnail-picker__item--selected' : '')
                    }
                    type="button"
                    onClick={async () => {
                      setSelectedIndex(-1);
                      const frame = await captureCustomFrame();
                      if (frame) uploadFrame(frame);
                    }}
                  >
                    <video
                      ref={(el) => {
                        manualVideoRef.current = el;
                        if (el && !manualVideoUrlRef.current) {
                          manualVideoUrlRef.current = URL.createObjectURL(filePath);
                          el.src = manualVideoUrlRef.current;
                          el.currentTime = 0;
                        }
                      }}
                      className="thumbnail-picker__custom-video"
                      muted
                      playsInline
                      disablePictureInPicture
                    />
                    <div className="thumbnail-picker__custom-overlay">
                      <Icon icon={ICONS.CAMERA} size={24} />
                      <span>{__('Custom')}</span>
                    </div>
                    <input
                      className="thumbnail-picker__custom-slider"
                      type="range"
                      min={0}
                      max={duration || 1}
                      step={Math.max((duration || 1) / 200, 0.25)}
                      value={manualTimestamp}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const ts = Number(e.target.value);
                        setManualTimestamp(ts);
                        setSelectedIndex(-1);
                        if (manualVideoRef.current) manualVideoRef.current.currentTime = ts;
                      }}
                      onMouseUp={async () => {
                        const frame = await captureCustomFrame();
                        if (frame) uploadFrame(frame);
                      }}
                      onTouchEnd={async () => {
                        const frame = await captureCustomFrame();
                        if (frame) uploadFrame(frame);
                      }}
                    />
                    <button
                      className="thumbnail-picker__expand-btn"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExtractorExpanded(true);
                      }}
                    >
                      <svg
                        width={14}
                        height={14}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="15 3 21 3 21 9" />
                        <polyline points="9 21 3 21 3 15" />
                        <line x1="21" y1="3" x2="14" y2="10" />
                        <line x1="3" y1="21" x2="10" y2="14" />
                      </svg>
                    </button>
                  </button>
                )}
                {frames.map((frame, index) => (
                  <button
                    key={frame.blobUrl}
                    className={
                      'thumbnail-picker__item' + (selectedIndex === index ? ' thumbnail-picker__item--selected' : '')
                    }
                    onClick={() => {
                      setSelectedIndex(index);
                      uploadFrame(frames[index]);
                    }}
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

      {extractorExpanded && filePath && (
        <div className="thumbnail-picker__lightbox" onClick={() => setExtractorExpanded(false)}>
          <div className="thumbnail-picker__lightbox-content" onClick={(e) => e.stopPropagation()}>
            <video
              ref={(el) => {
                expandedVideoRef.current = el;
                if (el && manualVideoUrlRef.current) {
                  el.src = manualVideoUrlRef.current;
                  el.currentTime = manualTimestamp;
                }
              }}
              className="thumbnail-picker__lightbox-video"
              muted
              playsInline
              disablePictureInPicture
            />
            <input
              className="thumbnail-picker__lightbox-slider"
              type="range"
              min={0}
              max={duration || 1}
              step={Math.max((duration || 1) / 500, 0.1)}
              value={manualTimestamp}
              onChange={(e) => {
                const ts = Number(e.target.value);
                setManualTimestamp(ts);
                if (expandedVideoRef.current) expandedVideoRef.current.currentTime = ts;
                if (manualVideoRef.current) manualVideoRef.current.currentTime = ts;
              }}
            />
            <div className="thumbnail-picker__lightbox-info">
              <span className="thumbnail-picker__lightbox-timestamp">{formatTimestamp(manualTimestamp)}</span>
            </div>
            <div className="thumbnail-picker__lightbox-actions">
              <Button
                button="primary"
                label={uploading ? __('Uploading...') : __('Use this frame')}
                disabled={uploading}
                onClick={async () => {
                  setSelectedIndex(-1);
                  const frame = await captureCustomFrame();
                  if (frame) uploadFrame(frame);
                  setExtractorExpanded(false);
                }}
              />
              <Button button="secondary" label={__('Close')} onClick={() => setExtractorExpanded(false)} />
            </div>
            <button
              className="thumbnail-picker__lightbox-close"
              type="button"
              onClick={() => setExtractorExpanded(false)}
            >
              <Icon icon={ICONS.REMOVE} size={20} />
            </button>
          </div>
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
