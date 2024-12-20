// @flow
const VideoJsFunctions = ({ isAudio }: { isAudio: boolean }) => {
  // Create the video DOM element and wrapper
  function createVideoPlayerDOM(container: any) {
    if (!container) return;

    // Prevent multiple wrappers
    if (container.querySelector('[data-vjs-player]')) {
      return container.querySelector('video');
    }

    const wrapper = document.createElement('div');
    wrapper.setAttribute('data-vjs-player', 'true');
    const el = document.createElement('video');
    el.className = 'video-js vjs-big-play-centered ';
    wrapper.appendChild(el);

    container.appendChild(wrapper);

    return el;
  }

  return {
    createVideoPlayerDOM,
  };
};

export default VideoJsFunctions;
