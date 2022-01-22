'use strict';

import React, { useState } from 'react';
import reactCSS from 'reactcss';
import { SketchPicker } from 'react-color';

// type Props = {};

// function ColorPicker(props: Props) {
function ColorPicker() {
  const [color, setColor] = useState('00ff00');
  const [displayColorPicker, toggleDisplayColorPicker] = useState(false);

  var state = {
    displayColorPicker: false,
    color: {
      r: '241',
      g: '112',
      b: '19',
      a: '1',
    },
  };

  const styles = reactCSS({
    default: {
      color: {
        background: `rgba(${state.color.r}, ${state.color.g}, ${state.color.b}, ${state.color.a})`,
      },
    },
  });

  if (document.documentElement !== null) {
    let primary = getComputedStyle(document.documentElement).getPropertyValue('--color-primary');
    console.log('Primary: ', primary);
    console.log('Primary HEX: ', rgba2hex(primary));
  }

  function rgba2hex(orig) {
    var rgb = orig.replace(/\s/g, '').match(/^rgba?\((\d+),(\d+),(\d+),?([^,\s)]+)?/i);
    console.log('RGB: ', rgb);
    var hex = rgb
      ? (rgb[1] | (1 << 8)).toString(16).slice(1) +
        (rgb[2] | (1 << 8)).toString(16).slice(1) +
        (rgb[3] | (1 << 8)).toString(16).slice(1)
      : orig;

    return hex;
  }

  function handleChange(color) {
    setColor(color.hex);
  }

  return (
    <div className="color-picker">
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
