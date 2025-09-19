// @flow
import React from 'react';
import classnames from 'classnames';
import VideoViewer from 'component/viewers/videoViewer';
import { useHistory } from 'react-router';

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

  const {
    location: { search },
  } = useHistory();

  const urlParams = new URLSearchParams(search);
  const isShortsParam = urlParams.get('view') === 'shorts';

  return (
    <div
      className={classnames(
        {
          'file-render': !isShortsParam,
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
