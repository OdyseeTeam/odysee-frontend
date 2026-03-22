import React from 'react';
import classnames from 'classnames';
import VideoViewer from 'component/viewers/videoViewer';
import { useLocation } from 'react-router-dom';
type Props = {
  uri: string;
  className?: string;
  embedded?: boolean;
  streamClaim: () => void;
  isShortsContext?: boolean;
  isFloatingContext?: boolean;
  // -- redux --
  streamingUrl: string;
  contentType: string;
};

const VideoRender = (props: Props) => {
  const { uri, className, streamingUrl, contentType, embedded, streamClaim, isShortsContext, isFloatingContext } =
    props;
  const { search } = useLocation();
  const urlParams = new URLSearchParams(search);
  const isShortsParam = urlParams.get('view') === 'shorts';
  const isShortsMode = typeof isShortsContext === 'boolean' ? isShortsContext : isShortsParam;
  const applyShortsVideoRenderLayout = isShortsMode && !isFloatingContext;
  return (
    <div
      className={classnames(
        {
          'file-render': !applyShortsVideoRenderLayout,
          'file-render--video': true,
          'file-render--embed': embedded,
        },
        className
      )}
    >
      <VideoViewer
        uri={uri}
        source={streamingUrl}
        contentType={contentType}
        streamClaim={streamClaim}
        embedded={embedded}
      />
    </div>
  );
};

export default VideoRender;
