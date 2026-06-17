import React from 'react';
import classnames from 'classnames';
// @ts-ignore
import { CustomPicker } from 'react-color';
// @ts-ignore
import { Saturation, Hue, EditableInput } from 'react-color/lib/components/common';
import type { CompositorLayer } from 'component/livestreamCompositor/view';
import './style.scss';

type Props = {
  layer: CompositorLayer;
  onUpdate: (updates: Partial<CompositorLayer>) => void;
};

function hexByte(n: number) {
  return n.toString(16).padStart(2, '0');
}

const MiniPickerInner = (props: any) => {
  const hex = (props.hex || '').replace(/^#/, '').toUpperCase();
  return (
    <div className="livestream-settings__minipicker">
      <div className="livestream-settings__minipicker-saturation">
        <Saturation {...props} />
      </div>
      <div className="livestream-settings__minipicker-hue">
        <Hue {...props} />
      </div>
      <div className="livestream-settings__minipicker-hex">
        <span className="livestream-settings__minipicker-hex-prefix">#</span>
        <EditableInput
          value={hex}
          onChange={(data: any) => {
            const next = typeof data === 'string' ? data : data?.hex;
            if (typeof next === 'string' && /^[0-9a-fA-F]{6}$/.test(next)) {
              props.onChange({ hex: '#' + next, source: 'hex' });
            }
          }}
        />
      </div>
    </div>
  );
};
const MiniPicker = CustomPicker(MiniPickerInner);

const MiniPickerWithAlphaInner = (props: any) => {
  const hex = (props.hex || '').replace(/^#/, '').toUpperCase();
  const alpha = props.alpha ?? 1;
  return (
    <div className="livestream-settings__minipicker">
      <div className="livestream-settings__minipicker-saturation">
        <Saturation {...props} />
      </div>
      <div className="livestream-settings__minipicker-hue">
        <Hue {...props} />
      </div>
      <div className="livestream-settings__minipicker-hex">
        <span className="livestream-settings__minipicker-hex-prefix">#</span>
        <EditableInput
          value={hex}
          onChange={(data: any) => {
            const next = typeof data === 'string' ? data : data?.hex;
            if (typeof next === 'string' && /^[0-9a-fA-F]{6}$/.test(next)) {
              props.onChange({ hex: '#' + next, source: 'hex' });
            }
          }}
        />
      </div>
      <div className="livestream-settings__minipicker-alpha">
        <span className="livestream-settings__minipicker-alpha-label">{__('Opacity')}</span>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(alpha * 100)}
          onChange={(e) => props.onAlphaChange?.(Number(e.target.value) / 100)}
        />
        <span className="livestream-settings__minipicker-alpha-value">{Math.round(alpha * 100)}%</span>
      </div>
    </div>
  );
};
const MiniPickerWithAlpha = CustomPicker(MiniPickerWithAlphaInner);

function ColorSwatch({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div className="livestream-settings__color-wrap" ref={containerRef}>
      <button
        type="button"
        className="livestream-settings__color"
        style={{ background: value }}
        onClick={() => setOpen((v) => !v)}
      />
      {open && (
        <div className="livestream-settings__color-popover">
          <MiniPicker color={value} onChange={(c: any) => onChange(c.hex)} />
        </div>
      )}
    </div>
  );
}

function BgColorSwatch({
  hex,
  alpha,
  onChange,
}: {
  hex: string;
  alpha: number;
  onChange: (hex: string, alpha: number) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const swatchBg =
    alpha <= 0.01
      ? 'repeating-conic-gradient(#888 0% 25%, #ccc 0% 50%) 50% / 8px 8px'
      : `rgba(${r}, ${g}, ${b}, ${alpha})`;

  return (
    <div className="livestream-settings__color-wrap" ref={containerRef}>
      <button
        type="button"
        className="livestream-settings__color"
        style={{ background: swatchBg }}
        onClick={() => setOpen((v) => !v)}
      />
      {open && (
        <div className="livestream-settings__color-popover">
          <MiniPickerWithAlpha
            color={hex}
            alpha={alpha}
            onChange={(c: any) => onChange(c.hex, alpha)}
            onAlphaChange={(a: number) => onChange(hex, a)}
          />
        </div>
      )}
    </div>
  );
}

function getPrimaryHex() {
  if (typeof document === 'undefined') return '#de0050';
  const dyn = getComputedStyle(document.documentElement).getPropertyValue('--color-primary-dynamic').trim();
  if (!dyn) return '#de0050';
  const [r, g, b] = dyn.split(',').map((n) => parseInt(n.trim(), 10));
  if ([r, g, b].some((n) => Number.isNaN(n))) return '#de0050';
  return `#${hexByte(r)}${hexByte(g)}${hexByte(b)}`;
}

export default function LivestreamSourceSettings(props: Props) {
  const { layer, onUpdate } = props;

  function handleSlider(key: keyof CompositorLayer, value: number) {
    onUpdate({ [key]: value } as any);
  }

  return (
    <div className="livestream-settings">
      <div className="livestream-settings__box">
        <h3 className="livestream-settings__title">{__('Appearance')}</h3>

        <label className="livestream-settings__row">
          <div className="livestream-settings__row-header">
            <span className="livestream-settings__label">{__('Border Radius')}</span>
            <span className="livestream-settings__value">{layer.borderRadius ?? 0}px</span>
          </div>
          <input
            type="range"
            min={0}
            max={2000}
            value={layer.borderRadius ?? 0}
            onChange={(e) => handleSlider('borderRadius', Number(e.target.value))}
            className="livestream-settings__slider"
          />
        </label>

        <label className="livestream-settings__row">
          <div className="livestream-settings__row-header">
            <span className="livestream-settings__label">{__('Opacity')}</span>
            <span className="livestream-settings__value">{Math.round((layer.opacity ?? 1) * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round((layer.opacity ?? 1) * 100)}
            onChange={(e) => onUpdate({ opacity: Number(e.target.value) / 100 })}
            className="livestream-settings__slider"
          />
        </label>
      </div>

      {layer.id === '__widget_chat__' ? (
        <div className="livestream-settings__box livestream-settings__box--chat">
          <h3 className="livestream-settings__title">{__('Chat')}</h3>

          <label className="livestream-settings__row">
            <div className="livestream-settings__row-header">
              <span className="livestream-settings__label">{__('Font Size')}</span>
              <span className="livestream-settings__value">{layer.chatFontSize ?? 20}px</span>
            </div>
            <input
              type="range"
              min={10}
              max={60}
              value={layer.chatFontSize ?? 20}
              onChange={(e) => handleSlider('chatFontSize', Number(e.target.value))}
              className="livestream-settings__slider"
            />
          </label>

          <label className="livestream-settings__row">
            <div className="livestream-settings__row-header">
              <span className="livestream-settings__label">{__('Line Height')}</span>
              <span className="livestream-settings__value">{(layer.chatLineHeight ?? 1.4).toFixed(1)}</span>
            </div>
            <input
              type="range"
              min={10}
              max={30}
              value={Math.round((layer.chatLineHeight ?? 1.4) * 10)}
              onChange={(e) => onUpdate({ chatLineHeight: Number(e.target.value) / 10 })}
              className="livestream-settings__slider"
            />
          </label>

          <label className="livestream-settings__row">
            <div className="livestream-settings__row-header">
              <span className="livestream-settings__label">{__('Text Border')}</span>
              <span className="livestream-settings__value">{layer.chatBorderWidth ?? 1}px</span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              value={layer.chatBorderWidth ?? 1}
              onChange={(e) => handleSlider('chatBorderWidth', Number(e.target.value))}
              className="livestream-settings__slider"
            />
          </label>

          <label className="livestream-settings__row">
            <div className="livestream-settings__row-header">
              <span className="livestream-settings__label">{__('Max Messages')}</span>
              <span className="livestream-settings__value">{layer.chatMaxMessages ?? 30}</span>
            </div>
            <input
              type="range"
              min={1}
              max={50}
              value={layer.chatMaxMessages ?? 30}
              onChange={(e) => handleSlider('chatMaxMessages', Number(e.target.value))}
              className="livestream-settings__slider"
            />
          </label>

          <div className="livestream-settings__row livestream-settings__row--inline">
            <span className="livestream-settings__label">{__('Text Color')}</span>
            <ColorSwatch
              value={layer.chatTextColor ?? '#ffffff'}
              onChange={(hex) => onUpdate({ chatTextColor: hex })}
            />
          </div>

          <div className="livestream-settings__row livestream-settings__row--inline">
            <span className="livestream-settings__label">{__('Username Color')}</span>
            <ColorSwatch
              value={layer.chatUserColor ?? getPrimaryHex()}
              onChange={(hex) => onUpdate({ chatUserColor: hex })}
            />
          </div>

          <div className="livestream-settings__row livestream-settings__row--inline">
            <span className="livestream-settings__label">{__('Background Color')}</span>
            <BgColorSwatch
              hex={layer.chatBgColor ?? '#000000'}
              alpha={layer.chatBgAlpha ?? (layer.chatBgTransparent === false ? 1 : 0)}
              onChange={(hex, alpha) =>
                onUpdate({ chatBgColor: hex, chatBgAlpha: alpha, chatBgTransparent: alpha <= 0.01 })
              }
            />
          </div>

          <div className="livestream-settings__row livestream-settings__row--inline">
            <span className="livestream-settings__label">{__('Border Color')}</span>
            <ColorSwatch
              value={layer.chatBorderColor ?? '#000000'}
              onChange={(hex) => onUpdate({ chatBorderColor: hex })}
            />
          </div>

          <div className="livestream-settings__row livestream-settings__row--toggle">
            <span className="livestream-settings__label">{__('New messages on top')}</span>
            <button
              type="button"
              className={classnames('livestream-settings__toggle', {
                'livestream-settings__toggle--on': layer.chatNewOnTop,
              })}
              onClick={() => onUpdate({ chatNewOnTop: !layer.chatNewOnTop })}
              aria-pressed={layer.chatNewOnTop ?? false}
            >
              <span className="livestream-settings__toggle-knob" />
            </button>
          </div>

          <div className="livestream-settings__row livestream-settings__row--toggle">
            <span className="livestream-settings__label">{__('Show avatars')}</span>
            <button
              type="button"
              className={classnames('livestream-settings__toggle', {
                'livestream-settings__toggle--on': layer.chatShowAvatars,
              })}
              onClick={() => onUpdate({ chatShowAvatars: !layer.chatShowAvatars })}
              aria-pressed={layer.chatShowAvatars ?? false}
            >
              <span className="livestream-settings__toggle-knob" />
            </button>
          </div>

          <div className="livestream-settings__row livestream-settings__row--toggle">
            <span className="livestream-settings__label">{__('Hyperchats only')}</span>
            <button
              type="button"
              className={classnames('livestream-settings__toggle', {
                'livestream-settings__toggle--on': layer.chatHyperchatOnly,
              })}
              onClick={() => onUpdate({ chatHyperchatOnly: !layer.chatHyperchatOnly })}
              aria-pressed={layer.chatHyperchatOnly ?? false}
            >
              <span className="livestream-settings__toggle-knob" />
            </button>
          </div>
        </div>
      ) : (
        <div className="livestream-settings__box">
          <h3 className="livestream-settings__title">{__('Color')}</h3>

          <label className="livestream-settings__row">
            <div className="livestream-settings__row-header">
              <span className="livestream-settings__label">{__('Brightness')}</span>
              <span className="livestream-settings__value">{layer.brightness ?? 100}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={200}
              value={layer.brightness ?? 100}
              onChange={(e) => handleSlider('brightness', Number(e.target.value))}
              className="livestream-settings__slider"
            />
          </label>

          <label className="livestream-settings__row">
            <div className="livestream-settings__row-header">
              <span className="livestream-settings__label">{__('Contrast')}</span>
              <span className="livestream-settings__value">{layer.contrast ?? 100}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={200}
              value={layer.contrast ?? 100}
              onChange={(e) => handleSlider('contrast', Number(e.target.value))}
              className="livestream-settings__slider"
            />
          </label>

          <label className="livestream-settings__row">
            <div className="livestream-settings__row-header">
              <span className="livestream-settings__label">{__('Saturation')}</span>
              <span className="livestream-settings__value">{layer.saturation ?? 100}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={200}
              value={layer.saturation ?? 100}
              onChange={(e) => handleSlider('saturation', Number(e.target.value))}
              className="livestream-settings__slider"
            />
          </label>

          {(() => {
            const ck = layer.chromaKey ?? { enabled: false, color: '#00FF00', threshold: 0.4, smoothness: 0.1 };
            return (
              <>
                <div className="livestream-settings__row livestream-settings__row--toggle">
                  <span className="livestream-settings__label">{__('Greenscreen')}</span>
                  <button
                    type="button"
                    className={classnames('livestream-settings__toggle', {
                      'livestream-settings__toggle--on': ck.enabled,
                    })}
                    onClick={() => onUpdate({ chromaKey: { ...ck, enabled: !ck.enabled } })}
                    aria-pressed={ck.enabled}
                  >
                    <span className="livestream-settings__toggle-knob" />
                  </button>
                </div>

                {ck.enabled && (
                  <>
                    <div className="livestream-settings__row">
                      <div className="livestream-settings__row-header">
                        <span className="livestream-settings__label">{__('Key Color')}</span>
                      </div>
                      <ColorSwatch
                        value={ck.color}
                        onChange={(hex) => onUpdate({ chromaKey: { ...ck, color: hex } })}
                      />
                    </div>

                    <label className="livestream-settings__row">
                      <div className="livestream-settings__row-header">
                        <span className="livestream-settings__label">{__('Threshold')}</span>
                        <span className="livestream-settings__value">{Math.round(ck.threshold * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={Math.round(ck.threshold * 100)}
                        onChange={(e) => onUpdate({ chromaKey: { ...ck, threshold: Number(e.target.value) / 100 } })}
                        className="livestream-settings__slider"
                      />
                    </label>

                    <label className="livestream-settings__row">
                      <div className="livestream-settings__row-header">
                        <span className="livestream-settings__label">{__('Smoothness')}</span>
                        <span className="livestream-settings__value">{Math.round(ck.smoothness * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={Math.round(ck.smoothness * 100)}
                        onChange={(e) => onUpdate({ chromaKey: { ...ck, smoothness: Number(e.target.value) / 100 } })}
                        className="livestream-settings__slider"
                      />
                    </label>
                  </>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
