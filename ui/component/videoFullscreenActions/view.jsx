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
import ChaptersCard from 'component/chaptersCard';
import PlaylistCard from 'component/playlistCard';
import parseChapters from 'util/parse-chapters';
import { useIsMobile, useIsLandscapeScreen } from 'effects/use-screensize';

const CommentsList = lazyImport(() => import('component/commentsList'));
const ChatLayout = lazyImport(() => import('component/chat'));

type Props = {
  uri: string,
  accessStatus: ?string,
  contentUnlocked: boolean,
  commentsDisabled: ?boolean,
  linkedCommentId?: string,
  threadCommentId?: string,
  description: ?string,
  doOpenModal: (id: string, props: any) => void,
  doCloseAppDrawer: () => void,
  isShort?: boolean,
  isLivestreamClaim?: boolean,
  onNext?: () => void,
  onPrevious?: () => void,
  isAtStart?: boolean,
  isAtEnd?: boolean,
  hasPlaylist?: boolean,
  playingCollectionId: ?string,
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
    description,
    doOpenModal,
    doCloseAppDrawer,
    isShort,
    isLivestreamClaim,
    onNext,
    onPrevious,
    isAtStart,
    isAtEnd,
    hasPlaylist,
    playingCollectionId,
    autoPlayNextShort,
    doToggleShortsAutoplay,
  } = props;

  const isMobileSize = useIsMobile();
  const isLandscape = useIsLandscapeScreen();
  const wasMobileRef = React.useRef(isMobileSize);
  // $FlowFixMe
  const [isFs, setIsFs] = React.useState(!!document.fullscreenElement);

  React.useEffect(() => {
    if (!isFs) wasMobileRef.current = isMobileSize;
  }, [isMobileSize, isFs]);

  React.useEffect(() => {
    // $FlowFixMe
    const onFsChange = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const isMobile = isFs ? wasMobileRef.current : isMobileSize;
  const chapters = React.useMemo(() => parseChapters(description), [description]);
  const hasChapters = chapters.length > 0;
  const [panelMode, setPanelMode] = React.useState(null);
  const touchStartY = React.useRef(0);
  const isDragging = React.useRef(false);

  const panelModeRef = React.useRef(panelMode);
  panelModeRef.current = panelMode;
  const handleTogglePanel = React.useCallback((mode) => {
    const next = panelModeRef.current === mode ? null : mode;
    setPanelMode(next);
    window.dispatchEvent(new CustomEvent('fullscreen-panel-change', { detail: { mode: next } }));
  }, []);

  const handleClosePanel = React.useCallback(() => {
    if (sidePanelRef.current) {
      sidePanelRef.current.style.transition = '';
      sidePanelRef.current.style.transform = '';
    }
    setPanelMode(null);
    window.dispatchEvent(new CustomEvent('fullscreen-panel-change', { detail: { mode: null } }));
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
    const onPanel = (e: any) => {
      const { mode } = e.detail;
      if (!isLandscape && drawerOpenRef.current) {
        const tabs = ['info'];
        if (hasChapters) tabs.push('chapters');
        if (playingCollectionId) tabs.push('playlist');
        tabs.push('comments', 'related');
        const idx = tabs.indexOf(mode);
        if (idx >= 0) {
          drawerOpenRef.current(idx);
        }
      } else {
        handleTogglePanel(mode);
      }
    };
    window.addEventListener('fullscreen-panel', onPanel);
    return () => window.removeEventListener('fullscreen-panel', onPanel);
  }, [handleTogglePanel, hasChapters, playingCollectionId, isLandscape]);

  React.useEffect(() => {
    const panel = sidePanelRef.current;
    if (!panel) return;
    const onClick = (e: any) => {
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
  const drawerOpenRef = React.useRef((index: number, instant?: boolean) => {}); // eslint-disable-line no-unused-vars

  const tabModes = React.useMemo(() => {
    const modes = ['info'];
    if (hasChapters) modes.push('chapters');
    if (hasPlaylist) modes.push('playlist');
    modes.push(isLivestreamClaim ? 'chat' : 'comments', 'related');
    return modes;
  }, [hasChapters, hasPlaylist, isLivestreamClaim]);

  const handleDrawerTabChange = React.useCallback(
    (index) => {
      const mode = tabModes[index] || null;
      setPanelMode(mode);
      window.dispatchEvent(new CustomEvent('fullscreen-panel-change', { detail: { mode } }));
    },
    [tabModes]
  );

  const handleDrawerClose = React.useCallback(() => {
    setPanelMode(null);
    window.dispatchEvent(new CustomEvent('fullscreen-panel-change', { detail: { mode: null } }));
  }, []);

  const prevLandscapeRef = React.useRef(isLandscape);
  React.useEffect(() => {
    if (prevLandscapeRef.current === isLandscape) return;
    prevLandscapeRef.current = isLandscape;

    const fsTarget = document.querySelector('.player-fullscreen-target');
    if (fsTarget) fsTarget.classList.add('player-fullscreen-target--no-transition');

    if (!isLandscape && panelMode) {
      const idx = tabModes.indexOf(panelMode);
      if (idx >= 0) {
        setTimeout(() => {
          drawerOpenRef.current(idx, true);
          setTimeout(() => {
            if (fsTarget) fsTarget.classList.remove('player-fullscreen-target--no-transition');
          }, 50);
        }, 100);
      } else if (fsTarget) {
        setTimeout(() => fsTarget.classList.remove('player-fullscreen-target--no-transition'), 150);
      }
    } else if (isLandscape && panelMode) {
      setPanelMode(panelMode);
      window.dispatchEvent(new CustomEvent('fullscreen-panel-change', { detail: { mode: panelMode } }));
      setTimeout(() => {
        if (fsTarget) fsTarget.classList.remove('player-fullscreen-target--no-transition');
      }, 150);
    } else if (fsTarget) {
      setTimeout(() => fsTarget.classList.remove('player-fullscreen-target--no-transition'), 150);
    }
  }, [isLandscape, panelMode, tabModes]);

  if (!isShort && isMobile) {
    const infoContent = (
      <div className="file-page">
        <div className="card-stack">
          <section className="file-page__media-actions">
            <FileTitleSection uri={uri} accessStatus={accessStatus} expandOverride />
          </section>
        </div>
      </div>
    );

    const commentsContent = isLivestreamClaim ? (
      <React.Suspense fallback={null}>
        <ChatLayout uri={uri} />
      </React.Suspense>
    ) : contentUnlocked && !commentsDisabled ? (
      <div>
        <React.Suspense fallback={null}>
          <CommentsList {...commentsListProps} notInDrawer />
        </React.Suspense>
      </div>
    ) : (
      <Empty padded={false} text={__('The creator of this content has disabled comments.')} />
    );

    const chaptersContent = hasChapters ? (
      <ChaptersCard uri={uri} description={description} visible setVisible={() => {}} />
    ) : undefined;

    const playlistContent = hasPlaylist ? <PlaylistCard id={playingCollectionId} uri={uri} /> : undefined;

    const relatedContent = <RecommendedContent uri={uri} />;

    const tabDefs = [{ icon: ICONS.INFO, label: 'Info' }];
    if (hasChapters) tabDefs.push({ icon: ICONS.VIEW_LIST, label: 'Chapters' });
    if (hasPlaylist) tabDefs.push({ icon: ICONS.PLAYLIST, label: 'Playlist' });
    tabDefs.push(
      { icon: isLivestreamClaim ? ICONS.CHAT : ICONS.COMMENTS_LIST, label: isLivestreamClaim ? 'Chat' : 'Comments' },
      { icon: ICONS.DISCOVER, label: 'Related' }
    );

    const commentsIdx = tabDefs.length - 2;
    const relatedIdx = tabDefs.length - 1;

    return (
      <div
        className={`video-fullscreen__actions-wrapper ${
          isLandscape ? 'video-fullscreen__actions-wrapper--landscape' : ''
        }`}
      >
        <div className="video-fullscreen__actions">
          <Button
            className="video-fullscreen__action-btn"
            onClick={() => (isLandscape ? handleTogglePanel('info') : drawerOpenRef.current(0))}
            icon={ICONS.INFO}
            iconSize={18}
            title={__('Show Details')}
          />

          <div className="video-fullscreen__reactions-no-count">
            <FileReactions uri={uri} />
          </div>

          <Button
            className="video-fullscreen__action-btn"
            onClick={() =>
              isLandscape
                ? handleTogglePanel(isLivestreamClaim ? 'chat' : 'comments')
                : drawerOpenRef.current(commentsIdx)
            }
            icon={isLivestreamClaim ? ICONS.CHAT : ICONS.COMMENTS_LIST}
            iconSize={18}
            title={isLivestreamClaim ? __('Chat') : __('Comments')}
          />

          <Button
            className="video-fullscreen__action-btn"
            onClick={() => (isLandscape ? handleTogglePanel('related') : drawerOpenRef.current(relatedIdx))}
            icon={ICONS.DISCOVER}
            iconSize={18}
            title={__('Related')}
          />
        </div>

        {isLandscape ? (
          // $FlowFixMe
          <div
            ref={sidePanelRef}
            className={`video-fullscreen__side-panel ${panelMode ? 'video-fullscreen__side-panel--open' : ''}`}
          >
            {panelMode && (
              <MobileTabView
                tabDefs={tabDefs}
                infoContent={infoContent}
                chaptersContent={chaptersContent}
                playlistContent={playlistContent}
                commentsContent={commentsContent}
                relatedContent={relatedContent}
                initialTab={tabModes.indexOf(panelMode)}
                onTabChange={handleDrawerTabChange}
              />
            )}
          </div>
        ) : (
          <MobileTabView
            useDrawer
            drawerOpenRef={drawerOpenRef}
            tabDefs={tabDefs}
            infoContent={infoContent}
            chaptersContent={chaptersContent}
            playlistContent={playlistContent}
            commentsContent={commentsContent}
            relatedContent={relatedContent}
            initialTab={linkedCommentId ? 1 : 0}
            onTabChange={handleDrawerTabChange}
            onDrawerClose={handleDrawerClose}
          />
        )}
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

            {isLivestreamClaim ? (
              <Button
                className={`video-fullscreen__action-btn ${
                  panelMode === 'chat' ? 'video-fullscreen__action-btn--active' : ''
                }`}
                onClick={() => handleTogglePanel('chat')}
                icon={ICONS.CHAT}
                iconSize={18}
                title={__('Chat')}
              />
            ) : (
              <>
                <Button
                  className={`video-fullscreen__action-btn ${
                    panelMode === 'comments' ? 'video-fullscreen__action-btn--active' : ''
                  }`}
                  onClick={() => handleTogglePanel('comments')}
                  icon={ICONS.COMMENTS_LIST}
                  iconSize={18}
                  title={__('Comments')}
                />
                {isMobile && (
                  <Button
                    className={`video-fullscreen__action-btn ${
                      panelMode === 'related' ? 'video-fullscreen__action-btn--active' : ''
                    }`}
                    onClick={() => handleTogglePanel('related')}
                    icon={ICONS.DISCOVER}
                    iconSize={18}
                    title={__('Related')}
                  />
                )}
              </>
            )}
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
          {panelMode === 'chapters' && hasChapters && (
            <ChaptersCard uri={uri} description={description} visible setVisible={() => {}} />
          )}
          {panelMode === 'related' && <RecommendedContent uri={uri} />}
        </div>
      </div>
    </div>
  );
}
