'use strict';

import React, { useState } from 'react';
import reactCSS from 'reactcss';
import { SketchPicker } from 'react-color';

// type Props = {};

// function ColorPicker(props: Props) {
function ColorPicker() {
  const [displayColorPicker, toggleDisplayColorPicker] = useState(false);
  let dynamic = getComputedStyle(document.documentElement).getPropertyValue('--color-primary');
  var rgb = dynamic.replace(/\s/g, '').match(/^rgba?\((\d+),(\d+),(\d+),?([^,\s)]+)?/i);
  var hex = rgb
    ? (rgb[1] | (1 << 8)).toString(16).slice(1) +
      (rgb[2] | (1 << 8)).toString(16).slice(1) +
      (rgb[3] | (1 << 8)).toString(16).slice(1)
    : dynamic;
  const [color, setColor] = useState({
    hex: '#' + hex,
    rgb: { r: parseInt(rgb[1]), g: parseInt(rgb[2]), b: parseInt(rgb[3]), a: 1 },
  });

  const styles = reactCSS({
    default: {
      color: {
        background: `rgba(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}, ${color.rgb.a})`,
      },
    },
  });

  function handleChange(color) {
    console.log('Color: ', color);
    setColor(color);
  }

  return (
    <div className="color-picker">
      <input value={color.hex} />
      <div className="swatch" onClick={() => toggleDisplayColorPicker(!displayColorPicker)}>
        <div className="color" style={styles.color} />
      </div>
      {displayColorPicker ? (
        <div className="popover">
          <div className="cover" onClick={() => toggleDisplayColorPicker(false)} />
          <SketchPicker color={color} onChange={handleChange} disableAlpha />
        </div>
      ) : null}
    </div>
  );
}

export default ColorPicker;
