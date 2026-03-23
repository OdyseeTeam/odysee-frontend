import React from 'react';
import VideoViewer from './view';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import withPlaybackUris from 'hocs/withPlaybackUris';

function VideoViewerWithRouteProps(props) {
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  const match = {
    params,
    path: location.pathname,
    url: location.pathname,
    isExact: true,
  };

  return React.createElement(VideoViewer, { ...props, location, match, navigate });
}

export default withPlaybackUris(VideoViewerWithRouteProps);
