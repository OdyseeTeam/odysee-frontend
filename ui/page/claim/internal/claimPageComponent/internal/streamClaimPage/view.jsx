// @flow
import { PRIMARY_IMAGE_WRAPPER_CLASS } from 'constants/player';
import * as React from 'react';
import Button from 'component/button';
import classnames from 'classnames';
import { lazyImport } from 'util/lazyImport';
import * as ICONS from 'constants/icons';
import * as DRAWERS from 'constants/drawer_types';
import * as RENDER_MODES from 'constants/file_render_modes';
import FileTitleSection from 'component/fileTitleSection';
import StreamClaimRenderInline from 'component/streamClaimRenderInline';
import FileRenderDownload from 'component/fileRenderDownload';
import RecommendedContent from 'component/recommendedContent';
import Empty from 'component/common/empty';
import SwipeableDrawer from 'component/swipeableDrawer';
import DrawerExpandButton from 'component/swipeableDrawerExpand';
import { useIsMobile, useIsMobileLandscape } from 'effects/use-screensize';

const CommentsList = lazyImport(() => import('component/commentsList' /* webpackChunkName: "comments" */));
const MarkdownPostPage = lazyImport(() => import('./internal/markdownPost' /* webpackChunkName: "markdownPost" */));
const VideoPlayersPage = lazyImport(() => import('./internal/videoPlayers' /* webpackChunkName: "videoPlayersPage" */));
const LivestreamPage = lazyImport(() => import('./internal/livestream' /* webpackChunkName: "livestream" */));

type Props = {
  uri: string,
  // -- redux --
  commentsListTitle: string,
  costInfo: ?{ includesData: boolean, cost: number },
  thumbnail: ?string,
  isMature: boolean,
  linkedCommentId?: string,
  renderMode: string,
  commentsDisabled: ?boolean,
  threadCommentId?: string,
  isProtectedContent?: boolean,
  contentUnlocked: boolean,
  isLivestream: boolean,
  isClaimBlackListed: boolean,
  doSetContentHistoryItem: (uri: string) => void,
  doSetPrimaryUri: (uri: ?string) => void,
  doToggleAppDrawer: (type: string) => void,
};

const StreamClaimPage = (props: Props) => {
  const {
    uri,
    // -- redux --
    commentsListTitle,
    costInfo,
    thumbnail,
    isMature,
    linkedCommentId,
    renderMode,
    commentsDisabled,
    threadCommentId,
    isProtectedContent,
    contentUnlocked,
    isLivestream,
    isClaimBlackListed,
    doSetContentHistoryItem,
    doSetPrimaryUri,
    doToggleAppDrawer,
  } = props;

  const isMobile = useIsMobile();
  const isLandscapeRotated = useIsMobileLandscape();

  const cost = costInfo ? costInfo.cost : null;
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
    doSetContentHistoryItem(uri);
    doSetPrimaryUri(uri);

    return () => doSetPrimaryUri(null);
  }, [doSetContentHistoryItem, doSetPrimaryUri, uri]);

  if (!isClaimBlackListed && isMarkdown) {
    return (
      <React.Suspense fallback={null}>
        <MarkdownPostPage uri={uri} accessStatus={accessStatus} />
      </React.Suspense>
    );
  }

  if (!isClaimBlackListed && RENDER_MODES.FLOATING_MODES.includes(renderMode)) {
    if (isLivestream) {
      return (
        <React.Suspense fallback={null}>
          <LivestreamPage uri={uri} accessStatus={accessStatus} />
        </React.Suspense>
      );
    }

    return (
      <React.Suspense fallback={null}>
        <VideoPlayersPage uri={uri} accessStatus={accessStatus} />
      </React.Suspense>
    );
  }

  function renderClaimLayout() {
    if (RENDER_MODES.UNRENDERABLE_MODES.includes(renderMode)) {
      return (
        <>
          {thumbnail && (
            <div className={PRIMARY_IMAGE_WRAPPER_CLASS}>
              <StreamClaimRenderInline uri={uri} />
            </div>
          )}
          <FileRenderDownload uri={uri} isFree={cost === 0} />
        </>
      );
    }

    if (RENDER_MODES.TEXT_MODES.includes(renderMode)) {
      return (
        <div className="file-page__pdf-wrapper">
          <StreamClaimRenderInline uri={uri} />
        </div>
      );
    }

    if (renderMode === RENDER_MODES.IMAGE) {
      return (
        <div className={PRIMARY_IMAGE_WRAPPER_CLASS}>
          <StreamClaimRenderInline uri={uri} />
        </div>
      );
    }

    return <StreamClaimRenderInline uri={uri} />;
  }

  function dmcaInfo() {
    return (
      <section className="card--section dmca-info">
        <p>
          {__(
            'In response to a complaint we received under the US Digital Millennium Copyright Act, we have blocked access to this content from our applications. Content may also be blocked due to DMCA Red Flag rules which are obvious copyright violations we come across, are discussed in public channels, or reported to us.'
          )}
        </p>
        <p>
          {__('Please remove the content, or reach out to %email% if you think there has been a mistake.', {
            email: 'help@odysee.com',
          })}
        </p>
        <div className="section__actions">
          <Button
            button="link"
            href="https://help.odysee.tv/category-uploading/dmca-content/#receiving-a-dmca-notice"
            label={__('Read More')}
          />
        </div>
      </section>
    );
  }

  if (isMature) {
    return (
      <>
        <FileTitleSection uri={uri} accessStatus={accessStatus} isNsfwBlocked />
        <RecommendedContent uri={uri} />
      </>
    );
  }

  const commentsListProps = { uri, linkedCommentId, threadCommentId };
  const emptyMsgProps = { padded: !isMobile };

  return (
    <>
      <div className={classnames('section card-stack', `file-page__${renderMode}`)}>
        {!isClaimBlackListed && renderClaimLayout()}
        {isClaimBlackListed && dmcaInfo()}

        <FileTitleSection uri={uri} accessStatus={accessStatus} />

        {contentUnlocked && (
          <div className="file-page__secondary-content">
            <section className="file-page__media-actions">
              <React.Suspense fallback={null}>
                {commentsDisabled ? (
                  <Empty {...emptyMsgProps} text={__('The creator of this content has disabled comments.')} />
                ) : isMobile && !isLandscapeRotated ? (
                  <React.Fragment>
                    <SwipeableDrawer type={DRAWERS.CHAT} title={<h2>{commentsListTitle}</h2>}>
                      <CommentsList {...commentsListProps} />
                    </SwipeableDrawer>

                    <DrawerExpandButton icon={ICONS.CHAT} label={<h2>{commentsListTitle}</h2>} type={DRAWERS.CHAT} />
                  </React.Fragment>
                ) : (
                  <CommentsList {...commentsListProps} notInDrawer />
                )}
              </React.Suspense>
            </section>
          </div>
        )}
      </div>

      <RecommendedContent uri={uri} />
    </>
  );
};

export default StreamClaimPage;
