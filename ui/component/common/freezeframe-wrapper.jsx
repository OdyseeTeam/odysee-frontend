// @flow
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import classnames from 'classnames';
import { THUMBNAIL_CDN_URL } from 'config';

type Props = {
  src: string,
  className: string,
  children: any,
};

const imageDataCache = new Map();

const FreezeframeWrapper = React.memo((props: Props) => {
  const { src, className, children } = props;
  const canvasRef = useRef();
  const [ready, setReady] = useState(() => {
    const devicePixelRatio = window.devicePixelRatio || 1.0;
    const fullSrc = src ? `${THUMBNAIL_CDN_URL}s:${Math.floor(64 * devicePixelRatio)}:0/quality:95/plain/${src}` : null;
    return fullSrc ? imageDataCache.has(fullSrc) : false;
  });

  const devicePixelRatio = window.devicePixelRatio || 1.0;
  const fullSrc = src ? `${THUMBNAIL_CDN_URL}s:${Math.floor(64 * devicePixelRatio)}:0/quality:95/plain/${src}` : null;

  useLayoutEffect(() => {
    if (!canvasRef.current || !fullSrc) return;
    const cached = imageDataCache.get(fullSrc);
    if (cached) {
      const canvas = canvasRef.current;
      canvas.width = cached.width;
      canvas.height = cached.height;
      const ctx = canvas.getContext('2d');
      ctx.putImageData(cached.imageData, 0, 0);
      if (!ready) setReady(true);
    }
  }, [fullSrc, ready]);

  useEffect(() => {
    if (!canvasRef.current || !fullSrc || imageDataCache.has(fullSrc)) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      try {
        const imageData = ctx.getImageData(0, 0, width, height);
        imageDataCache.set(fullSrc, { imageData, width, height });
      } catch (e) {}
      setReady(true);
    };
    img.src = fullSrc;
  }, [fullSrc]);

  return (
    <div className={classnames(className, 'freezeframe-wrapper')}>
      <canvas
        ref={canvasRef}
        className="freezeframe-canvas"
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          visibility: ready ? 'visible' : 'hidden',
        }}
      />
      {!ready && fullSrc && (
        <img
          src={fullSrc}
          className="freezeframe-fallback"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            objectFit: 'cover',
          }}
        />
      )}
      {children}
    </div>
  );
});

export default FreezeframeWrapper;
