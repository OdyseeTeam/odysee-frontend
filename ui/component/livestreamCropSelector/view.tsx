import React from 'react';
import type { CropRegion } from 'component/livestreamCompositor/view';
import './style.scss';

type Props = {
  stream: MediaStream;
  crop?: CropRegion;
  onCropChange: (crop: CropRegion | undefined) => void;
  videoStyle?: React.CSSProperties;
  borderRadius?: number;
  layerWidth?: number;
};

type DragState = {
  startX: number;
  startY: number;
  mode: 'draw' | 'move';
  cropStartSx?: number;
  cropStartSy?: number;
};

export default function LivestreamCropSelector(props: Props) {
  const { stream, crop, onCropChange, videoStyle, borderRadius, layerWidth } = props;
  const containerRef = React.useRef<HTMLDivElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const dragRef = React.useRef<DragState | null>(null);
  const [videoSize, setVideoSize] = React.useState({ w: 0, h: 0 });
  const [containerSize, setContainerSize] = React.useState({ w: 0, h: 0 });

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

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setContainerSize({ w: r.width, h: r.height });
    };
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  function getDisplayRect() {
    if (!videoSize.w || !containerSize.w) return null;
    const containerAr = containerSize.w / containerSize.h;
    const videoAr = videoSize.w / videoSize.h;
    let displayedW: number;
    let displayedH: number;
    let offsetX: number;
    let offsetY: number;
    if (containerAr > videoAr) {
      displayedH = containerSize.h;
      displayedW = displayedH * videoAr;
      offsetX = (containerSize.w - displayedW) / 2;
      offsetY = 0;
    } else {
      displayedW = containerSize.w;
      displayedH = displayedW / videoAr;
      offsetX = 0;
      offsetY = (containerSize.h - displayedH) / 2;
    }
    return { displayedW, displayedH, offsetX, offsetY };
  }

  function toVideoCoords(clientX: number, clientY: number) {
    const el = containerRef.current;
    const dr = getDisplayRect();
    if (!el || !dr) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    const localX = clientX - rect.left - dr.offsetX;
    const localY = clientY - rect.top - dr.offsetY;
    const scale = videoSize.w / dr.displayedW;
    return {
      x: Math.max(0, Math.min(videoSize.w, localX * scale)),
      y: Math.max(0, Math.min(videoSize.h, localY * scale)),
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
      let sw = Math.abs(x - drag.startX);
      let sh = Math.abs(y - drag.startY);
      if (e.shiftKey) {
        const side = Math.min(sw, sh);
        sw = side;
        sh = side;
      }
      const sx = x < drag.startX ? drag.startX - sw : drag.startX;
      const sy = y < drag.startY ? drag.startY - sh : drag.startY;
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
    const dr = getDisplayRect();
    if (!crop || !dr) return null;
    const scale = dr.displayedW / videoSize.w;
    const displayedW = crop.sw * scale;
    const displayedH = crop.sh * scale;
    const radiusPx =
      borderRadius && borderRadius > 0 && layerWidth ? (borderRadius / layerWidth) * displayedW : undefined;
    return {
      left: dr.offsetX + crop.sx * scale,
      top: dr.offsetY + crop.sy * scale,
      width: displayedW,
      height: displayedH,
      borderRadius: radiusPx ? `${radiusPx}px` : undefined,
    };
  }, [crop, videoSize, containerSize, borderRadius, layerWidth]);

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
