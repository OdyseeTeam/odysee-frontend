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
import { useHistory } from 'react-router';

const CommentsList = lazyImport(() => import('component/commentsList' /* webpackChunkName: "comments" */));
const MarkdownPostPage = lazyImport(() => import('./internal/markdownPost' /* webpackChunkName: "markdownPost" */));
const VideoPlayersPage = lazyImport(() => import('./internal/videoPlayers' /* webpackChunkName: "videoPlayersPage" */));
const LivestreamPage = lazyImport(() => import('./internal/livestream' /* webpackChunkName: "livestream" */));
const ShortsPage = lazyImport(() => import('./internal/shorts'));

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
  isClaimFiltered: boolean,
  isClaimShort: boolean,
  disableShortsView: boolean,
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
    isClaimFiltered,
    doSetContentHistoryItem,
    doSetPrimaryUri,
    doToggleAppDrawer,
    isClaimShort,
    disableShortsView,
  } = props;

  const isMobile = useIsMobile();
  const isLandscapeRotated = useIsMobileLandscape();
  const history = useHistory();

  const isHidden = isClaimFiltered || isClaimBlackListed;

  const cost = costInfo ? costInfo.cost : null;
  const isMarkdown = renderMode === RENDER_MODES.MARKDOWN;
  const accessStatus = !isProtectedContent ? undefined : contentUnlocked ? 'unlocked' : 'locked';

  const { search } = history.location;

  const urlParams = new URLSearchParams(search);
  const shortsView = urlParams.get('view') === 'shorts';
  const isShortVideo = isClaimShort && !disableShortsView;

  React.useEffect(() => {
    if ((linkedCommentId || threadCommentId) && isMobile) {
      doToggleAppDrawer(DRAWERS.CHAT);
    }
    // only on mount, otherwise clicking on a comments timestamp and linking it
    // would trigger the drawer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (!isClaimShort && shortsView) {
      const urlParams = new URLSearchParams(search);
      urlParams.delete('view');
      const newSearch = urlParams.toString();
      const { pathname } = window.location;
      const newUrl = `${pathname}${newSearch ? `?${newSearch}` : ''}`;
      window.history.replaceState({}, '', newUrl);
      window.location.reload();
    }
  }, [isClaimShort, shortsView, search]);

  React.useEffect(() => {
    const urlParams = new URLSearchParams(search);
    if (isShortVideo && !shortsView) {
      urlParams.set('view', 'shorts');
      const newSearch = urlParams.toString();
      const { pathname } = window.location;
      const newUrl = `${pathname}?${newSearch}`;
      window.history.replaceState({}, '', newUrl);
    } else if (!isShortVideo && shortsView) {
      urlParams.delete('view');
      const newSearch = urlParams.toString();
      history.replace(`${history.location.pathname}${newSearch ? `?${newSearch}` : ''}`);
    }
  }, [isShortVideo, shortsView, urlParams, search]);

  React.useEffect(() => {
    doSetContentHistoryItem(uri);
    doSetPrimaryUri(uri);

    return () => doSetPrimaryUri(null);
  }, [doSetContentHistoryItem, doSetPrimaryUri, uri]);

  if (!isHidden && isMarkdown) {
    return (
      <React.Suspense fallback={null}>
        <MarkdownPostPage uri={uri} accessStatus={accessStatus} />
      </React.Suspense>
    );
  }

  if (!isHidden && RENDER_MODES.FLOATING_MODES.includes(renderMode)) {
    if (isLivestream) {
      return (
        <React.Suspense fallback={null}>
          <LivestreamPage uri={uri} accessStatus={accessStatus} />
        </React.Suspense>
      );
    }

    if (isShortVideo) {
      return (
        <React.Suspense fallback={null}>
          <ShortsPage uri={uri} accessStatus={accessStatus} key={uri} />
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

  function filteredInfo() {
    return (
      <section className="card--section dmca-info">
        <p>{__('This content violates the terms and conditions of Odysee and has been filtered.')}</p>
        <p>
          {__('Please remove the content, or reach out to %email% if you think there has been a mistake.', {
            email: 'help@odysee.com',
          })}
        </p>
        <div className="section__actions">
          <Button button="link" href="https://help.odysee.tv/communityguidelines/" label={__('Read More')} />
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
        {!isHidden && renderClaimLayout()}
        {(isClaimBlackListed && dmcaInfo()) || (isClaimFiltered && filteredInfo())}

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
