import React from 'react';
import classnames from 'classnames';
import {
  PLACEHOLDER_MESSAGES,
  PLACEHOLDER_HYPERCHATS,
  hyperchatColorHex,
  type ChatPlaceholderMessage,
} from 'util/livestreamChatPlaceholders';
import { applyChromaKey, releaseChromaKey } from 'util/chromaKey';
import './style.scss';

export type CropRegion = {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
};

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
  minimized?: boolean;
  locked?: boolean;
  crop?: CropRegion;
  borderRadius?: number;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  opacity?: number;
  pipGeometry?: { x: number; y: number; width: number; height: number };
  displayMode?: 'max' | 'pip';
  restoreGeometry?: { x: number; y: number; width: number; height: number };
  chatFontSize?: number;
  chatTextColor?: string;
  chatUserColor?: string;
  chatBgColor?: string;
  chatBgTransparent?: boolean;
  chatBgAlpha?: number;
  chatBorderColor?: string;
  chatBorderWidth?: number;
  chatLineHeight?: number;
  chatMaxMessages?: number;
  chatShowAvatars?: boolean;
  chatBold?: boolean;
  chatHyperchatOnly?: boolean;
  chatNewOnTop?: boolean;
  freeAspect?: boolean;
  sourceRotation?: 0 | 90 | 180 | 270;
  chromaKey?: {
    enabled: boolean;
    color: string;
    threshold: number;
    smoothness: number;
  };
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
  getWidgetCanvas?: (id: string) => HTMLCanvasElement | null;
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
  selectionChanged?: boolean;
};

const HANDLE_SIZE = 8;
const HANDLE_HIT_SIZE = 16;
const EDGE_HIT_SIZE = 8;
const CORNER_HANDLES = ['nw', 'ne', 'sw', 'se'];
const EDGE_HANDLES = ['n', 's', 'e', 'w'];
const HANDLES = CORNER_HANDLES;

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
    case 'n':
    case 's':
      return 'ns-resize';
    case 'e':
    case 'w':
      return 'ew-resize';
    default:
      return 'move';
  }
}

export function ChatWidgetEditPreview({ layer, scale }: { layer: CompositorLayer; scale: number }) {
  const max = layer.chatMaxMessages ?? 30;
  const hyperchatOnly = layer.chatHyperchatOnly ?? false;
  const pool = React.useMemo(() => (hyperchatOnly ? PLACEHOLDER_HYPERCHATS : PLACEHOLDER_MESSAGES), [hyperchatOnly]);
  const [feed, setFeed] = React.useState<ChatPlaceholderMessage[]>(() => pool.slice(0, Math.min(max, pool.length)));
  const cursorRef = React.useRef(Math.min(max, pool.length));
  React.useEffect(() => {
    setFeed(pool.slice(0, Math.min(max, pool.length)));
    cursorRef.current = Math.min(max, pool.length);
  }, [pool, max]);
  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const next = pool[cursorRef.current % pool.length];
      cursorRef.current += 1;
      setFeed((prev) => {
        const appended = [...prev, next];
        return appended.length > max ? appended.slice(appended.length - max) : appended;
      });
      const delay = 600 + Math.random() * 2400;
      timer = setTimeout(tick, delay);
    };
    timer = setTimeout(tick, 600 + Math.random() * 1400);
    return () => clearTimeout(timer);
  }, [pool, max]);
  const newOnTop = layer.chatNewOnTop ?? false;
  const visible = newOnTop ? [...feed].reverse() : feed;
  const fontSize = (layer.chatFontSize ?? 20) * scale;
  const lineHeight = layer.chatLineHeight ?? 1.4;
  const textColor = layer.chatTextColor ?? '#ffffff';
  const dynPrimary =
    typeof document !== 'undefined'
      ? getComputedStyle(document.documentElement).getPropertyValue('--color-primary-dynamic').trim()
      : '';
  const userColor = layer.chatUserColor ?? (dynPrimary ? `rgb(${dynPrimary})` : '#de0050');
  const bgAlpha = layer.chatBgAlpha ?? (layer.chatBgTransparent === false ? 1 : 0);
  const bgHex = layer.chatBgColor ?? '#000000';
  const bgR = parseInt(bgHex.slice(1, 3), 16);
  const bgG = parseInt(bgHex.slice(3, 5), 16);
  const bgB = parseInt(bgHex.slice(5, 7), 16);
  const bgColor = bgAlpha <= 0 ? 'transparent' : `rgba(${bgR}, ${bgG}, ${bgB}, ${bgAlpha})`;
  const borderColor = layer.chatBorderColor ?? '#000000';
  const borderWidth = layer.chatBorderWidth ?? 1;
  const stroke =
    borderWidth > 0
      ? `-${borderWidth}px -${borderWidth}px 0 ${borderColor}, ${borderWidth}px -${borderWidth}px 0 ${borderColor}, -${borderWidth}px ${borderWidth}px 0 ${borderColor}, ${borderWidth}px ${borderWidth}px 0 ${borderColor}`
      : 'none';
  const hyperColor = hyperchatColorHex;
  const hexToRgb = (hex: string) => {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  };
  return (
    <div
      className={classnames('livestream-compositor__chat-edit-preview', {
        'livestream-compositor__chat-edit-preview--new-on-top': newOnTop,
      })}
      style={{
        background: bgColor,
        fontSize: `${fontSize}px`,
        lineHeight,
        textShadow: stroke,
      }}
    >
      {visible.map((m: ChatPlaceholderMessage, i: number) => {
        if (m.amount) {
          const c = hyperColor(m.amount);
          const [r, g, b] = hexToRgb(c);
          return (
            <div
              key={i}
              className="livestream-compositor__chat-edit-hyperchat"
              style={{ background: `rgba(${r}, ${g}, ${b}, 0.08)`, border: `1px solid ${c}` }}
            >
              <div
                className="livestream-compositor__chat-edit-hyperchat-banner"
                style={{ backgroundImage: `linear-gradient(to right, ${c}, transparent)` }}
              >
                <span>${m.amount}</span>
              </div>
              <div className="livestream-compositor__chat-edit-hyperchat-body">
                <span style={{ color: userColor }}>{m.user}:</span>
                <span style={{ color: textColor }}>{m.msg}</span>
              </div>
            </div>
          );
        }
        return (
          <div key={i} className="livestream-compositor__chat-edit-msg">
            <span style={{ color: userColor }}>{m.user}:</span>
            <span style={{ color: textColor }}>{m.msg}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function LivestreamCompositor(props: Props) {
  const {
    layers,
    onLayerUpdate,
    onLayerSelect,
    onLayerRemove,
    selectedLayerId,
    outputWidth,
    outputHeight,
    canvasRef,
    getWidgetCanvas,
  } = props;
  const getWidgetCanvasRef = React.useRef(getWidgetCanvas);
  getWidgetCanvasRef.current = getWidgetCanvas;
  const containerRef = React.useRef<HTMLDivElement>(null);
  const videoElementsRef = React.useRef<Map<string, HTMLVideoElement>>(new Map());
  const animFrameRef = React.useRef<number>(0);
  const dragRef = React.useRef<DragState | null>(null);
  const pointersRef = React.useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchRef = React.useRef<{
    layerId: string;
    startDist: number;
    startCenterX: number;
    startCenterY: number;
    startLayerX: number;
    startLayerY: number;
    startLayerW: number;
    startLayerH: number;
    aspectRatio: number;
  } | null>(null);
  const [containerSize, setContainerSize] = React.useState({ width: 0, height: 0 });
  const layersRef = React.useRef<CompositorLayer[]>(layers);
  layersRef.current = layers;

  const scaleX = containerSize.width > 0 ? containerSize.width / outputWidth : 1;
  const scaleY = containerSize.height > 0 ? containerSize.height / outputHeight : 1;

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const update = () => {
      const rect = container.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    };
    update();
    const obs = new ResizeObserver(update);
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
        releaseChromaKey(id);
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

      const currentLayers = layersRef.current;
      const sorted = [...currentLayers].sort((a, b) => {
        const aWidget = a.id.startsWith('__widget_') ? 1 : 0;
        const bWidget = b.id.startsWith('__widget_') ? 1 : 0;
        if (aWidget !== bWidget) return aWidget - bWidget;
        return a.zIndex - b.zIndex;
      });
      for (const layer of sorted) {
        if (!layer.visible) continue;
        const widgetCanvas = layer.id.startsWith('__widget_') ? getWidgetCanvasRef.current?.(layer.id) : null;
        const video = widgetCanvas ? null : videoElementsRef.current.get(layer.id);
        const source: CanvasImageSource | null = widgetCanvas
          ? widgetCanvas
          : video && video.readyState >= 2
            ? video
            : null;
        if (!source) continue;

        ctx.save();
        ctx.globalAlpha = layer.opacity ?? 1;
        ctx.filter = 'none';

        const filters: string[] = [];
        if (layer.brightness != null && layer.brightness !== 100) filters.push(`brightness(${layer.brightness}%)`);
        if (layer.contrast != null && layer.contrast !== 100) filters.push(`contrast(${layer.contrast}%)`);
        if (layer.saturation != null && layer.saturation !== 100) filters.push(`saturate(${layer.saturation}%)`);
        if (filters.length > 0) ctx.filter = filters.join(' ');

        if (layer.borderRadius && layer.borderRadius > 0) {
          const r = layer.borderRadius;
          ctx.beginPath();
          ctx.roundRect(layer.x, layer.y, layer.width, layer.height, r);
          ctx.clip();
        }

        let drawSource: CanvasImageSource = source;
        if (layer.chromaKey?.enabled && !widgetCanvas && video) {
          const srcW = video.videoWidth || 0;
          const srcH = video.videoHeight || 0;
          const keyed = applyChromaKey(layer.id, video, srcW, srcH, {
            color: layer.chromaKey.color,
            threshold: layer.chromaKey.threshold,
            smoothness: layer.chromaKey.smoothness,
          });
          if (keyed) drawSource = keyed;
        }

        const rotation = layer.sourceRotation || 0;
        if (rotation) {
          ctx.translate(layer.x + layer.width / 2, layer.y + layer.height / 2);
          ctx.rotate((rotation * Math.PI) / 180);
          const drawW = rotation === 90 || rotation === 270 ? layer.height : layer.width;
          const drawH = rotation === 90 || rotation === 270 ? layer.width : layer.height;
          if (layer.crop) {
            ctx.drawImage(
              drawSource,
              layer.crop.sx,
              layer.crop.sy,
              layer.crop.sw,
              layer.crop.sh,
              -drawW / 2,
              -drawH / 2,
              drawW,
              drawH
            );
          } else {
            ctx.drawImage(drawSource, -drawW / 2, -drawH / 2, drawW, drawH);
          }
        } else if (layer.crop) {
          ctx.drawImage(
            drawSource,
            layer.crop.sx,
            layer.crop.sy,
            layer.crop.sw,
            layer.crop.sh,
            layer.x,
            layer.y,
            layer.width,
            layer.height
          );
        } else {
          ctx.drawImage(drawSource, layer.x, layer.y, layer.width, layer.height);
        }

        ctx.restore();
      }
      animFrameRef.current = requestAnimationFrame(draw);
    }

    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [outputWidth, outputHeight, canvasRef]);

  function getLayersAtPoint(px: number, py: number): CompositorLayer[] {
    const sorted = [...layers]
      .filter((l) => l.visible)
      .sort((a, b) => {
        const aWidget = a.id.startsWith('__widget_') ? 1 : 0;
        const bWidget = b.id.startsWith('__widget_') ? 1 : 0;
        if (aWidget !== bWidget) return bWidget - aWidget;
        return b.zIndex - a.zIndex;
      });
    return sorted.filter((layer) => {
      const lx = layer.x * scaleX;
      const ly = layer.y * scaleY;
      const lw = layer.width * scaleX;
      const lh = layer.height * scaleY;
      return px >= lx && px <= lx + lw && py >= ly && py <= ly + lh;
    });
  }

  function getHandleAtPoint(px: number, py: number, layer: CompositorLayer): string | null {
    const lx = layer.x * scaleX;
    const ly = layer.y * scaleY;
    const lw = layer.width * scaleX;
    const lh = layer.height * scaleY;
    const hs = HANDLE_HIT_SIZE;

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
    if (layer.freeAspect) {
      const es = EDGE_HIT_SIZE;
      const insideX = px >= lx + es && px <= lx + lw - es;
      const insideY = py >= ly + es && py <= ly + lh - es;
      if (insideX && Math.abs(py - ly) <= es) return 'n';
      if (insideX && Math.abs(py - (ly + lh)) <= es) return 's';
      if (insideY && Math.abs(px - lx) <= es) return 'w';
      if (insideY && Math.abs(px - (lx + lw)) <= es) return 'e';
    }
    return null;
  }

  const didDragRef = React.useRef(false);

  function handlePointerDown(e: React.PointerEvent) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    pointersRef.current.set(e.pointerId, { x: mx, y: my });
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {}

    if (pointersRef.current.size >= 2) {
      const activeLayerId = dragRef.current?.layerId || selectedLayerId;
      const pinchLayer = layers.find((l) => l.id === activeLayerId && l.visible && !l.locked);
      if (pinchLayer) {
        const pts = [...pointersRef.current.values()];
        const p0 = pts[0];
        const p1 = pts[1];
        const dist = Math.hypot(p1.x - p0.x, p1.y - p0.y);
        pinchRef.current = {
          layerId: pinchLayer.id,
          startDist: dist,
          startCenterX: (p0.x + p1.x) / 2,
          startCenterY: (p0.y + p1.y) / 2,
          startLayerX: pinchLayer.x,
          startLayerY: pinchLayer.y,
          startLayerW: pinchLayer.width,
          startLayerH: pinchLayer.height,
          aspectRatio: pinchLayer.aspectRatio || pinchLayer.width / pinchLayer.height,
        };
        dragRef.current = null;
        e.preventDefault();
        return;
      }
    }

    didDragRef.current = false;

    if (selectedLayerId) {
      const selLayer = layers.find((l) => l.id === selectedLayerId && l.visible && !l.locked);
      if (selLayer) {
        const handle = getHandleAtPoint(mx, my, selLayer);
        if (handle) {
          const selIsWidget = selLayer.id.startsWith('__widget_');
          const coveringLayer = layers.find((l) => {
            if (l.id === selLayer.id || !l.visible) return false;
            const lIsWidget = l.id.startsWith('__widget_');
            if (selIsWidget && !lIsWidget) return false;
            if (!selIsWidget && lIsWidget) {
              // widget always above non-widget
            } else if (l.zIndex <= selLayer.zIndex) {
              return false;
            }
            const lx = l.x * scaleX;
            const ly = l.y * scaleY;
            const lw = l.width * scaleX;
            const lh = l.height * scaleY;
            return mx >= lx && mx <= lx + lw && my >= ly && my <= ly + lh;
          });
          if (!coveringLayer) {
            dragRef.current = {
              layerId: selLayer.id,
              mode: 'resize',
              handle,
              startMouseX: mx,
              startMouseY: my,
              startLayerX: selLayer.x,
              startLayerY: selLayer.y,
              startLayerW: selLayer.width,
              startLayerH: selLayer.height,
            };
            e.preventDefault();
            return;
          }
        }
      }
    }

    const hitLayers = getLayersAtPoint(mx, my);

    if (hitLayers.length === 0) {
      onLayerSelect(null);
      return;
    }

    const selectedInHit = selectedLayerId ? hitLayers.find((l) => l.id === selectedLayerId) : null;

    if (selectedInHit && !selectedInHit.locked) {
      dragRef.current = {
        layerId: selectedInHit.id,
        mode: 'move',
        startMouseX: mx,
        startMouseY: my,
        startLayerX: selectedInHit.x,
        startLayerY: selectedInHit.y,
        startLayerW: selectedInHit.width,
        startLayerH: selectedInHit.height,
      };
      e.preventDefault();
      return;
    }

    const target = hitLayers[0];
    const selectionChanged = selectedLayerId !== target.id;
    onLayerSelect(target.id);
    dragRef.current = {
      layerId: target.id,
      mode: 'move',
      startMouseX: mx,
      startMouseY: my,
      startLayerX: target.x,
      startLayerY: target.y,
      startLayerW: target.width,
      startLayerH: target.height,
      selectionChanged,
    };
    e.preventDefault();
  }

  function handlePointerMove(e: React.PointerEvent) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    if (pointersRef.current.has(e.pointerId)) {
      pointersRef.current.set(e.pointerId, { x: mx, y: my });
    }

    const pinch = pinchRef.current;
    if (pinch && pointersRef.current.size >= 2) {
      const pts = [...pointersRef.current.values()];
      const p0 = pts[0];
      const p1 = pts[1];
      const dist = Math.hypot(p1.x - p0.x, p1.y - p0.y);
      const scale = pinch.startDist > 0 ? dist / pinch.startDist : 1;
      const cx = (p0.x + p1.x) / 2;
      const cy = (p0.y + p1.y) / 2;
      const deltaCx = (cx - pinch.startCenterX) / scaleX;
      const deltaCy = (cy - pinch.startCenterY) / scaleY;

      const newW = Math.max(50, Math.round(pinch.startLayerW * scale));
      const newH = Math.max(50, Math.round(pinch.startLayerH * scale));
      const startMidX = pinch.startLayerX + pinch.startLayerW / 2;
      const startMidY = pinch.startLayerY + pinch.startLayerH / 2;
      const newX = Math.round(startMidX + deltaCx - newW / 2);
      const newY = Math.round(startMidY + deltaCy - newH / 2);

      const updates: Partial<CompositorLayer> = { x: newX, y: newY, width: newW, height: newH };
      const layer = layers.find((l) => l.id === pinch.layerId);
      if (layer?.displayMode) updates.displayMode = undefined;
      onLayerUpdate(pinch.layerId, updates);
      e.preventDefault();
      return;
    }

    const drag = dragRef.current;
    if (!drag) return;
    const dx = (mx - drag.startMouseX) / scaleX;
    const dy = (my - drag.startMouseY) / scaleY;

    if (Math.abs(mx - drag.startMouseX) > 3 || Math.abs(my - drag.startMouseY) > 3) {
      didDragRef.current = true;
    }

    const layer = layers.find((l) => l.id === drag.layerId);

    if (drag.mode === 'move') {
      const w = layer?.width ?? drag.startLayerW;
      const h = layer?.height ?? drag.startLayerH;
      const nx = Math.max(0, Math.min(outputWidth - w, Math.round(drag.startLayerX + dx)));
      const ny = Math.max(0, Math.min(outputHeight - h, Math.round(drag.startLayerY + dy)));
      const updates: Partial<CompositorLayer> = { x: nx, y: ny };
      if (layer?.displayMode === 'pip') {
        updates.pipGeometry = { x: nx, y: ny, width: w, height: h };
      } else if (layer?.displayMode === 'max') {
        updates.displayMode = undefined;
      }
      onLayerUpdate(drag.layerId, updates);
    } else if (drag.mode === 'resize' && drag.handle) {
      const ar = layer?.aspectRatio || drag.startLayerW / drag.startLayerH;
      let newW = drag.startLayerW;
      let newH = drag.startLayerH;
      let newX = drag.startLayerX;
      let newY = drag.startLayerY;

      const isRight = drag.handle.includes('e');
      const isLeft = drag.handle.includes('w');
      const isBottom = drag.handle.includes('s');
      const isTop = drag.handle.includes('n');

      if (layer?.freeAspect) {
        if (isRight) newW = Math.max(50, drag.startLayerW + dx);
        if (isLeft) newW = Math.max(50, drag.startLayerW - dx);
        if (isBottom) newH = Math.max(50, drag.startLayerH + dy);
        if (isTop) newH = Math.max(50, drag.startLayerH - dy);
      } else {
        if (isRight || isLeft) {
          const rawW = isRight ? drag.startLayerW + dx : drag.startLayerW - dx;
          newW = Math.max(50, rawW);
        } else {
          const rawH = isBottom ? drag.startLayerH + dy : drag.startLayerH - dy;
          newW = Math.max(50, rawH * ar);
        }
        newH = newW / ar;
      }

      if (isLeft) newX = drag.startLayerX + (drag.startLayerW - newW);
      if (isTop) newY = drag.startLayerY + (drag.startLayerH - newH);

      let rx = Math.round(newX);
      let ry = Math.round(newY);
      let rw = Math.round(newW);
      let rh = Math.round(newH);
      if (rx < 0) {
        rw += rx;
        rx = 0;
      }
      if (ry < 0) {
        rh += ry;
        ry = 0;
      }
      if (rx + rw > outputWidth) rw = outputWidth - rx;
      if (ry + rh > outputHeight) rh = outputHeight - ry;
      rw = Math.max(50, rw);
      rh = Math.max(50, rh);
      const updates: Partial<CompositorLayer> = { x: rx, y: ry, width: rw, height: rh };
      if (layer?.displayMode === 'pip') {
        updates.pipGeometry = { x: rx, y: ry, width: rw, height: rh };
      } else if (layer?.displayMode === 'max') {
        updates.displayMode = undefined;
      }
      onLayerUpdate(drag.layerId, updates);
    }
  }

  function handlePointerUp(e: React.PointerEvent) {
    pointersRef.current.delete(e.pointerId);
    try {
      (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
    } catch {}
    if (pointersRef.current.size < 2) pinchRef.current = null;
    if (pointersRef.current.size === 0) {
      dragRef.current = null;
      didDragRef.current = false;
    }
  }

  return (
    <div
      ref={containerRef}
      className="livestream-compositor"
      style={{ aspectRatio: `${outputWidth} / ${outputHeight}` }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <canvas ref={canvasRef} className="livestream-compositor__canvas" />

      {[...layers]
        .filter((l) => l.visible)
        .sort((a, b) => {
          const aWidget = a.id.startsWith('__widget_') ? 1 : 0;
          const bWidget = b.id.startsWith('__widget_') ? 1 : 0;
          if (aWidget !== bWidget) return aWidget - bWidget;
          return a.zIndex - b.zIndex;
        })
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
              {layer.id === '__widget_chat__' && <ChatWidgetEditPreview layer={layer} scale={scaleX} />}
              <div className="livestream-compositor__layer-toolbar">
                <span className="livestream-compositor__layer-label">{layer.label}</span>
                <div className="livestream-compositor__layer-actions">
                  <button
                    className={classnames('livestream-compositor__layer-btn', {
                      'livestream-compositor__layer-btn--active':
                        layer.displayMode === 'max' || layer.displayMode === 'pip',
                    })}
                    title={layer.displayMode === 'max' ? __('Picture in picture') : __('Fill canvas')}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      const restore = layer.displayMode
                        ? layer.restoreGeometry
                        : { x: layer.x, y: layer.y, width: layer.width, height: layer.height };
                      if (layer.displayMode === 'max') {
                        let pipX: number;
                        let pipY: number;
                        let pipW: number;
                        let pipH: number;
                        if (layer.pipGeometry) {
                          pipX = layer.pipGeometry.x;
                          pipY = layer.pipGeometry.y;
                          pipW = layer.pipGeometry.width;
                          pipH = layer.pipGeometry.height;
                        } else {
                          const ar = layer.aspectRatio;
                          pipW = Math.round(outputWidth * 0.25);
                          pipH = Math.round(pipW / ar);
                          pipX = outputWidth - pipW - 20;
                          pipY = outputHeight - pipH - 20;
                        }
                        onLayerUpdate(layer.id, {
                          x: pipX,
                          y: pipY,
                          width: pipW,
                          height: pipH,
                          pipGeometry: { x: pipX, y: pipY, width: pipW, height: pipH },
                          displayMode: 'pip',
                          restoreGeometry: restore,
                        });
                        return;
                      }
                      const liveVideo = videoElementsRef.current.get(layer.id);
                      const liveW = liveVideo?.videoWidth || 0;
                      const liveH = liveVideo?.videoHeight || 0;
                      const baseAr = liveW > 0 && liveH > 0 ? liveW / liveH : layer.aspectRatio;
                      const canvasPortrait = outputHeight > outputWidth;
                      const sourcePortrait = baseAr < 1;
                      const needRotate = canvasPortrait !== sourcePortrait;
                      const ar = needRotate ? 1 / baseAr : baseAr;
                      const fitW = Math.min(outputWidth, outputHeight * ar);
                      const fitH = fitW / ar;
                      onLayerUpdate(layer.id, {
                        x: Math.round((outputWidth - fitW) / 2),
                        y: Math.round((outputHeight - fitH) / 2),
                        width: Math.round(fitW),
                        height: Math.round(fitH),
                        aspectRatio: ar,
                        sourceRotation: needRotate ? 90 : layer.sourceRotation,
                        displayMode: 'max',
                        restoreGeometry: restore,
                      });
                    }}
                  >
                    {layer.displayMode === 'max' ? (
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <polyline points="4 14 10 14 10 20" />
                        <polyline points="20 10 14 10 14 4" />
                        <line x1="14" y1="10" x2="21" y2="3" />
                        <line x1="3" y1="21" x2="10" y2="14" />
                      </svg>
                    ) : (
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <polyline points="15 3 21 3 21 9" />
                        <polyline points="9 21 3 21 3 15" />
                        <line x1="21" y1="3" x2="14" y2="10" />
                        <line x1="3" y1="21" x2="10" y2="14" />
                      </svg>
                    )}
                  </button>
                  <button
                    className="livestream-compositor__layer-btn"
                    title={__('Minimize to taskbar')}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      onLayerUpdate(layer.id, {
                        minimized: true,
                        visible: false,
                      });
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="4" y1="20" x2="20" y2="20" />
                    </svg>
                  </button>
                  <button
                    className={classnames('livestream-compositor__layer-btn', {
                      'livestream-compositor__layer-btn--locked': layer.locked,
                    })}
                    title={layer.locked ? __('Unlock') : __('Lock')}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      onLayerUpdate(layer.id, { locked: !layer.locked });
                    }}
                  >
                    {layer.locked ? (
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    ) : (
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                      </svg>
                    )}
                  </button>
                  <button
                    className="livestream-compositor__layer-btn livestream-compositor__layer-btn--close"
                    title={__('Remove')}
                    onPointerDown={(e) => {
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
                !layer.locked &&
                CORNER_HANDLES.map((handle) => {
                  const style: React.CSSProperties = { cursor: getHandleCursor(handle) };
                  if (handle.includes('n')) style.top = -HANDLE_SIZE / 2;
                  if (handle.includes('s')) style.bottom = -HANDLE_SIZE / 2;
                  if (handle.includes('w')) style.left = -HANDLE_SIZE / 2;
                  if (handle.includes('e')) style.right = -HANDLE_SIZE / 2;
                  return <div key={handle} className="livestream-compositor__handle" style={style} />;
                })}
              {isSelected &&
                !layer.locked &&
                layer.freeAspect &&
                EDGE_HANDLES.map((handle) => {
                  const style: React.CSSProperties = { cursor: getHandleCursor(handle), position: 'absolute' };
                  if (handle === 'n') {
                    style.top = -EDGE_HIT_SIZE / 2;
                    style.left = HANDLE_SIZE;
                    style.right = HANDLE_SIZE;
                    style.height = EDGE_HIT_SIZE;
                  } else if (handle === 's') {
                    style.bottom = -EDGE_HIT_SIZE / 2;
                    style.left = HANDLE_SIZE;
                    style.right = HANDLE_SIZE;
                    style.height = EDGE_HIT_SIZE;
                  } else if (handle === 'w') {
                    style.left = -EDGE_HIT_SIZE / 2;
                    style.top = HANDLE_SIZE;
                    style.bottom = HANDLE_SIZE;
                    style.width = EDGE_HIT_SIZE;
                  } else if (handle === 'e') {
                    style.right = -EDGE_HIT_SIZE / 2;
                    style.top = HANDLE_SIZE;
                    style.bottom = HANDLE_SIZE;
                    style.width = EDGE_HIT_SIZE;
                  }
                  return <div key={handle} className="livestream-compositor__edge-handle" style={style} />;
                })}
            </div>
          );
        })}

      {layers.length === 0 && <div className="livestream-compositor__empty">{__('Select sources from the panel')}</div>}
    </div>
  );
}
