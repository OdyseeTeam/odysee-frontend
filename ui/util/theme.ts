interface RGB {
  r: number;
  g: number;
  b: number;
}

export function changeColor(rgb: RGB): void {
  setPrimaryColor(rgb);
  setSecondaryColor(rgb);
}
export function getPrimaryColor(): string {
  return getComputedStyle(document.documentElement).getPropertyValue('--color-primary');
}
export function resetColors(odysee: boolean = false): void {
  if (odysee) {
    document.documentElement !== null &&
      document.documentElement.style.setProperty('--color-primary-dynamic', 'var(--color-primary-static)');
    document.documentElement !== null &&
      document.documentElement.style.setProperty('--color-primary-contrast', 'var(--color-primary-contrast-static)');
    document.documentElement !== null &&
      document.documentElement.style.setProperty('--color-secondary-dynamic', 'var(--color-secondary-static)');
    document.documentElement !== null &&
      document.documentElement.style.setProperty(
        '--color-secondary-contrast',
        'var(--color-secondary-contrast-static)'
      );
    document.documentElement !== null &&
      document.documentElement.style.setProperty('--color-link', 'var(--color-primary)');
  }
}

function setPrimaryColor(rgb: RGB): void {
  document.documentElement !== null &&
    document.documentElement.style.setProperty('--color-primary-dynamic', rgb.r + ',' + rgb.g + ',' + rgb.b);
  document.documentElement !== null &&
    document.documentElement.style.setProperty(
      '--color-primary-contrast',
      getBrightness(rgb) > 155 ? 'black' : 'white'
    );
}

function setSecondaryColor(rgb: RGB): void {
  var threshold = 155;

  if (document.documentElement !== null) {
    threshold = getComputedStyle(document.documentElement).getPropertyValue('--color-text') === ' #000000' ? 70 : 155;
  }

  rgb = colorMixer(
    rgb,
    getBrightness(rgb) > threshold
      ? {
          r: 0,
          g: 0,
          b: 0,
        }
      : {
          r: 255,
          g: 255,
          b: 255,
        },
    0.6
  );
  document.documentElement !== null &&
    document.documentElement.style.setProperty('--color-secondary-dynamic', rgb.r + ',' + rgb.g + ',' + rgb.b);
  document.documentElement !== null &&
    document.documentElement.style.setProperty(
      '--color-secondary-contrast',
      getBrightness(rgb) > 155 ? 'black' : 'white'
    );
}

function getBrightness(rgb: RGB): number {
  return Math.round((parseInt(String(rgb.r)) * 299 + parseInt(String(rgb.g)) * 587 + parseInt(String(rgb.b)) * 114) / 1000);
}

function colorMixer(rgbA: RGB, rgbB: RGB, mix: number): RGB {
  let r = colorChannelMixer(rgbA.r, rgbB.r, mix);
  let g = colorChannelMixer(rgbA.g, rgbB.g, mix);
  let b = colorChannelMixer(rgbA.b, rgbB.b, mix);
  return {
    r: r,
    g: g,
    b: b,
  };
}

function colorChannelMixer(a: number, b: number, mix: number): number {
  let channelA = a * mix;
  let channelB = b * (1 - mix);
  return parseInt(String(channelA + channelB));
}
