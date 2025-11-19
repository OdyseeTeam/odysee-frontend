// @flow
import videojs from 'video.js';
import type { Player } from '../../videojs';

const VERSION = '1.0.0';
const defaultOptions = {};

type Options = {
  fileTitle: string,
};

function onPlayerReady(player: Player, options: Options) {
  console.log('onPlayerReady called');
  const button = videojs.getComponent('Button');
  const snapshotButton = videojs.extend(button, {
    constructor: function () {
      button.apply(this, arguments);
      this.controlText(__('Take snapshot'));
      this.addClass('vjs-snapshot-button');
      this.el_.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">' +
        '<path d="M149.1 64.8L138.7 96H64C28.7 96 0 124.7 0 160V416c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7' +
        ' 64-64V160c0-35.3-28.7-64-64-64H373.3L362.9 64.8C356.4 45.2 338.1 32 317.4 32H194.6c-20.7 0-39 13.' +
        '2-45.5 32.8zM256 384c-53 0-96-43-96-96s43-96 96-96s96 43 96 96s-43 96-96 96z"/></svg>';

      // We'll be using the menu version for now.
      // If we want both Menu and Button, factor out the common logic.
      // If we just want the Menu version, move logic over and delete this plugin.
      // TODO: For now, this plugin stays alive so that the Menu version
      // can trigger a click event programmatically.
      this.hide();
    },
    handleClick: function () {
      console.log('Snapshot button clicked');
      const video = document.querySelector('video.vjs-tech');

      if (!video) {
        console.error('Video element not found');
        alert('Error: Video element not found');
        return;
      }

      const width = player.videoWidth();
      const height = player.videoHeight();

      console.log('Video dimensions:', width, height);

      const canvas = Object.assign(document.createElement('canvas'), { width, height });
      canvas.getContext('2d').drawImage(video, 0, 0, width, height);

      // strip emojis
      const filename =
        options.fileTitle
          .replace(/[^\p{L}\p{N}\p{P}\p{Z}^$\n]/gu, '')
          .replace(/\s+$/, '')
          .replace(/\.$/, '') + '.jpg';

      console.log('Generating snapshot:', filename);

      canvas.toBlob((blob) => {
        if (!blob) {
          console.error('Failed to create blob');
          alert('Error: Failed to create image');
          return;
        }

        console.log('Blob created, size:', blob.size);

        if (!window.resolveLocalFileSystemURL) {
          console.error('Cordova File plugin not available');
          alert('Error: File plugin not available');
          return;
        }

        const targetDir = cordova.file.externalDataDirectory || cordova.file.dataDirectory;
        console.log('Target directory:', targetDir);

        window.resolveLocalFileSystemURL(
          targetDir,
          (dirEntry) => {
            console.log('Directory entry:', dirEntry);
            dirEntry.getFile(
              filename,
              { create: true, exclusive: false },
              (fileEntry) => {
                console.log('File entry:', fileEntry);
                fileEntry.createWriter(
                  (fileWriter) => {
                    fileWriter.onwriteend = () => {
                      console.log('Snapshot saved to:', fileEntry.nativeURL);
                      alert(`Snapshot saved successfully!`);
                    };
                    fileWriter.onerror = (e) => {
                      console.error('Write error:', e);
                      alert('Error writing file: ' + JSON.stringify(e));
                    };
                    fileWriter.write(blob);
                  },
                  (e) => {
                    console.error('Create writer error:', e);
                    alert('Error creating writer: ' + JSON.stringify(e));
                  }
                );
              },
              (e) => {
                console.error('Get file error:', e);
                alert('Error getting file: ' + JSON.stringify(e));
              }
            );
          },
          (e) => {
            console.error('Resolve URL error:', e);
            alert('Error accessing directory: ' + JSON.stringify(e));
          }
        );
      }, 'image/jpeg');

      canvas.remove();
    },
  });
  videojs.registerComponent('snapshotButton', snapshotButton);
  console.log('snapshotButton component registered');

  player.one('canplay', function () {
    console.log('canplay event - adding snapshotButton to control bar');
    player.getChild('controlBar').removeChild('snapshotButton');
    player.getChild('controlBar').addChild('snapshotButton', {});
    console.log('snapshotButton added to control bar');
  });
}

function snapshotButton(options: Options) {
  console.log('snapshotButton plugin initializing');
  // needed for canvas to work with cors
  // $FlowFixMe
  this.el().childNodes[0].setAttribute('crossorigin', 'anonymous');

  const IS_MOBILE = videojs.browser.IS_ANDROID || videojs.browser.IS_IOS;
  console.log('IS_MOBILE:', IS_MOBILE, 'window.cordova:', window.cordova);
  if (!IS_MOBILE || window.cordova) {
    console.log('Calling onPlayerReady');
    this.ready(() => onPlayerReady(this, videojs.mergeOptions(defaultOptions, options)));
  } else {
    console.log('Skipping onPlayerReady - mobile and not cordova');
  }
}

videojs.registerPlugin('snapshotButton', snapshotButton);
snapshotButton.VERSION = VERSION;

export default snapshotButton;
