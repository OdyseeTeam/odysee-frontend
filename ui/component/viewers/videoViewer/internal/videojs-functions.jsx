// @flow
const VideoJsFunctions = ({
   isAudio,
}: {
  isAudio: boolean,
}) => {
  // TODO: this function will be moved to parent component
  // TODO: and proper source will be sent when instantiating component
  async function checkIfUsingHls(source, sourceType) {
    let usingHls = false;

    const response = await fetch(source, { method: 'HEAD', cache: 'no-store' });

    if (response && response.redirected && response.url && response.url.endsWith('m3u8')) {
      source = 'application/x-mpegURL';
      sourceType = response.url;
      usingHls = true;
    }

    return {
      source,
      sourceType,
      usingHls,
    };
  }

  // TODO: can remove this function as well
  // Create the video DOM element and wrapper
  function createVideoPlayerDOM(container: any) {
    if (!container) return;

    // This seems like a poor way to generate the DOM for video.js
    const wrapper = document.createElement('div');
    wrapper.setAttribute('data-vjs-player', 'true');
    const el = document.createElement(isAudio ? 'audio' : 'video');
    el.className = 'video-js vjs-big-play-centered ';
    wrapper.appendChild(el);

    container.appendChild(wrapper);

    return el;
  }

  return {
    checkIfUsingHls,
    createVideoPlayerDOM,
  };
};

export default VideoJsFunctions;
