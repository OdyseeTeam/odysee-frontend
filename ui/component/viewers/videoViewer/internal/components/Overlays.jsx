// @flow
import React, { useState, useEffect, useRef, useCallback } from 'react';

const OVERLAY_DURATION_MS = 800;

type OverlayData = {
  content: string,
  id: number,
};

let overlayIdCounter = 0;

export function useOverlay() {
  const [overlay, setOverlay] = useState(null);
  const timerRef = useRef(null);

  const showOverlay = useCallback((content: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const id = ++overlayIdCounter;
    setOverlay({ content, id });
    timerRef.current = setTimeout(() => {
      setOverlay(null);
    }, OVERLAY_DURATION_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { overlay, showOverlay };
}

type Props = {
  overlay: ?OverlayData,
};

export default function Overlays({ overlay }: Props) {
  if (!overlay) return null;

  return (
    <div className="odysee-overlay odysee-overlay--center" key={overlay.id}>
      <div className="odysee-overlay__content">{overlay.content}</div>
    </div>
  );
}
