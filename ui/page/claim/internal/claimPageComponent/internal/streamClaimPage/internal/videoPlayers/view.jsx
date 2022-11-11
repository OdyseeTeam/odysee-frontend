// @flow
import { VIDEO_ALMOST_FINISHED_THRESHOLD } from 'constants/player';
import * as React from 'react';
import { lazyImport } from 'util/lazyImport';
import * as ICONS from 'constants/icons';
import * as DRAWERS from 'constants/drawer_types';
import * as COLLECTIONS_CONSTS from 'constants/collections';
import FileTitleSection from 'component/fileTitleSection';
import VideoClaimInitiator from 'component/videoClaimInitiator';
import RecommendedContent from 'component/recommendedContent';
import PlaylistCard from 'component/playlistCard';
import Empty from 'component/common/empty';
import SwipeableDrawer from 'component/swipeableDrawer';
import DrawerExpandButton from 'component/swipeableDrawerExpand';
import PreorderAndPurchaseContentButton from 'component/preorderAndPurchaseContentButton';
import { useIsMobile, useIsMobileLandscape, useIsMediumScreen } from 'effects/use-screensize';
import ProtectedContentOverlay from 'component/protectedContentOverlay';

const CommentsList = lazyImport(() => import('component/commentsList' /* webpackChunkName: "comments" */));

export const PRIMARY_PLAYER_WRAPPER_CLASS = 'file-page__video-container';
export const PRIMARY_IMAGE_WRAPPER_CLASS = 'file-render__img-container';

type Props = {
  uri: string,
  accessStatus: ?string,
  // -- redux --
  audioVideoDuration: ?number,
  commentsListTitle: string,
  fileInfo: FileListItem,
  isMature: boolean,
  isUriPlaying: boolean,
  linkedCommentId?: string,
  threadCommentId?: string,
  location: { search: string },
  playingCollectionId: ?string,
  position: number,
  commentSettingDisabled: ?boolean,
  videoTheaterMode: boolean,
  contentUnlocked: boolean,
  clearPosition: (uri: string) => void,
  doSetMainPlayerDimension: (dimensions: { height: number, width: number }) => void,
};

export default function VideoPlayersPage(props: Props) {
  const {
    uri,
    accessStatus,
    // -- redux --
    playingCollectionId,
    fileInfo,
    isMature,
    linkedCommentId,
    threadCommentId,
    videoTheaterMode,
    commentSettingDisabled,
    audioVideoDuration,
    commentsListTitle,
    isUriPlaying,
    location,
    position,
    contentUnlocked,
    clearPosition,
    doSetMainPlayerDimension,
  } = props;

  const isMobile = useIsMobile();
  const isMediumScreen = useIsMediumScreen() && !isMobile;
  const isLandscapeRotated = useIsMobileLandscape();

  const initialPlayingCol = React.useRef(playingCollectionId);

  const { search } = location;
  const urlParams = new URLSearchParams(search);
  const colParam = urlParams.get(COLLECTIONS_CONSTS.COLLECTION_ID);

  const collectionId = React.useMemo(() => {
    const startedPlayingOtherPlaylist =
      (isUriPlaying || playingCollectionId === null) &&
      playingCollectionId !== undefined &&
      !initialPlayingCol.current !== playingCollectionId;

    return startedPlayingOtherPlaylist ? playingCollectionId : colParam;
  }, [colParam, isUriPlaying, playingCollectionId]);

  const rightSideProps = React.useMemo(() => ({ collectionId, uri, isMediumScreen }), [
    collectionId,
    isMediumScreen,
    uri,
  ]);

  const videoPlayedEnoughToResetPosition = React.useMemo(() => {
    // I've never seen 'fileInfo' contain metadata lately, but retaining as historical fallback.
    const durationInSecs =
      audioVideoDuration ||
      (fileInfo && fileInfo.metadata && fileInfo.metadata.video ? fileInfo.metadata.video.duration : 0);
    const isVideoTooShort = durationInSecs <= 45;
    const almostFinishedPlaying = position / durationInSecs >= VIDEO_ALMOST_FINISHED_THRESHOLD;

    return durationInSecs ? isVideoTooShort || almostFinishedPlaying : false;
  }, [audioVideoDuration, fileInfo, position]);

  React.useEffect(() => {
    // always refresh file info when entering file page to see if we have the file
    // this could probably be refactored into more direct components now
    if (fileInfo && videoPlayedEnoughToResetPosition) {
      clearPosition(uri);
    }
  }, [clearPosition, fileInfo, uri, videoPlayedEnoughToResetPosition]);

  const playerRef = React.useCallback(
    (node) => {
      if (node) {
        const rect = node.getBoundingClientRect();
        doSetMainPlayerDimension({ height: rect.height, width: rect.width });
      }
    },
    [doSetMainPlayerDimension]
  );

  if (isMature) {
    return (
      <>
        <div className="section card-stack file-page__video">
          <FileTitleSection uri={uri} accessStatus={accessStatus} isNsfwBlocked />
        </div>

        {isMediumScreen && <PlaylistCard id={collectionId} uri={uri} colorHeader useDrawer={isMobile} />}
        {!videoTheaterMode && <RightSideContent {...rightSideProps} />}
      </>
    );
  }

  const commentsListProps = { uri, linkedCommentId, threadCommentId };

  return (
    <>
      <div className="section card-stack file-page__video">
        <div className={PRIMARY_PLAYER_WRAPPER_CLASS} ref={playerRef}>
          <ProtectedContentOverlay uri={uri} />
          {/* playables will be rendered and injected by <FileRenderFloating> */}
          <VideoClaimInitiator uri={uri} videoTheaterMode={videoTheaterMode} />
        </div>

        <div className="file-page__secondary-content">
          <section className="file-page__media-actions">
            <PreorderAndPurchaseContentButton uri={uri} />

            {isMediumScreen && <PlaylistCard id={collectionId} uri={uri} colorHeader useDrawer={isMobile} />}

            <FileTitleSection uri={uri} accessStatus={accessStatus} />

            {contentUnlocked &&
              (commentSettingDisabled ? (
                <Empty padded={!isMobile} text={__('The creator of this content has disabled comments.')} />
              ) : isMobile && !isLandscapeRotated ? (
                <React.Fragment>
                  <SwipeableDrawer type={DRAWERS.CHAT} title={commentsListTitle}>
                    <React.Suspense fallback={null}>
                      <CommentsList {...commentsListProps} />
                    </React.Suspense>
                  </SwipeableDrawer>

                  <DrawerExpandButton icon={ICONS.CHAT} label={commentsListTitle} type={DRAWERS.CHAT} />
                </React.Fragment>
              ) : (
                <React.Suspense fallback={null}>
                  <CommentsList {...commentsListProps} notInDrawer />
                </React.Suspense>
              ))}
          </section>

          {videoTheaterMode && <RightSideContent {...rightSideProps} />}
        </div>
      </div>

      {!videoTheaterMode && <RightSideContent {...rightSideProps} />}
    </>
  );
}

type RightSideProps = {
  collectionId: ?string,
  uri: string,
  isMediumScreen: boolean,
};

const RightSideContent = (rightSideProps: RightSideProps) => {
  const { collectionId, uri, isMediumScreen } = rightSideProps;

  const isMobile = useIsMobile();

  return (
    <div className="card-stack--spacing-m">
      {!isMediumScreen && <PlaylistCard id={collectionId} uri={uri} colorHeader useDrawer={isMobile} />}
      <RecommendedContent uri={uri} />
    </div>
  );
};
