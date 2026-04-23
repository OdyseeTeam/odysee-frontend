import React from 'react';
import type { CropRegion } from 'component/livestreamCompositor/view';
import './style.scss';

type Props = {
  stream: MediaStream;
  crop?: CropRegion;
  onCropChange: (crop: CropRegion | undefined) => void;
  videoStyle?: React.CSSProperties;
};

type DragState = {
  startX: number;
  startY: number;
  mode: 'draw' | 'move';
  cropStartSx?: number;
  cropStartSy?: number;
};

export default function LivestreamCropSelector(props: Props) {
  const { stream, crop, onCropChange, videoStyle } = props;
  const containerRef = React.useRef<HTMLDivElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const dragRef = React.useRef<DragState | null>(null);
  const [videoSize, setVideoSize] = React.useState({ w: 0, h: 0 });

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    video.play().catch(() => {});

    const onMeta = () => setVideoSize({ w: video.videoWidth, h: video.videoHeight });
    video.addEventListener('loadedmetadata', onMeta);
    if (video.videoWidth) onMeta();
    return () => video.removeEventListener('loadedmetadata', onMeta);
  }, [stream]);

  function toVideoCoords(clientX: number, clientY: number) {
    const el = containerRef.current;
    if (!el || !videoSize.w) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    const scaleX = videoSize.w / rect.width;
    const scaleY = videoSize.h / rect.height;
    return {
      x: Math.max(0, Math.min(videoSize.w, (clientX - rect.left) * scaleX)),
      y: Math.max(0, Math.min(videoSize.h, (clientY - rect.top) * scaleY)),
    };
  }

  function handleMouseDown(e: React.MouseEvent) {
    const { x, y } = toVideoCoords(e.clientX, e.clientY);

    if (crop) {
      const inCrop = x >= crop.sx && x <= crop.sx + crop.sw && y >= crop.sy && y <= crop.sy + crop.sh;
      if (inCrop) {
        dragRef.current = { startX: x, startY: y, mode: 'move', cropStartSx: crop.sx, cropStartSy: crop.sy };
        e.preventDefault();
        return;
      }
    }

    dragRef.current = { startX: x, startY: y, mode: 'draw' };
    e.preventDefault();
  }

  function handleMouseMove(e: React.MouseEvent) {
    const drag = dragRef.current;
    if (!drag) return;
    const { x, y } = toVideoCoords(e.clientX, e.clientY);

    if (drag.mode === 'draw') {
      const sx = Math.min(drag.startX, x);
      const sy = Math.min(drag.startY, y);
      const sw = Math.abs(x - drag.startX);
      const sh = Math.abs(y - drag.startY);
      if (sw > 5 && sh > 5) {
        onCropChange({ sx: Math.round(sx), sy: Math.round(sy), sw: Math.round(sw), sh: Math.round(sh) });
      }
    } else if (drag.mode === 'move' && crop) {
      const dx = x - drag.startX;
      const dy = y - drag.startY;
      const newSx = Math.max(0, Math.min(videoSize.w - crop.sw, (drag.cropStartSx || 0) + dx));
      const newSy = Math.max(0, Math.min(videoSize.h - crop.sh, (drag.cropStartSy || 0) + dy));
      onCropChange({ ...crop, sx: Math.round(newSx), sy: Math.round(newSy) });
    }
  }

  function handleMouseUp() {
    dragRef.current = null;
  }

  function handleReset() {
    onCropChange(undefined);
  }

  const cropOverlayStyle = React.useMemo(() => {
    if (!crop || !videoSize.w || !containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = rect.width / videoSize.w;
    const scaleY = rect.height / videoSize.h;
    return {
      left: crop.sx * scaleX,
      top: crop.sy * scaleY,
      width: crop.sw * scaleX,
      height: crop.sh * scaleY,
    };
  }, [crop, videoSize]);

  return (
    <div
      ref={containerRef}
      className="livestream-crop"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <video
        ref={videoRef}
        className="livestream-crop__video"
        style={videoStyle}
        muted
        playsInline
        autoPlay
        disablePictureInPicture
      />

      {crop && cropOverlayStyle && (
        <div className="livestream-crop__region" style={cropOverlayStyle}>
          <button
            className="livestream-crop__reset"
            onMouseDown={(e) => {
              e.stopPropagation();
              handleReset();
            }}
          >
            ✕
          </button>
        </div>
      )}

      {!crop && <div className="livestream-crop__hint">{__('Draw to crop')}</div>}
    </div>
  );
}
