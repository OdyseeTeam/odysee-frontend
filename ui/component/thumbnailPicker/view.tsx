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

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

type Props = {
  filePath: File;
  onThumbnailSelected?: (thumbnailUrl: string) => void;
  inline?: boolean;
};

function ThumbnailPicker(props: Props) {
  const { filePath, onThumbnailSelected, inline } = props;
  const dispatch = useAppDispatch();

  const [frames, setFrames] = useState<FrameData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<Input | null>(null);

  const cleanup = useCallback(() => {
    frames.forEach((f) => URL.revokeObjectURL(f.blobUrl));
    if (inputRef.current) {
      inputRef.current.dispose();
      inputRef.current = null;
    }
  }, [frames]);

  const extractFrames = useCallback(
    async (percentages: number[]) => {
      setLoading(true);
      setError(null);
      setSelectedIndex(null);

      // Clean up previous frames
      frames.forEach((f) => URL.revokeObjectURL(f.blobUrl));

      try {
        const source = new BlobSource(filePath);
        const input = new Input({ formats: ALL_FORMATS, source });
        inputRef.current = input;

        const duration = await input.computeDuration();
        const videoTrack = await input.getPrimaryVideoTrack();

        if (!videoTrack) {
          setError(__('No video track found in the file.'));
          setLoading(false);
          return;
        }

        const sink = new VideoSampleSink(videoTrack);
        const timestamps = percentages.map((p) => p * duration);
        const newFrames: FrameData[] = [];

        for await (const sample of sink.samplesAtTimestamps(timestamps)) {
          if (!sample) continue;

          const blob = await videoSampleToBlob(sample);
          if (blob) {
            newFrames.push({
              blobUrl: URL.createObjectURL(blob),
              blob,
              timestamp: sample.timestamp,
              label: formatTimestamp(sample.timestamp),
            });
          }
          sample.close();
        }

        input.dispose();
        inputRef.current = null;

        setFrames(newFrames);

        if (newFrames.length === 0) {
          setError(__('Could not extract any frames from the video.'));
        }
      } catch (err) {
        console.error('ThumbnailPicker: frame extraction failed', err); // eslint-disable-line no-console
        setError(__("Something didn't work. Please try again."));
      }

      setLoading(false);
    },
    [filePath] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
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

  async function handleUpload() {
    if (selectedIndex === null || !frames[selectedIndex]) return;

    const frame = frames[selectedIndex];
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

      dispatch(doUploadThumbnail(undefined, file, undefined, undefined, onThumbnailSelected));
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
                  alt={__('Thumbnail at %timestamp%', {
                    timestamp: frame.label,
                  })}
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
    </div>
  );
}

async function videoSampleToBlob(sample: VideoSample): Promise<Blob | null> {
  try {
    const width = sample.displayWidth;
    const height = sample.displayHeight;

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
