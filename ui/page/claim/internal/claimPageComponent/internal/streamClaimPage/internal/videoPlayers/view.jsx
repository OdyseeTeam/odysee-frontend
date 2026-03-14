// @flow
import { VIDEO_ALMOST_FINISHED_THRESHOLD } from 'constants/player';
import * as React from 'react';
import { lazyImport } from 'util/lazyImport';
import * as COLLECTIONS_CONSTS from 'constants/collections';
import FileTitleSection from 'component/fileTitleSection';
import VideoClaimInitiator from 'component/videoClaimInitiator';
import ClaimCoverRender from 'component/claimCoverRender';
import RecommendedContent from 'component/recommendedContent';
import Empty from 'component/common/empty';
import MobileTabView from 'component/mobileTabView';
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

  const isMobilePortrait = isMobile && !isLandscapeRotated;
  const commentsListProps = { uri, linkedCommentId, threadCommentId };

  if (isMobilePortrait) {
    const infoContent = (
      <section className="file-page__media-actions">
        {isSmallScreen && <PlaylistCard id={collectionId} uri={uri} useDrawer={isMobile} />}
        {isSmallScreen && <ChaptersCard uri={uri} />}
        <FileTitleSection uri={uri} accessStatus={accessStatus} expandOverride />
      </section>
    );

    const commentsContent =
      contentUnlocked && !commentsDisabled ? (
        <React.Suspense fallback={null}>
          <CommentsList {...commentsListProps} notInDrawer />
        </React.Suspense>
      ) : (
        <Empty padded={false} text={__('The creator of this content has disabled comments.')} />
      );

    const relatedContent = <RightSideContent {...rightSideProps} />;

    return (
      <>
        <div className="section card-stack file-page__video">
          <div className={PRIMARY_PLAYER_WRAPPER_CLASS}>
            <VideoClaimInitiator uri={uri} />
          </div>

          <MobileTabView
            infoContent={infoContent}
            commentsContent={commentsContent}
            relatedContent={relatedContent}
            initialTab={linkedCommentId ? 1 : 0}
          />
        </div>
      </>
    );
  }

  return (
    <>
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
