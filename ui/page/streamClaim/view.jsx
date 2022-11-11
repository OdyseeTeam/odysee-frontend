// @flow
import { PRIMARY_IMAGE_WRAPPER_CLASS } from 'constants/player';
import * as React from 'react';
import classnames from 'classnames';
import { lazyImport } from 'util/lazyImport';
import Page from 'component/page';
import * as ICONS from 'constants/icons';
import * as DRAWERS from 'constants/drawer_types';
import * as RENDER_MODES from 'constants/file_render_modes';
import FileTitleSection from 'component/fileTitleSection';
import FileRenderInitiator from 'component/fileRenderInitiator';
import FileRenderInline from 'component/fileRenderInline';
import FileRenderDownload from 'component/fileRenderDownload';
import RecommendedContent from 'component/recommendedContent';
import Empty from 'component/common/empty';
import SwipeableDrawer from 'component/swipeableDrawer';
import DrawerExpandButton from 'component/swipeableDrawerExpand';
import PreorderAndPurchaseContentButton from 'component/preorderAndPurchaseContentButton';
import { useIsMobile, useIsMobileLandscape } from 'effects/use-screensize';
import ProtectedContentOverlay from 'component/protectedContentOverlay';

const CommentsList = lazyImport(() => import('component/commentsList' /* webpackChunkName: "comments" */));
const MarkdownPostPage = lazyImport(() => import('./internal/markdownPost' /* webpackChunkName: "markdownPost" */));
const VideoPlayersPage = lazyImport(() => import('./internal/videoPlayers' /* webpackChunkName: "videoPlayersPage" */));

type Props = {
  claimId: string,
  claimWasPurchased: boolean,
  commentsListTitle: string,
  costInfo: ?{ includesData: boolean, cost: number },
  doCheckIfPurchasedClaimId: (claimId: string) => void,
  doClearPlayingUri: () => void,
  doFetchCostInfoForUri: (uri: string) => void,
  doFileGetForUri: (uri: string) => void,
  doSetContentHistoryItem: (uri: string) => void,
  doSetPrimaryUri: (uri: ?string) => void,
  doToggleAppDrawer: (type: string) => void,
  doMembershipContentforStreamClaimId: (type: string) => void,
  fileInfo: FileListItem,
  isMature: boolean,
  isPlaying?: boolean,
  linkedCommentId?: string,
  preorderTag: number,
  purchaseTag: number,
  renderMode: string,
  rentalTag: string,
  commentSettingDisabled: ?boolean,
  threadCommentId?: string,
  uri: string,
  videoTheaterMode: boolean,
  myMembershipsFetched: boolean,
  doMembershipMine: () => void,
  protectedMembershipIds?: Array<number>,
  validMembershipIds?: Array<number>,
  protectedContentTag?: string,
  isProtectedContent?: boolean,
  contentUnlocked: boolean,
};

export default function StreamClaimPage(props: Props) {
  const {
    uri,
    renderMode,
    fileInfo,
    isMature,
    costInfo,
    linkedCommentId,
    threadCommentId,
    videoTheaterMode,
    commentSettingDisabled,
    claimId,
    claimWasPurchased,
    commentsListTitle,
    doCheckIfPurchasedClaimId,
    doFetchCostInfoForUri,
    doFileGetForUri,
    doMembershipContentforStreamClaimId,
    doMembershipMine,
    doSetContentHistoryItem,
    doSetPrimaryUri,
    doToggleAppDrawer,
    myMembershipsFetched,
    preorderTag,
    purchaseTag,
    rentalTag,
    isProtectedContent,
    contentUnlocked,
  } = props;

  const isMobile = useIsMobile();
  const isLandscapeRotated = useIsMobileLandscape();
  const theaterMode = renderMode === 'video' || renderMode === 'audio' ? videoTheaterMode : false;

  const cost = costInfo ? costInfo.cost : null;
  const hasFileInfo = fileInfo !== undefined;
  const isMarkdown = renderMode === RENDER_MODES.MARKDOWN;
  const accessStatus = !isProtectedContent ? undefined : contentUnlocked ? 'unlocked' : 'locked';

  React.useEffect(() => {
    if ((linkedCommentId || threadCommentId) && isMobile) {
      doToggleAppDrawer(DRAWERS.CHAT);
    }
    // only on mount, otherwise clicking on a comments timestamp and linking it
    // would trigger the drawer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (!myMembershipsFetched) {
      doMembershipMine();
    }
  }, [doMembershipMine, myMembershipsFetched]);

  React.useEffect(() => {
    const aPurchaseOrPreorder = purchaseTag || preorderTag || rentalTag;
    if (aPurchaseOrPreorder && claimId) doCheckIfPurchasedClaimId(claimId);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchaseTag, preorderTag, rentalTag, claimId]);

  React.useEffect(() => {
    if (claimId) {
      doMembershipContentforStreamClaimId(claimId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claimId]);

  React.useEffect(() => {
    // See https://github.com/lbryio/lbry-desktop/pull/1563 for discussion
    doFetchCostInfoForUri(uri);
    doSetContentHistoryItem(uri);
    doSetPrimaryUri(uri);
    if (claimWasPurchased && !hasFileInfo) doFileGetForUri(uri);

    return () => doSetPrimaryUri(null);
  }, [
    claimWasPurchased,
    doFetchCostInfoForUri,
    doFileGetForUri,
    doSetContentHistoryItem,
    doSetPrimaryUri,
    hasFileInfo,
    uri,
  ]);

  if (isMarkdown) {
    return <MarkdownPostPage uri={uri} accessStatus={accessStatus} />;
  }

  if (RENDER_MODES.FLOATING_MODES.includes(renderMode)) {
    return <VideoPlayersPage uri={uri} accessStatus={accessStatus} />;
  }

  function renderFilePageLayout() {
    if (RENDER_MODES.UNRENDERABLE_MODES.includes(renderMode) && !isMature) {
      return (
        <>
          <FileTitleSection uri={uri} accessStatus={accessStatus} />
          <FileRenderDownload uri={uri} isFree={cost === 0} />
        </>
      );
    }

    if (RENDER_MODES.TEXT_MODES.includes(renderMode)) {
      return (
        <>
          <div className="file-page__pdf-wrapper">
            <ProtectedContentOverlay uri={uri} />
            <FileRenderInline uri={uri} />
            <FileRenderInitiator uri={uri} />
          </div>
          <FileTitleSection uri={uri} accessStatus={accessStatus} />
        </>
      );
    }

    if (renderMode === RENDER_MODES.IMAGE) {
      return (
        <>
          <div className={PRIMARY_IMAGE_WRAPPER_CLASS}>
            <ProtectedContentOverlay uri={uri} />
            <FileRenderInitiator uri={uri} />
            <FileRenderInline uri={uri} />
          </div>
          <FileTitleSection uri={uri} accessStatus={accessStatus} />
        </>
      );
    }

    return (
      <>
        <FileRenderInitiator uri={uri} videoTheaterMode={theaterMode} />
        <FileRenderInline uri={uri} />
        <FileTitleSection uri={uri} accessStatus={accessStatus} />
      </>
    );
  }

  if (isMature) {
    return (
      <Page className="file-page" filePage isMarkdown={false}>
        <div className={classnames('section card-stack', `file-page__${renderMode}`)}>
          <FileTitleSection uri={uri} accessStatus={accessStatus} isNsfwBlocked />
        </div>
        {!theaterMode && <RecommendedContent uri={uri} />}
      </Page>
    );
  }

  const commentsListProps = { uri, linkedCommentId, threadCommentId };
  const emptyMsgProps = { padded: !isMobile };

  return (
    <Page className="file-page" filePage isMarkdown={isMarkdown}>
      <div className={classnames('section card-stack', `file-page__${renderMode}`)}>
        {renderFilePageLayout()}

        <div className="file-page__secondary-content">
          <section className="file-page__media-actions">
            <PreorderAndPurchaseContentButton uri={uri} />

            {contentUnlocked && (
              <React.Suspense fallback={null}>
                {commentSettingDisabled ? (
                  <Empty {...emptyMsgProps} text={__('The creator of this content has disabled comments.')} />
                ) : isMobile && !isLandscapeRotated ? (
                  <React.Fragment>
                    <SwipeableDrawer type={DRAWERS.CHAT} title={commentsListTitle}>
                      <CommentsList {...commentsListProps} />
                    </SwipeableDrawer>

                    <DrawerExpandButton icon={ICONS.CHAT} label={commentsListTitle} type={DRAWERS.CHAT} />
                  </React.Fragment>
                ) : (
                  <CommentsList {...commentsListProps} notInDrawer />
                )}
              </React.Suspense>
            )}
          </section>
        </div>
      </div>

      <RecommendedContent uri={uri} />
    </Page>
  );
}
