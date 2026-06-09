import { VIDEO_ALMOST_FINISHED_THRESHOLD } from 'constants/player';
import * as React from 'react';
import { lazyImport } from 'util/lazyImport';
import parseChapters from 'util/parse-chapters';
import ChaptersCard from 'component/chaptersCard';
import * as COLLECTIONS_CONSTS from 'constants/collections';
import * as SETTINGS from 'constants/settings';
import * as TAGS from 'constants/tags';
import FileTitleSection from 'component/fileTitleSection';
import VideoClaimInitiator from 'component/videoClaimInitiator';
import ClaimCoverRender from 'component/claimCoverRender';
import RecommendedContent from 'component/recommendedContent';
import Empty from 'component/common/empty';
import MobileTabView from 'component/mobileTabView';
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
const HYPERBEAM_STARTUP_BEGIN_EVENT = 'odysee-hyperbeam-startup-begin';
const HYPERBEAM_STARTUP_CLICK_EVENT = 'odysee-hyperbeam-startup-click';
const HYPERBEAM_STARTUP_READY_EVENT = 'odysee-hyperbeam-startup-ready';
const HYPERBEAM_PENDING_STARTUP_URI_KEY = '__odyseeHyperbeamPendingStartupUri';
const HYPERBEAM_STARTUP_DEBUG_VISIBLE = false;
const HYPERBEAM_STARTUP_ACTIVE_BODY_CLASS = 'hyperbeam-startup-active';
const HYPERBEAM_STARTUP_STAGE_ACTIVE_CLASS = 'file-page__player-stage--hyperbeam-startup-active';
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
  const description = claim?.value?.description;
  const commentSettingDisabled = useAppSelector((state) => selectCommentsDisabledSettingForChannelId(state, channelId));
  const playingCollectionId = useAppSelector(selectPlayingCollectionId);
  const fileInfo = useAppSelector((state) => makeSelectFileInfoForUri(uri)(state));
  const isMature = useAppSelector((state) => selectClaimIsNsfwForUri(state, uri));
  const isUriPlaying = useAppSelector((state) => selectIsUriCurrentlyPlaying(state, uri));
  const position = useAppSelector((state) => selectContentPositionForUri(state, uri));
  const commentsDisabledTag = useAppSelector((state) =>
    makeSelectTagInClaimOrChannelForUri(uri, TAGS.DISABLE_COMMENTS_TAG)(state)
  );
  const commentsDisabled = commentSettingDisabled || commentsDisabledTag;
  const videoTheaterMode = useAppSelector((state) => selectClientSetting(state, SETTINGS.VIDEO_THEATER_MODE));
  const contentUnlockedValue = useAppSelector((state) =>
    claimId ? selectNoRestrictionOrUserIsMemberForContentClaimId(state, claimId) : undefined
  );
  const contentUnlocked = claimId && contentUnlockedValue;
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
    const durationInSecs =
      fileInfo && fileInfo.metadata && fileInfo.metadata.video ? fileInfo.metadata.video.duration : 0;
    const isVideoTooShort = durationInSecs <= 45;
    const almostFinishedPlaying = position / durationInSecs >= VIDEO_ALMOST_FINISHED_THRESHOLD;
    return durationInSecs ? isVideoTooShort || almostFinishedPlaying : false;
  }, [fileInfo, position]);
  React.useEffect(() => {
    // always refresh file info when entering file page to see if we have the file
    // this could probably be refactored into more direct components now
    if (fileInfo && videoPlayedEnoughToResetPosition) {
      dispatch(clearPositionAction(uri));
    }
  }, [dispatch, fileInfo, uri, videoPlayedEnoughToResetPosition]);

  const chapters = React.useMemo(() => parseChapters(description), [description]);
  const hasChapters = chapters.length > 0;

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

        {isSmallScreen && <PlaylistCard id={collectionId} uri={uri} />}
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

    const chaptersContent = hasChapters ? (
      <React.Suspense fallback={null}>
        <ChaptersCard uri={uri} visible setVisible={() => {}} />
      </React.Suspense>
    ) : undefined;

    const playlistContent = collectionId ? (
      <React.Suspense fallback={null}>
        <PlaylistCard id={collectionId} uri={uri} />
      </React.Suspense>
    ) : undefined;

    const relatedContent = <RightSideContent {...rightSideProps} />;

    return (
      <>
        <div className="section card-stack file-page__video">
          <div className="file-page__player-stage">
            <div className={PRIMARY_PLAYER_WRAPPER_CLASS}>
              <VideoClaimInitiator uri={uri} />
            </div>
            <HyperbeamStartupOverlay uri={uri} />
          </div>

          <MobileTabView
            infoContent={infoContent}
            chaptersContent={chaptersContent}
            playlistContent={playlistContent}
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
        <div className="file-page__player-stage">
          <div className={PRIMARY_PLAYER_WRAPPER_CLASS}>
            <VideoClaimInitiator uri={uri} />
          </div>
          <HyperbeamStartupOverlay uri={uri} />
        </div>

        <div className="file-page__secondary-content">
          <section className="file-page__media-actions">
            {isSmallScreen && <PlaylistCard id={collectionId} uri={uri} />}
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
  collectionId: string | null | undefined;
  uri: string;
  isSmallScreen: boolean;
};

function HyperbeamStartupOverlay(props: { uri: string }) {
  const { uri } = props;
  const [active, setActive] = React.useState(false);
  const [networkVisible, setNetworkVisible] = React.useState(false);
  const [morphing, setMorphing] = React.useState(false);
  const [animationKey, setAnimationKey] = React.useState(0);
  const overlayRef = React.useRef<HTMLDivElement | null>(null);
  const buttonRef = React.useRef<HTMLButtonElement | null>(null);
  const startupRequestedRef = React.useRef(false);
  const hideStartupThumbnail = React.useCallback(() => {
    (window as any)[HYPERBEAM_PENDING_STARTUP_URI_KEY] = uri;
    document.body.classList.add(HYPERBEAM_STARTUP_ACTIVE_BODY_CLASS);
    overlayRef.current?.classList.add('file-page__hyperbeam-startup-overlay--masking');
    const playerStage = overlayRef.current?.closest('.file-page__player-stage');
    playerStage?.classList.add(HYPERBEAM_STARTUP_STAGE_ACTIVE_CLASS);
  }, [uri]);
  const activateStartupLayer = React.useCallback(() => {
    hideStartupThumbnail();
    overlayRef.current?.classList.add('content__hyperbeam-startup-layer--active');
    overlayRef.current?.classList.add('file-page__hyperbeam-startup-overlay--masking');
    buttonRef.current?.classList.add('file-page__hyperbeam-startup-button--morphing');
  }, [hideStartupThumbnail]);

  const handleStartupPointerCapture = React.useCallback(() => {
    hideStartupThumbnail();
  }, [hideStartupThumbnail]);

  React.useEffect(() => {
    const handleBegin = (event: Event) => {
      const detail = (event as CustomEvent<{ uri?: string }>).detail;
      if (detail?.uri && detail.uri !== uri) return;
      activateStartupLayer();
      setAnimationKey((key) => key + 1);
      setActive(true);
      setNetworkVisible(true);
      setMorphing(true);
    };
    window.addEventListener(HYPERBEAM_STARTUP_BEGIN_EVENT, handleBegin);

    return () => {
      window.removeEventListener(HYPERBEAM_STARTUP_BEGIN_EVENT, handleBegin);
    };
  }, [activateStartupLayer, uri]);

  React.useEffect(() => {
    const handleReady = (event: Event) => {
      const detail = (event as CustomEvent<{ uri?: string }>).detail;
      if (detail?.uri && detail.uri !== uri) return;
      overlayRef.current?.classList.remove('content__hyperbeam-startup-layer--active');
      overlayRef.current?.classList.remove('file-page__hyperbeam-startup-overlay--masking');
      setNetworkVisible(false);
      setMorphing(false);
    };
    window.addEventListener(HYPERBEAM_STARTUP_READY_EVENT, handleReady);

    return () => {
      window.removeEventListener(HYPERBEAM_STARTUP_READY_EVENT, handleReady);
    };
  }, [uri]);

  React.useEffect(() => {
    document.body.classList.toggle(HYPERBEAM_STARTUP_ACTIVE_BODY_CLASS, active);

    return () => {
      document.body.classList.remove(HYPERBEAM_STARTUP_ACTIVE_BODY_CLASS);
    };
  }, [active]);

  const beginStartup = React.useCallback(
    (event: React.SyntheticEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (!startupRequestedRef.current) {
        startupRequestedRef.current = true;
        activateStartupLayer();
        setAnimationKey((key) => key + 1);
        setActive(true);
        setNetworkVisible(true);
        setMorphing(true);
      }
      window.dispatchEvent(new CustomEvent(HYPERBEAM_STARTUP_CLICK_EVENT, { detail: { uri } }));
    },
    [uri]
  );

  return (
    <div
      ref={overlayRef}
      onPointerDownCapture={handleStartupPointerCapture}
      onMouseDownCapture={handleStartupPointerCapture}
      onTouchStartCapture={handleStartupPointerCapture}
      className={`file-page__hyperbeam-startup-overlay content__hyperbeam-startup-layer${
        networkVisible ? ' content__hyperbeam-startup-layer--active' : ''
      }${HYPERBEAM_STARTUP_DEBUG_VISIBLE ? ' file-page__hyperbeam-startup-overlay--debug-visible' : ''}`}
    >
      <button
        ref={buttonRef}
        type="button"
        onPointerDown={beginStartup}
        onMouseDown={beginStartup}
        onTouchStart={beginStartup}
        onClick={beginStartup}
        aria-label={__('Play')}
        title={__('Play')}
        className={`file-page__hyperbeam-startup-button${
          morphing ? ' file-page__hyperbeam-startup-button--morphing' : ''
        }`}
      />
      <HyperbeamStartupNetwork key={animationKey} />
    </div>
  );
}

function HyperbeamStartupNetwork() {
  const nodes = React.useMemo(
    () =>
      [
        [50, 50],
        [37, 37],
        [63, 36],
        [34, 58],
        [66, 59],
        [47, 24],
        [54, 72],
        [24, 43],
        [76, 44],
        [25, 67],
        [74, 70],
        [42, 82],
        [59, 19],
      ].map(([x, y], index) => ({ id: index, x, y, delay: index * 42 })),
    []
  );
  const lines = React.useMemo(
    () => [
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
      [1, 5],
      [1, 7],
      [2, 5],
      [2, 8],
      [3, 7],
      [3, 9],
      [4, 8],
      [4, 10],
      [3, 6],
      [4, 6],
      [6, 11],
      [2, 12],
      [5, 12],
      [9, 11],
      [10, 11],
    ],
    []
  );
  const packets = React.useMemo(
    () =>
      [
        [1, 0, 1680, 0],
        [2, 0, 1840, 260],
        [3, 0, 1720, 520],
        [4, 0, 1940, 780],
        [7, 3, 2100, 1040],
        [8, 4, 1880, 1300],
        [11, 6, 2200, 1560],
      ].map(([from, to, duration, delay], index) => {
        const fromNode = nodes[from];
        const toNode = nodes[to];
        return {
          id: index,
          x1: fromNode.x,
          y1: fromNode.y,
          x2: toNode.x,
          y2: toNode.y,
          duration,
          delay,
        };
      }),
    [nodes]
  );

  return (
    <div className="content__hyperbeam-startup-network" aria-hidden="true">
      <svg className="content__hyperbeam-startup-network__graph" viewBox="0 0 100 100" preserveAspectRatio="none">
        {lines.map(([from, to], index) => {
          const fromNode = nodes[from];
          const toNode = nodes[to];
          return (
            <line
              key={`${from}-${to}`}
              className="content__hyperbeam-startup-network__line"
              x1={fromNode.x}
              y1={fromNode.y}
              x2={toNode.x}
              y2={toNode.y}
              pathLength={1}
              style={{ animationDelay: `${index * 24}ms` }}
            />
          );
        })}
      </svg>
      {nodes.map((node) => (
        <span
          key={node.id}
          className={
            node.id === 0
              ? 'content__hyperbeam-startup-network__node content__hyperbeam-startup-network__node--root'
              : 'content__hyperbeam-startup-network__node'
          }
          style={{
            left: `${node.x}%`,
            top: `${node.y}%`,
            width: node.id === 0 ? 13 : 7,
            height: node.id === 0 ? 13 : 7,
            animationDelay: `${node.delay}ms`,
          }}
        />
      ))}
      {packets.map((packet) => (
        <span
          key={packet.id}
          className="content__hyperbeam-startup-network__packet"
          style={
            {
              '--packet-x1': `${packet.x1}%`,
              '--packet-y1': `${packet.y1}%`,
              '--packet-x2': `${packet.x2}%`,
              '--packet-y2': `${packet.y2}%`,
              '--packet-duration': `${packet.duration}ms`,
              '--packet-delay': `${packet.delay}ms`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

const RightSideContent = (rightSideProps: RightSideProps) => {
  const { collectionId, uri, isSmallScreen } = rightSideProps;
  const isMobile = useIsMobile();
  return (
    <div className="card-stack--spacing-m">
      {!isSmallScreen && !isMobile && <PlaylistCard id={collectionId} uri={uri} />}
      {!isMobile && <ChaptersCard uri={uri} />}
      <RecommendedContent uri={uri} />
    </div>
  );
};
