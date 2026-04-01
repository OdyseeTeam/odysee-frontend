import React from 'react';
import classnames from 'classnames';
import './style.scss';

export type CompositorLayer = {
  id: string;
  label: string;
  stream: MediaStream;
  x: number;
  y: number;
  width: number;
  height: number;
  aspectRatio: number;
  zIndex: number;
  visible: boolean;
};

type Props = {
  layers: CompositorLayer[];
  onLayerUpdate: (id: string, updates: Partial<CompositorLayer>) => void;
  onLayerSelect: (id: string | null) => void;
  onLayerRemove: (id: string) => void;
  selectedLayerId: string | null;
  outputWidth: number;
  outputHeight: number;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
};

type DragState = {
  layerId: string;
  mode: 'move' | 'resize';
  handle?: string;
  startMouseX: number;
  startMouseY: number;
  startLayerX: number;
  startLayerY: number;
  startLayerW: number;
  startLayerH: number;
};

const HANDLE_SIZE = 8;
const HANDLES = ['nw', 'ne', 'sw', 'se'];

function getHandleCursor(handle: string): string {
  switch (handle) {
    case 'nw':
      return 'nwse-resize';
    case 'ne':
      return 'nesw-resize';
    case 'sw':
      return 'nesw-resize';
    case 'se':
      return 'nwse-resize';
    default:
      return 'move';
  }
}

export default function LivestreamCompositor(props: Props) {
  const { layers, onLayerUpdate, onLayerSelect, onLayerRemove, selectedLayerId, outputWidth, outputHeight, canvasRef } =
    props;
  const containerRef = React.useRef<HTMLDivElement>(null);
  const videoElementsRef = React.useRef<Map<string, HTMLVideoElement>>(new Map());
  const animFrameRef = React.useRef<number>(0);
  const dragRef = React.useRef<DragState | null>(null);
  const [containerSize, setContainerSize] = React.useState({ width: 0, height: 0 });

  const scaleX = containerSize.width / outputWidth;
  const scaleY = containerSize.height / outputHeight;

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const obs = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width } = entry.contentRect;
        const height = width * (outputHeight / outputWidth);
        setContainerSize({ width, height });
      }
    });
    obs.observe(container);
    return () => obs.disconnect();
  }, [outputWidth, outputHeight]);

  React.useEffect(() => {
    layers.forEach((layer) => {
      let video = videoElementsRef.current.get(layer.id);
      if (!video) {
        video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;
        video.autoplay = true;
        videoElementsRef.current.set(layer.id, video);
      }
      if (video.srcObject !== layer.stream) {
        video.srcObject = layer.stream;
        video.play().catch(() => {});
      }
    });

    const activeIds = new Set(layers.map((l) => l.id));
    for (const [id, video] of videoElementsRef.current) {
      if (!activeIds.has(id)) {
        video.srcObject = null;
        videoElementsRef.current.delete(id);
      }
    }
  }, [layers]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function draw() {
      if (!ctx) return;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, outputWidth, outputHeight);

      const sorted = [...layers].toSorted((a, b) => a.zIndex - b.zIndex);
      for (const layer of sorted) {
        if (!layer.visible) continue;
        const video = videoElementsRef.current.get(layer.id);
        if (!video || video.readyState < 2) continue;
        ctx.drawImage(video, layer.x, layer.y, layer.width, layer.height);
      }
      animFrameRef.current = requestAnimationFrame(draw);
    }

    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [layers, outputWidth, outputHeight, canvasRef]);

  function getLayerAtPoint(px: number, py: number): CompositorLayer | null {
    const sorted = [...layers].filter((l) => l.visible).toSorted((a, b) => b.zIndex - a.zIndex);
    for (const layer of sorted) {
      const lx = layer.x * scaleX;
      const ly = layer.y * scaleY;
      const lw = layer.width * scaleX;
      const lh = layer.height * scaleY;
      if (px >= lx && px <= lx + lw && py >= ly && py <= ly + lh) return layer;
    }
    return null;
  }

  function getHandleAtPoint(px: number, py: number, layer: CompositorLayer): string | null {
    const lx = layer.x * scaleX;
    const ly = layer.y * scaleY;
    const lw = layer.width * scaleX;
    const lh = layer.height * scaleY;
    const hs = HANDLE_SIZE;

    for (const handle of HANDLES) {
      let hx = 0,
        hy = 0;
      if (handle === 'nw') {
        hx = lx;
        hy = ly;
      } else if (handle === 'ne') {
        hx = lx + lw;
        hy = ly;
      } else if (handle === 'sw') {
        hx = lx;
        hy = ly + lh;
      } else if (handle === 'se') {
        hx = lx + lw;
        hy = ly + lh;
      }
      if (Math.abs(px - hx) <= hs && Math.abs(py - hy) <= hs) return handle;
    }
    return null;
  }

  function handleMouseDown(e: React.MouseEvent) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (selectedLayerId) {
      const selectedLayer = layers.find((l) => l.id === selectedLayerId);
      if (selectedLayer) {
        const handle = getHandleAtPoint(mx, my, selectedLayer);
        if (handle) {
          dragRef.current = {
            layerId: selectedLayer.id,
            mode: 'resize',
            handle,
            startMouseX: mx,
            startMouseY: my,
            startLayerX: selectedLayer.x,
            startLayerY: selectedLayer.y,
            startLayerW: selectedLayer.width,
            startLayerH: selectedLayer.height,
          };
          e.preventDefault();
          return;
        }
      }
    }

    const layer = getLayerAtPoint(mx, my);
    if (layer) {
      onLayerSelect(layer.id);
      dragRef.current = {
        layerId: layer.id,
        mode: 'move',
        startMouseX: mx,
        startMouseY: my,
        startLayerX: layer.x,
        startLayerY: layer.y,
        startLayerW: layer.width,
        startLayerH: layer.height,
      };
      e.preventDefault();
    } else {
      onLayerSelect(null);
    }
  }

  function handleMouseMove(e: React.MouseEvent) {
    const drag = dragRef.current;
    if (!drag) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const dx = (mx - drag.startMouseX) / scaleX;
    const dy = (my - drag.startMouseY) / scaleY;

    if (drag.mode === 'move') {
      onLayerUpdate(drag.layerId, {
        x: Math.round(drag.startLayerX + dx),
        y: Math.round(drag.startLayerY + dy),
      });
    } else if (drag.mode === 'resize' && drag.handle) {
      const layer = layers.find((l) => l.id === drag.layerId);
      const ar = layer?.aspectRatio || drag.startLayerW / drag.startLayerH;
      let newW = drag.startLayerW;
      let newX = drag.startLayerX;
      let newY = drag.startLayerY;

      const isRight = drag.handle.includes('e');
      const isLeft = drag.handle.includes('w');
      const isBottom = drag.handle.includes('s');
      const isTop = drag.handle.includes('n');

      if (isRight || isLeft) {
        const rawW = isRight ? drag.startLayerW + dx : drag.startLayerW - dx;
        newW = Math.max(50, rawW);
      } else {
        const rawH = isBottom ? drag.startLayerH + dy : drag.startLayerH - dy;
        newW = Math.max(50, rawH * ar);
      }

      const newH = newW / ar;

      if (isLeft) newX = drag.startLayerX + (drag.startLayerW - newW);
      if (isTop) newY = drag.startLayerY + (drag.startLayerH - newH);

      onLayerUpdate(drag.layerId, {
        x: Math.round(newX),
        y: Math.round(newY),
        width: Math.round(newW),
        height: Math.round(newH),
      });
    }
  }

  function handleMouseUp() {
    dragRef.current = null;
  }

  return (
    <div
      ref={containerRef}
      className="livestream-compositor"
      style={{ aspectRatio: `${outputWidth} / ${outputHeight}` }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <canvas ref={canvasRef} className="livestream-compositor__canvas" />

      {layers
        .filter((l) => l.visible)
        .map((layer) => {
          const isSelected = layer.id === selectedLayerId;
          return (
            <div
              key={layer.id}
              className={classnames('livestream-compositor__layer-outline', {
                'livestream-compositor__layer-outline--selected': isSelected,
              })}
              style={{
                left: layer.x * scaleX,
                top: layer.y * scaleY,
                width: layer.width * scaleX,
                height: layer.height * scaleY,
              }}
            >
              <div className="livestream-compositor__layer-toolbar">
                <span className="livestream-compositor__layer-label">{layer.label}</span>
                <div className="livestream-compositor__layer-actions">
                  <button
                    className="livestream-compositor__layer-btn"
                    title={__('Fill canvas')}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      const ar = layer.aspectRatio;
                      const fitW = Math.min(outputWidth, outputHeight * ar);
                      const fitH = fitW / ar;
                      onLayerUpdate(layer.id, {
                        x: Math.round((outputWidth - fitW) / 2),
                        y: Math.round((outputHeight - fitH) / 2),
                        width: Math.round(fitW),
                        height: Math.round(fitH),
                      });
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="15 3 21 3 21 9" />
                      <polyline points="9 21 3 21 3 15" />
                      <line x1="21" y1="3" x2="14" y2="10" />
                      <line x1="3" y1="21" x2="10" y2="14" />
                    </svg>
                  </button>
                  <button
                    className="livestream-compositor__layer-btn"
                    title={__('Minimize')}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      const ar = layer.aspectRatio;
                      const miniW = Math.round(outputWidth * 0.25);
                      const miniH = Math.round(miniW / ar);
                      onLayerUpdate(layer.id, {
                        width: miniW,
                        height: miniH,
                        x: outputWidth - miniW - 20,
                        y: outputHeight - miniH - 20,
                      });
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="4 14 10 14 10 20" />
                      <polyline points="20 10 14 10 14 4" />
                      <line x1="14" y1="10" x2="21" y2="3" />
                      <line x1="3" y1="21" x2="10" y2="14" />
                    </svg>
                  </button>
                  <button
                    className="livestream-compositor__layer-btn livestream-compositor__layer-btn--close"
                    title={__('Remove')}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      onLayerRemove(layer.id);
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
              {isSelected &&
                HANDLES.map((handle) => {
                  const style: React.CSSProperties = { cursor: getHandleCursor(handle) };
                  if (handle.includes('n')) style.top = -HANDLE_SIZE / 2;
                  if (handle.includes('s')) style.bottom = -HANDLE_SIZE / 2;
                  if (handle.includes('w')) style.left = -HANDLE_SIZE / 2;
                  if (handle.includes('e')) style.right = -HANDLE_SIZE / 2;
                  return <div key={handle} className="livestream-compositor__handle" style={style} />;
                })}
            </div>
          );
        })}

      {layers.length === 0 && (
        <div className="livestream-compositor__empty">{__('Select video sources from the panel')}</div>
      )}
    </div>
  );
}
