import { VIDEO_ALMOST_FINISHED_THRESHOLD } from 'constants/player';
import * as React from 'react';
import { lazyImport } from 'util/lazyImport';
import * as ICONS from 'constants/icons';
import * as DRAWERS from 'constants/drawer_types';
import * as COLLECTIONS_CONSTS from 'constants/collections';
import * as SETTINGS from 'constants/settings';
import * as TAGS from 'constants/tags';
import FileTitleSection from 'component/fileTitleSection';
import VideoClaimInitiator from 'component/videoClaimInitiator';
import ClaimCoverRender from 'component/claimCoverRender';
import RecommendedContent from 'component/recommendedContent';
import Empty from 'component/common/empty';
import SwipeableDrawer from 'component/swipeableDrawer';
import DrawerExpandButton from 'component/swipeableDrawerExpand';
import { useIsMobile, useIsMobileLandscape, useIsSmallScreen } from 'effects/use-screensize';
import { LINKED_COMMENT_QUERY_PARAM, THREAD_COMMENT_QUERY_PARAM } from 'constants/comment';
import { useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { getChannelIdFromClaim } from 'util/claim';
import {
  selectClaimIsNsfwForUri,
  selectClaimForUri,
  makeSelectTagInClaimOrChannelForUri,
} from 'redux/selectors/claims';
import { makeSelectFileInfoForUri } from 'redux/selectors/file_info';
import { selectClientSetting } from 'redux/selectors/settings';
import {
  selectContentPositionForUri,
  selectPlayingCollectionId,
  selectIsUriCurrentlyPlaying,
  selectIsAutoplayCountdownForUri,
} from 'redux/selectors/content';
import { selectCommentsListTitleForUri, selectCommentsDisabledSettingForChannelId } from 'redux/selectors/comments';
import { selectNoRestrictionOrUserIsMemberForContentClaimId } from 'redux/selectors/memberships';
import { clearPosition as clearPositionAction } from 'redux/actions/content';
const CommentsList = lazyImport(
  () =>
    import(
      'component/commentsList'
      /* webpackChunkName: "comments" */
    )
);
const PlaylistCard = lazyImport(
  () =>
    import(
      'component/playlistCard'
      /* webpackChunkName: "playlistCard" */
    )
);
export const PRIMARY_PLAYER_WRAPPER_CLASS = 'file-page__video-container';
export const PRIMARY_IMAGE_WRAPPER_CLASS = 'file-render__img-container';
type Props = {
  uri: string;
  accessStatus: string | null | undefined;
};
export default function VideoPlayersPage(props: Props) {
  const { uri, accessStatus } = props;
  const dispatch = useAppDispatch();
  const claim = useAppSelector((state) => selectClaimForUri(state, uri));
  const channelId = getChannelIdFromClaim(claim);
  const claimId = claim?.claim_id;
  const commentSettingDisabled = useAppSelector((state) => selectCommentsDisabledSettingForChannelId(state, channelId));
  const playingCollectionId = useAppSelector(selectPlayingCollectionId);
  const fileInfo = useAppSelector((state) => makeSelectFileInfoForUri(uri)(state));
  const isMature = useAppSelector((state) => selectClaimIsNsfwForUri(state, uri));
  const isUriPlaying = useAppSelector((state) => selectIsUriCurrentlyPlaying(state, uri));
  const position = useAppSelector((state) => selectContentPositionForUri(state, uri));
  const commentsDisabled =
    commentSettingDisabled ||
    useAppSelector((state) => makeSelectTagInClaimOrChannelForUri(uri, TAGS.DISABLE_COMMENTS_TAG)(state));
  const videoTheaterMode = useAppSelector((state) => selectClientSetting(state, SETTINGS.VIDEO_THEATER_MODE));
  const contentUnlocked =
    claimId && useAppSelector((state) => selectNoRestrictionOrUserIsMemberForContentClaimId(state, claimId));
  const isAutoplayCountdownForUri = useAppSelector((state) => selectIsAutoplayCountdownForUri(state, uri));
  const commentsListTitle = useAppSelector((state) => selectCommentsListTitleForUri(state, uri));
  const clearPosition = (u: string) => dispatch(clearPositionAction(u));
  const location = useLocation();
  const isMobile = useIsMobile();
  const isSmallScreen = useIsSmallScreen() && !isMobile;
  const isLandscapeRotated = useIsMobileLandscape();
  const initialPlayingCol = React.useRef(playingCollectionId);
  const { search } = location;
  const urlParams = new URLSearchParams(search);
  const linkedCommentId = urlParams.get(LINKED_COMMENT_QUERY_PARAM) || undefined;
  const threadCommentId = urlParams.get(THREAD_COMMENT_QUERY_PARAM) || undefined;
  const colParam = urlParams.get(COLLECTIONS_CONSTS.COLLECTION_ID);
  const collectionId = React.useMemo(() => {
    const startedPlayingOtherPlaylist =
      (isUriPlaying || playingCollectionId === null) &&
      playingCollectionId !== undefined &&
      initialPlayingCol.current !== playingCollectionId;
    return startedPlayingOtherPlaylist ? playingCollectionId : colParam;
  }, [colParam, isUriPlaying, playingCollectionId]);
  const rightSideProps = React.useMemo(
    () => ({
      collectionId,
      uri,
      isSmallScreen,
    }),
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
        {!videoTheaterMode && <RightSideContent {...rightSideProps} />}
      </>
    );
  }

  const commentsListProps = {
    uri,
    linkedCommentId,
    threadCommentId,
  };
  return (
    <>
      <div className="section card-stack file-page__video">
        <div className={PRIMARY_PLAYER_WRAPPER_CLASS}>
          <VideoClaimInitiator uri={uri} />
        </div>

        <div className="file-page__secondary-content">
          <section className="file-page__media-actions">
            {isSmallScreen && <PlaylistCard id={collectionId} uri={uri} useDrawer={isMobile} />}

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
  collectionId: string | null | undefined;
  uri: string;
  isSmallScreen: boolean;
};

const RightSideContent = (rightSideProps: RightSideProps) => {
  const { collectionId, uri, isSmallScreen } = rightSideProps;
  const isMobile = useIsMobile();
  return (
    <div className="card-stack--spacing-m">
      {!isSmallScreen && <PlaylistCard id={collectionId} uri={uri} useDrawer={isMobile} />}
      <RecommendedContent uri={uri} />
    </div>
  );
};
