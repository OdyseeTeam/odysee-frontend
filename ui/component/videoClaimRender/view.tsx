import React from 'react';
import classnames from 'classnames';
import { lazyImport } from 'util/lazyImport';
import { useLocation } from 'react-router-dom';
import { useAppSelector } from 'redux/hooks';
import { selectStreamingUrlForUri } from 'redux/selectors/file_info';
import { makeSelectContentTypeForUri } from 'redux/selectors/claims';

const VideoViewer = lazyImport(
  () =>
    import(
      'component/viewers/videoViewer'
      /* webpackChunkName: "videoViewer" */
    )
);
type Props = {
  uri: string;
  className?: string;
  embedded?: boolean;
  streamClaim: () => void;
  isShortsContext?: boolean;
  isFloatingContext?: boolean;
};

const VideoRender = (props: Props) => {
  const { uri, className, embedded, streamClaim, isShortsContext, isFloatingContext } = props;
  const streamingUrl = useAppSelector((state) => selectStreamingUrlForUri(state, uri));
  const contentType = useAppSelector((state) => makeSelectContentTypeForUri(uri)(state));
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
      <React.Suspense fallback={null}>
        <VideoViewer
          uri={uri}
          source={streamingUrl}
          contentType={contentType}
          streamClaim={streamClaim}
          embedded={embedded}
        />
      </React.Suspense>
    </div>
  );
};

export default VideoRender;
