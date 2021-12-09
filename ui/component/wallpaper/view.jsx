// @flow
import React from 'react';

type Props = {
  uri: ?string,
  cover: ?string,
  avatar: ?string,
  reset: ?boolean,
};

const Wallpaper = (props: Props) => {
  const { cover, avatar } = props;

  if (avatar) {
    toDataUrl(avatar, function (image) {
      if (image) {
        getAverageRGB(image);
      }
    });
  } else {
    document.documentElement !== null &&
      document.documentElement.style.setProperty('--color-primary', 'var(--color-primary-original)');
    document.documentElement !== null &&
      document.documentElement.style.setProperty('--color-primary-contrast', 'var(--color-primary-contrast-original)');
  }

  function toDataUrl(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
      var reader = new FileReader();
      reader.onloadend = function () {
        var image = new Image();
        image.src = reader.result.toString();
        image.onload = () => callback(image);
      };
      reader.readAsDataURL(xhr.response);
    };
    xhr.open('GET', url);
    xhr.responseType = 'blob';
    xhr.send();
  }

  function getAverageRGB(img) {
    var blockSize = 5,
      defaultRGB = { r: 0, g: 0, b: 0 },
      canvas = document.createElement('canvas'),
      context = canvas.getContext && canvas.getContext('2d'),
      data,
      width,
      height,
      i = -4,
      length,
      rgb = { r: 0, g: 0, b: 0 },
      count = 0;

    if (!context) {
      return defaultRGB;
    }

    height = canvas.height = img.naturalHeight || img.offsetHeight || img.height;
    width = canvas.width = img.naturalWidth || img.offsetWidth || img.width;

    context.drawImage(img, 0, 0);

    try {
      data = context.getImageData(0, 0, width, height);
    } catch (e) {
      return defaultRGB;
    }

    length = data.data.length;
    while ((i += blockSize * 4) < length) {
      if (shadeCheck(data.data, i)) {
        ++count;
        rgb.r += data.data[i];
        rgb.g += data.data[i + 1];
        rgb.b += data.data[i + 2];
      }
    }

    rgb.r = ~~(rgb.r / count);
    rgb.g = ~~(rgb.g / count);
    rgb.b = ~~(rgb.b / count);

    const brightness = Math.round((parseInt(rgb.r) * 299 + parseInt(rgb.g) * 587 + parseInt(rgb.b) * 114) / 1000);
    const text = brightness > 155 ? 'black' : 'white';

    document.documentElement !== null &&
      document.documentElement.style.setProperty(
        '--color-primary',
        'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',1)'
      );
    document.documentElement !== null && document.documentElement.style.setProperty('--color-primary-contrast', text);
  }

  function shadeCheck(data, i) {
    let white = 0;
    if (data[i] > 240) white = white + 1;
    if (data[i + 1] > 240) white = white + 1;
    if (data[i + 2] > 240) white = white + 1;
    let black = 0;
    if (data[i] < 15) black = black + 1;
    if (data[i + 1] < 15) black = black + 1;
    if (data[i + 2] < 15) black = black + 1;

    if (white > 1 || black > 1) return false;
    else return true;
  }

  if (cover) {
    return (
      cover && (
        <>
          <div className={'background-image'} style={{ backgroundImage: 'url("' + cover + '")' }} />
          <div className={'theme-dark'} />
        </>
      )
    );
  } else {
    return null;
  }
};

export default Wallpaper;
