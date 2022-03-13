// @flow
const VideoJsFunctions = ({ isAudio }: { isAudio: boolean }) => {
  // TODO: can remove this function as well
  // Create the video DOM element and wrapper
  function createVideoPlayerDOM(container: any) {
    if (!container) return;

    // This seems like a poor way to generate the DOM for video.js
    const wrapper = document.createElement('div');
    wrapper.setAttribute('data-vjs-player', 'true');
    const el = document.createElement(isAudio ? 'audio' : 'video');
    el.className = 'video-js vjs-big-play-centered ';
    el.poster =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAABhGlDQ1BJQ0MgcHJvZmlsZQAAKJF9kT1Iw0AcxV9TpaIVQTtIcchQnSyIijhqFYpQIdQKrTqYXPohNGlIUlwcBdeCgx+LVQcXZ10dXAVB8APE0clJ0UVK/F9SaBHjwXE/3t173L0DhHqZaVbHGKDptplOJsRsbkUMvUJAFD3oR0hmljErSSn4jq97BPh6F+dZ/uf+HL1q3mJAQCSeYYZpE68TT23aBud94ggrySrxOfGoSRckfuS64vEb56LLAs+MmJn0HHGEWCy2sdLGrGRqxJPEMVXTKV/Ieqxy3uKslauseU/+wnBeX17iOs0hJLGARUgQoaCKDZRhI06rToqFNO0nfPxR1y+RSyHXBhg55lGBBtn1g//B726twsS4lxROAJ0vjvMxDIR2gUbNcb6PHadxAgSfgSu95a/UgelP0mstLXYE9G0DF9ctTdkDLneAwSdDNmVXCtIUCgXg/Yy+KQcM3ALdq15vzX2cPgAZ6ip1AxwcAiNFyl7zeXdXe2//nmn29wMPaXJ/FpFKzAAAAAlwSFlzAAAuIwAALiMBeKU/dgAAAAd0SU1FB+YCGgsSJu8BrGsAAAAZdEVYdENvbW1lbnQAQ3JlYXRlZCB3aXRoIEdJTVBXgQ4XAAAADElEQVQI12NgYGAAAAAEAAEnNCcKAAAAAElFTkSuQmCC';
    wrapper.appendChild(el);

    container.appendChild(wrapper);

    return el;
  }

  return {
    createVideoPlayerDOM,
  };
};

export default VideoJsFunctions;
