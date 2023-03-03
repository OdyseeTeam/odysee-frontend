// @flow
import videojs from 'video.js';
import type { Player } from '../../videojs';

const VERSION = '1.0.0';
const defaultOptions = {};

type Options = {
  fileTitle: string,
};

class SnapshotButton extends videojs.getComponent('Button') {
  constructor(player: Player, options: Options) {
    super(player, options);
    this.controlText('Take A Snapshot');
    this.addClass('vjs-snapshot-button');
    this.el_.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">' +
      '<path d="M149.1 64.8L138.7 96H64C28.7 96 0 124.7 0 160V416c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7' +
      ' 64-64V160c0-35.3-28.7-64-64-64H373.3L362.9 64.8C356.4 45.2 338.1 32 317.4 32H194.6c-20.7 0-39 13.' +
      '2-45.5 32.8zM256 384c-53 0-96-43-96-96s43-96 96-96s96 43 96 96s-43 96-96 96z"/></svg>';
  }

  handleClick() {
    const link = document.createElement('a');
    const video = document.querySelector('video.vjs-tech');

    const width = this.player().videoWidth();
    const height = this.player().videoHeight();

    const canvas = Object.assign(document.createElement('canvas'), { width, height });
    if (!video) return;
    // $FlowIgnore
    canvas.getContext('2d').drawImage(video, 0, 0, width, height);

    link.href = canvas.toDataURL('image/jpeg');

    link.download =
      this.options_.fileTitle
        .replace(/[^\p{L}\p{N}\p{P}\p{Z}^$\n]/gu, '')
        .replace(/\s+$/, '')
        .replace(/\.$/, '') + '.jpg';

    link.click();

    link.remove();
    canvas.remove();
  }
}

function onPlayerReady(player: Player, options: Options) {
  videojs.registerComponent('snapshotButton', SnapshotButton);
  let snapshotButton = player.getChild('snapshotButton');
  if (!snapshotButton) {
    // $FlowIgnore
    snapshotButton = player.addChild('snapshotButton', options);
    player.one('canplay', function () {
      if (player.getChild && typeof player.getChild === 'function') {
        const controlBar = player.getChild('controlBar');
        if (controlBar.getChild && typeof controlBar.getChild === 'function') {
          controlBar.removeChild(snapshotButton);
          controlBar.addChild(snapshotButton, {});
        }
      }
    });
  }
}

function snapshotButton(options: Options) {
  // needed for canvas to work with cors
  this.el().childNodes[0].setAttribute('crossorigin', 'anonymous');
  const IS_MOBILE = videojs.browser.IS_ANDROID || videojs.browser.IS_IOS;

  // add this flag
  if (this.snapshotButtonAdded) {
    return;
  }
  this.snapshotButtonAdded = true;

  if (!IS_MOBILE) {
    this.ready(() => onPlayerReady(this, Object.assign({}, defaultOptions, options)));
  }
}

videojs.registerPlugin('snapshotButton', snapshotButton);
snapshotButton.VERSION = VERSION;

export default snapshotButton;
