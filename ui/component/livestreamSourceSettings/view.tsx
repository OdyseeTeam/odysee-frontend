import React from 'react';
import type { CompositorLayer } from 'component/livestreamCompositor/view';
import './style.scss';

type Props = {
  layer: CompositorLayer;
  onUpdate: (updates: Partial<CompositorLayer>) => void;
};

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
            max={200}
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
      </div>
    </div>
  );
}
