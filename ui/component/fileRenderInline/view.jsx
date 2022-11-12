// @flow
import React, { useEffect } from 'react';
import FileRender from 'component/fileRender';
import LoadingScreen from 'component/common/loading-screen';
import { NON_STREAM_MODES } from 'constants/file_render_modes';

type Props = {
  isPlaying: boolean,
  fileInfo: FileListItem,
  uri: string,
  renderMode: string,
  streamingUrl?: string,
  triggerAnalyticsView: (string) => Promise<any>,
  claimRewards: () => void,
  claimIsMine: boolean,
  costInfo: any,
  sdkPaid: boolean,
  contentRestrictedFromUser: boolean,
  isFiatRequired: boolean,
  isFiatPaid: ?boolean,
};

export default function FileRenderInline(props: Props) {
  const {
    claimRewards,
    sdkPaid,
    claimIsMine,
    costInfo,
    fileInfo,
    isPlaying,
    renderMode,
    streamingUrl,
    triggerAnalyticsView,
    uri,
    contentRestrictedFromUser,
    isFiatRequired,
    isFiatPaid,
  } = props;

  const isSdkFree = !costInfo || (costInfo.cost !== undefined && costInfo.cost === 0);
  const isPaymentCleared = claimIsMine || ((isSdkFree || sdkPaid) && (!isFiatRequired || isFiatPaid));

  const isReadyToView = fileInfo && fileInfo.completed;
  const isReadyToPlay = streamingUrl || isReadyToView;

  // Render if any source is ready
  let renderContent = isReadyToPlay;

  // Force non-streaming content to wait for download
  if (NON_STREAM_MODES.includes(renderMode)) {
    renderContent = isReadyToView;
  }

  useEffect(() => {
    /*
    note: code can currently double fire with videoViewer logic if a video is rendered by FileRenderInline (currently this never happens)
     */
    if (isPlaying) {
      triggerAnalyticsView(uri).then(claimRewards);
    }
  }, [claimRewards, isPlaying, triggerAnalyticsView, uri]);

  if (!isPlaying || !isPaymentCleared || contentRestrictedFromUser) {
    return null;
  }

  return renderContent ? <FileRender uri={uri} /> : <LoadingScreen isDocument />;
}
