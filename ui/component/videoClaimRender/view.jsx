// @flow
import React from 'react';
import classnames from 'classnames';
import VideoViewer from 'component/viewers/videoViewer';

type Props = {
  uri: string,
  className?: string,
  embedded?: boolean,
  streamClaim: () => void,
  // -- redux --
  streamingUrl: string,
  contentType: string,
};

const VideoRender = (props: Props) => {
  const { uri, className, streamingUrl, contentType, embedded, streamClaim } = props;

  return (
    <div className={classnames('file-render file-render--video', className, { 'file-render--embed': embedded })}>
      <VideoViewer uri={uri} source={streamingUrl} contentType={contentType} streamClaim={streamClaim} />
    </div>
  );
};

export default VideoRender;
