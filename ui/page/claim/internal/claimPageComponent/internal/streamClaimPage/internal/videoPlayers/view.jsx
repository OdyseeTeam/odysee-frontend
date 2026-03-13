// @flow
import { VIDEO_ALMOST_FINISHED_THRESHOLD } from 'constants/player';
import * as React from 'react';
import { lazyImport } from 'util/lazyImport';
import * as ICONS from 'constants/icons';
import * as DRAWERS from 'constants/drawer_types';
import * as COLLECTIONS_CONSTS from 'constants/collections';
import FileTitleSection from 'component/fileTitleSection';
import VideoClaimInitiator from 'component/videoClaimInitiator';
import ClaimCoverRender from 'component/claimCoverRender';
import RecommendedContent from 'component/recommendedContent';
import Empty from 'component/common/empty';
import SwipeableDrawer from 'component/swipeableDrawer';
import DrawerExpandButton from 'component/swipeableDrawerExpand';
import VideoFullscreenActions from 'component/videoFullscreenActions';
import { useIsMobile, useIsMobileLandscape, useIsSmallScreen } from 'effects/use-screensize';

const CommentsList = lazyImport(() => import('component/commentsList' /* webpackChunkName: "comments" */));
const PlaylistCard = lazyImport(() => import('component/playlistCard' /* webpackChunkName: "playlistCard" */));
const ChaptersCard = lazyImport(() => import('component/chaptersCard' /* webpackChunkName: "chaptersCard" */));

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
  commentsDisabled: ?boolean,
  videoTheaterMode: boolean,
  contentUnlocked: boolean,
  isAutoplayCountdownForUri: ?boolean,
  clearPosition: (uri: string) => void,
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
    commentsDisabled,
    audioVideoDuration,
    commentsListTitle,
    isUriPlaying,
    location,
    position,
    contentUnlocked,
    isAutoplayCountdownForUri,
    clearPosition,
  } = props;

  const isMobile = useIsMobile();
  const isSmallScreen = useIsSmallScreen() && !isMobile;
  const isLandscapeRotated = useIsMobileLandscape();

  const [fullscreenPanelMode, setFullscreenPanelMode] = React.useState(null);
  const fullscreenContainerRef = React.useRef(null);

  React.useEffect(() => {
    window.__videoFullscreenContainer = fullscreenContainerRef.current;
    return () => {
      delete window.__videoFullscreenContainer;
    };
  }, []);

  const handleTogglePanel = React.useCallback((mode) => {
    setFullscreenPanelMode((prev) => (prev === mode ? null : mode));
  }, []);

  const handleClosePanel = React.useCallback(() => {
    setFullscreenPanelMode(null);
  }, []);

  React.useEffect(() => {
    const container = fullscreenContainerRef.current;
    const onFsChange = () => {
      // $FlowFixMe
      const fsEl = document.fullscreenElement;
      if (!fsEl || fsEl !== container) {
        setFullscreenPanelMode(null);
      }

      if (fsEl !== container && container) {
        // $FlowFixMe
        const viewer: any = document.querySelector('.content__viewer');
        if (viewer && viewer._originalParent) {
          if (viewer._originalNextSibling && viewer._originalNextSibling.parentElement === viewer._originalParent) {
            viewer._originalParent.insertBefore(viewer, viewer._originalNextSibling);
          } else {
            viewer._originalParent.appendChild(viewer);
          }
          if (viewer._savedStyle !== undefined) {
            viewer.style.cssText = viewer._savedStyle;
            delete viewer._savedStyle;
          }
          delete viewer._originalParent;
          delete viewer._originalNextSibling;
        }
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

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

  const rightSideProps = React.useMemo(
    () => ({ collectionId, uri, isSmallScreen }),
    [collectionId, isSmallScreen, uri]
  );

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

  if (isMature) {
    return (
      <>
        <div className="section card-stack file-page__video">
          {isAutoplayCountdownForUri && (
            <div className={PRIMARY_PLAYER_WRAPPER_CLASS}>
              <ClaimCoverRender uri={uri} />
            </div>
          )}

          <FileTitleSection uri={uri} accessStatus={accessStatus} isNsfwBlocked />
        </div>

        {isSmallScreen && <PlaylistCard id={collectionId} uri={uri} useDrawer={isMobile} />}
        {isSmallScreen && <ChaptersCard uri={uri} />}
        {!videoTheaterMode && <RightSideContent {...rightSideProps} />}
      </>
    );
  }

  const commentsListProps = { uri, linkedCommentId, threadCommentId };
  return (
    <>
      <div
        ref={fullscreenContainerRef}
        className={`video-fullscreen-container${fullscreenPanelMode ? ' video-fullscreen-container--panel-open' : ''}`}
      >
        <div className="video-fullscreen-container__player-section" />
        <VideoFullscreenActions
          uri={uri}
          accessStatus={accessStatus}
          contentUnlocked={contentUnlocked}
          commentsDisabled={commentsDisabled}
          linkedCommentId={linkedCommentId}
          threadCommentId={threadCommentId}
          panelMode={fullscreenPanelMode}
          onTogglePanel={handleTogglePanel}
          onClosePanel={handleClosePanel}
        />
      </div>

      <div className="section card-stack file-page__video">
        <div className={PRIMARY_PLAYER_WRAPPER_CLASS}>
          <VideoClaimInitiator uri={uri} />
        </div>

        <div className="file-page__secondary-content">
          <section className="file-page__media-actions">
            {isSmallScreen && <PlaylistCard id={collectionId} uri={uri} useDrawer={isMobile} />}
            {isSmallScreen && <ChaptersCard uri={uri} />}

            <FileTitleSection uri={uri} accessStatus={accessStatus} />

            {contentUnlocked &&
              (commentsDisabled ? (
                <Empty padded={!isMobile} text={__('The creator of this content has disabled comments.')} />
              ) : isMobile && !isLandscapeRotated ? (
                <React.Fragment>
                  <SwipeableDrawer type={DRAWERS.CHAT} title={<h2>{commentsListTitle}</h2>}>
                    <React.Suspense fallback={null}>
                      <CommentsList {...commentsListProps} />
                    </React.Suspense>
                  </SwipeableDrawer>

                  <DrawerExpandButton icon={ICONS.CHAT} label={<h2>{commentsListTitle}</h2>} type={DRAWERS.CHAT} />
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
  isSmallScreen: boolean,
};

const RightSideContent = (rightSideProps: RightSideProps) => {
  const { collectionId, uri, isSmallScreen } = rightSideProps;

  const isMobile = useIsMobile();

  return (
    <div className="card-stack--spacing-m">
      {!isSmallScreen && <PlaylistCard id={collectionId} uri={uri} useDrawer={isMobile} />}
      <ChaptersCard uri={uri} />
      <RecommendedContent uri={uri} />
    </div>
  );
};
