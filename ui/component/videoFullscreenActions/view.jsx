// @flow
import React from 'react';
import { lazyImport } from 'util/lazyImport';
import FileTitleSection from 'component/fileTitleSection';
import FileReactions from 'component/fileReactions';
import Empty from 'component/common/empty';
import Button from 'component/button';
import Icon from 'component/common/icon';
import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';
import ShortsActions from 'component/shortsActions';
import MobileTabView from 'component/mobileTabView';
import RecommendedContent from 'component/recommendedContent';
import { useIsMobile } from 'effects/use-screensize';

const CommentsList = lazyImport(() => import('component/commentsList'));
const ChatLayout = lazyImport(() => import('component/chat'));

type Props = {
  uri: string,
  accessStatus: ?string,
  contentUnlocked: boolean,
  commentsDisabled: ?boolean,
  linkedCommentId?: string,
  threadCommentId?: string,
  doOpenModal: (id: string, props: any) => void,
  doCloseAppDrawer: () => void,
  isShort?: boolean,
  isLivestreamClaim?: boolean,
  onNext?: () => void,
  onPrevious?: () => void,
  isAtStart?: boolean,
  isAtEnd?: boolean,
  hasPlaylist?: boolean,
  autoPlayNextShort?: boolean,
  doToggleShortsAutoplay?: () => void,
};

export default function VideoFullscreenActions(props: Props) {
  const {
    uri,
    accessStatus,
    contentUnlocked,
    commentsDisabled,
    linkedCommentId,
    threadCommentId,
    doOpenModal,
    doCloseAppDrawer,
    isShort,
    isLivestreamClaim,
    onNext,
    onPrevious,
    isAtStart,
    isAtEnd,
    hasPlaylist,
    autoPlayNextShort,
    doToggleShortsAutoplay,
  } = props;

  const isMobile = useIsMobile();
  const [panelMode, setPanelMode] = React.useState(null);
  const touchStartY = React.useRef(0);
  const isDragging = React.useRef(false);

  const handleTogglePanel = React.useCallback((mode) => {
    setPanelMode((prev) => (prev === mode ? null : mode));
  }, []);

  const handleClosePanel = React.useCallback(() => {
    if (sidePanelRef.current) {
      sidePanelRef.current.style.transition = '';
      sidePanelRef.current.style.transform = '';
    }
    setPanelMode(null);
  }, []);

  const sidePanelRef = React.useRef(null);

  const handleTouchStart = React.useCallback((e) => {
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = true;
    if (sidePanelRef.current) {
      sidePanelRef.current.style.transition = 'none';
    }
  }, []);

  const handleTouchMove = React.useCallback((e) => {
    if (!isDragging.current || !sidePanelRef.current) return;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    if (deltaY > 0) {
      sidePanelRef.current.style.transform = `translateY(${deltaY}px)`;
    }
  }, []);

  const handleTouchEnd = React.useCallback(
    (e) => {
      if (!isDragging.current || !sidePanelRef.current) return;
      isDragging.current = false;
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;
      const panelHeight = sidePanelRef.current.offsetHeight;
      sidePanelRef.current.style.transition = '';
      if (deltaY > panelHeight * 0.3) {
        sidePanelRef.current.style.transform = '';
        handleClosePanel();
      } else {
        sidePanelRef.current.style.transform = '';
      }
    },
    [handleClosePanel]
  );

  React.useEffect(() => {
    const onFsChange = () => {
      // $FlowFixMe
      if (!document.fullscreenElement) {
        handleClosePanel();
        doCloseAppDrawer();
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, [handleClosePanel, doCloseAppDrawer]);

  React.useEffect(() => {
    const panel = sidePanelRef.current;
    if (!panel) return;
    const onClick = (e) => {
      // $FlowFixMe
      if (e.target.closest('a') && document.fullscreenElement) {
        // $FlowFixMe
        document.exitFullscreen().catch(() => {});
      }
    };
    panel.addEventListener('click', onClick);
    return () => panel.removeEventListener('click', onClick);
  }, []);

  const handleShareClick = React.useCallback(() => {
    doOpenModal(MODALS.SOCIAL_SHARE, { uri, webShareable: true });
  }, [doOpenModal, uri]);

  const commentsListProps = { uri, linkedCommentId, threadCommentId };
  const drawerOpenRef = React.useRef((index: number) => {}); // eslint-disable-line no-unused-vars

  if (!isShort && !isLivestreamClaim) {
    const infoContent = (
      <div className="file-page" style={{ padding: '0 var(--spacing-xs)' }}>
        <div className="card-stack">
          <section className="file-page__media-actions">
            <FileTitleSection uri={uri} accessStatus={accessStatus} expandOverride />
          </section>
        </div>
      </div>
    );

    const commentsContent =
      contentUnlocked && !commentsDisabled ? (
        <React.Suspense fallback={null}>
          <CommentsList {...commentsListProps} notInDrawer />
        </React.Suspense>
      ) : (
        <Empty padded={false} text={__('The creator of this content has disabled comments.')} />
      );

    const relatedContent = (
      <div style={{ padding: '0 var(--spacing-xs)' }}>
        <RecommendedContent uri={uri} />
      </div>
    );

    return (
      <div className="video-fullscreen__actions-wrapper">
        <div className="video-fullscreen__actions">
          <Button
            className="video-fullscreen__action-btn"
            onClick={() => drawerOpenRef.current(0)}
            icon={ICONS.INFO}
            iconSize={18}
            title={__('Show Details')}
          />

          <div className="video-fullscreen__reactions-no-count">
            <FileReactions uri={uri} />
          </div>

          <Button
            className="video-fullscreen__action-btn"
            onClick={() => drawerOpenRef.current(1)}
            icon={ICONS.COMMENTS_LIST}
            iconSize={18}
            title={__('Comments')}
          />
        </div>

        <MobileTabView
          useDrawer
          drawerOpenRef={drawerOpenRef}
          infoContent={infoContent}
          commentsContent={commentsContent}
          relatedContent={relatedContent}
          initialTab={linkedCommentId ? 1 : 0}
        />
      </div>
    );
  }

  return (
    <div className={`video-fullscreen__actions-wrapper ${isShort ? 'video-fullscreen__actions-wrapper--shorts' : ''}`}>
      <div className={`video-fullscreen__actions ${isShort ? 'video-fullscreen__actions--shorts' : ''}`}>
        {isShort ? (
          <ShortsActions
            uri={uri}
            hasPlaylist={hasPlaylist || false}
            onNext={onNext || (() => {})}
            onPrevious={onPrevious || (() => {})}
            isAtStart={isAtStart}
            isAtEnd={isAtEnd}
            autoPlayNextShort={autoPlayNextShort || false}
            doToggleShortsAutoplay={doToggleShortsAutoplay || (() => {})}
            onCommentsClick={() => handleTogglePanel('comments')}
            onInfoClick={() => handleTogglePanel('info')}
            handleShareClick={handleShareClick}
          />
        ) : (
          <>
            <Button
              className={`video-fullscreen__action-btn ${
                panelMode === 'info' ? 'video-fullscreen__action-btn--active' : ''
              }`}
              onClick={() => handleTogglePanel('info')}
              icon={ICONS.INFO}
              iconSize={18}
              title={__('Show Details')}
            />

            <div className="video-fullscreen__reactions-no-count">
              <FileReactions uri={uri} />
            </div>

            <Button
              className={`video-fullscreen__action-btn ${
                panelMode === 'chat' ? 'video-fullscreen__action-btn--active' : ''
              }`}
              onClick={() => handleTogglePanel('chat')}
              icon={ICONS.CHAT}
              iconSize={18}
              title={__('Chat')}
            />
          </>
        )}
      </div>

      {/* $FlowFixMe */}
      <div
        ref={sidePanelRef}
        className={`video-fullscreen__side-panel ${panelMode ? 'video-fullscreen__side-panel--open' : ''} ${
          panelMode === 'chat' ? 'video-fullscreen__side-panel--chat' : ''
        } ${isMobile ? 'video-fullscreen__side-panel--mobile' : ''}`}
      >
        {isMobile && (
          <div
            className="video-fullscreen__sheet-header"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <span className="video-fullscreen__puller" />
            <Button
              className="video-fullscreen__close-button"
              onClick={handleClosePanel}
              icon={ICONS.REMOVE}
              iconSize={20}
              title={__('Close')}
            />
          </div>
        )}
        {!isMobile && (
          <div className="video-fullscreen__close-button-container">
            <Button
              className="video-fullscreen__close-button"
              onClick={handleClosePanel}
              icon={ICONS.REMOVE}
              iconSize={20}
              title={__('Close')}
            />
          </div>
        )}

        <div className="video-fullscreen__side-panel-content">
          {panelMode === 'info' && <FileTitleSection uri={uri} accessStatus={accessStatus} />}
          {panelMode === 'chat' && (
            <>
              <button className="video-fullscreen__chat-close-button" onClick={handleClosePanel} title={__('Close')}>
                <Icon size={18} icon={ICONS.REMOVE} />
              </button>
              <React.Suspense fallback={null}>
                <ChatLayout uri={uri} />
              </React.Suspense>
            </>
          )}
          {panelMode === 'comments' && (
            <>
              <FileTitleSection uri={uri} accessStatus={accessStatus} hideDescription />
              {contentUnlocked &&
                (commentsDisabled ? (
                  <Empty padded text={__('The creator of this content has disabled comments.')} />
                ) : (
                  <React.Suspense fallback={null}>
                    <CommentsList
                      uri={uri}
                      linkedCommentId={linkedCommentId}
                      threadCommentId={threadCommentId}
                      notInDrawer
                    />
                  </React.Suspense>
                ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
