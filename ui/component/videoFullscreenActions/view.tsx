import React from 'react';
import { lazyImport } from 'util/lazyImport';
import FileTitleSection from 'component/fileTitleSection';
import Empty from 'component/common/empty';
import Button from 'component/button';
import Icon from 'component/common/icon';
import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';
import * as TAGS from 'constants/tags';
import ShortsActions from 'component/shortsActions';
import MobileTabView from 'component/mobileTabView';
import RecommendedContent from 'component/recommendedContent';
import ChaptersCard from 'component/chaptersCard';
import PlaylistCard from 'component/playlistCard';
import parseChapters from 'util/parse-chapters';
import * as REACTION_TYPES from 'constants/reactions';
import { LINKED_COMMENT_QUERY_PARAM, THREAD_COMMENT_QUERY_PARAM } from 'constants/comment';
import { useIsMobile, useIsLandscapeScreen, ForceMobileProvider } from 'effects/use-screensize';
import { fullscreenElement as getFullscreenElement, exitFullscreen, onFullscreenChange } from 'util/full-screen';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import {
  selectClaimForUri,
  makeSelectTagInClaimOrChannelForUri,
  selectProtectedContentTagForUri,
} from 'redux/selectors/claims';
import { getChannelIdFromClaim } from 'util/claim';
import { selectCommentsDisabledSettingForChannelId } from 'redux/selectors/comments';
import { selectNoRestrictionOrUserIsMemberForContentClaimId } from 'redux/selectors/memberships';
import { selectPlayingCollectionId } from 'redux/selectors/content';
import { selectMyReactionForUri } from 'redux/selectors/reactions';
import { doOpenModal } from 'redux/actions/app';
import { doReactionLike, doReactionDislike } from 'redux/actions/reactions';

const CommentsList = lazyImport(() => import('component/commentsList'));
const ChatLayout = lazyImport(() => import('component/chat'));

type Props = {
  uri: string;
  isShort?: boolean;
  isLivestreamClaim?: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
  isAtStart?: boolean;
  isAtEnd?: boolean;
  hasPlaylist?: boolean;
  autoPlayNextShort?: boolean;
  doToggleShortsAutoplay?: () => void;
};

export default function VideoFullscreenActions(props: Props) {
  const {
    uri,
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

  const dispatch = useAppDispatch();

  const search = window.location.search || '';
  const urlParams = new URLSearchParams(search);

  const claim = useAppSelector((state) => (uri ? selectClaimForUri(state, uri) : undefined));
  const claimId = claim?.claim_id;
  const channelId = getChannelIdFromClaim(claim);
  const isProtectedContent = useAppSelector((state) => Boolean(selectProtectedContentTagForUri(state, uri)));
  const contentUnlocked = useAppSelector((state) =>
    claimId ? selectNoRestrictionOrUserIsMemberForContentClaimId(state, claimId) : undefined
  );
  const commentSettingDisabled = useAppSelector((state) => selectCommentsDisabledSettingForChannelId(state, channelId));
  const commentsDisabled = useAppSelector(
    (state) => commentSettingDisabled || makeSelectTagInClaimOrChannelForUri(uri, TAGS.DISABLE_COMMENTS_TAG)(state)
  );
  const linkedCommentId = urlParams.get(LINKED_COMMENT_QUERY_PARAM);
  const threadCommentId = urlParams.get(THREAD_COMMENT_QUERY_PARAM);
  const description = claim?.value?.description;
  const playingCollectionId = useAppSelector(selectPlayingCollectionId);
  const myReaction = useAppSelector((state) => selectMyReactionForUri(state, uri));
  const accessStatus = !isProtectedContent ? undefined : contentUnlocked ? 'unlocked' : 'locked';

  const handleOpenModal = React.useCallback(
    (...args: [id: any, modalProps?: any]) => dispatch(doOpenModal(...args)),
    [dispatch]
  );
  const handleReactionLike = React.useCallback(
    (reactionUri: string) => dispatch(doReactionLike(reactionUri)),
    [dispatch]
  );
  const handleReactionDislike = React.useCallback(
    (reactionUri: string) => dispatch(doReactionDislike(reactionUri)),
    [dispatch]
  );

  const isMobileSize = useIsMobile();
  const isLandscape = useIsLandscapeScreen();
  const [isFs, setIsFs] = React.useState(!!getFullscreenElement());
  const isMobile = isMobileSize || window.matchMedia('(pointer: coarse)').matches;
  const useSidePanel = isLandscape || !isMobileSize;


  React.useEffect(() => {
    const onFsChange = () => setIsFs(!!getFullscreenElement());
    onFullscreenChange(document, 'add', onFsChange);
    return () => onFullscreenChange(document, 'remove', onFsChange);
  }, []);
  const chapters = React.useMemo(() => parseChapters(description), [description]);
  const hasChapters = chapters.length > 0;
  const [panelMode, setPanelMode] = React.useState<string | null>(null);
  const [fireGlow, setFireGlow] = React.useState(false);
  const fireGlowTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [slimeGlow, setSlimeGlow] = React.useState(false);
  const slimeGlowTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartY = React.useRef(0);
  const touchStartX = React.useRef(0);
  const isDragging = React.useRef(false);

  const panelModeRef = React.useRef(panelMode);
  panelModeRef.current = panelMode;
  const handleTogglePanel = React.useCallback((mode) => {
    const next = panelModeRef.current === mode ? null : mode;
    if (next && sidePanelRef.current) {
      sidePanelRef.current.style.transition = '';
      sidePanelRef.current.style.transform = '';
    }
    setPanelMode(next);
    window.dispatchEvent(new CustomEvent('fullscreen-panel-change', { detail: { mode: next } }));
  }, []);

  const handleClosePanel = React.useCallback(() => {
    setPanelMode(null);
    window.dispatchEvent(new CustomEvent('fullscreen-panel-change', { detail: { mode: null } }));
  }, []);

  const sidePanelRef = React.useRef<HTMLDivElement>(null);

  const adjustVideoForSwipe = React.useCallback((deltaX) => {
    const fsTarget = document.querySelector('.player-fullscreen-target');
    if (!fsTarget) return;
    const contentWrapper = fsTarget.querySelector('.content__wrapper') as HTMLElement | null;
    const actions = fsTarget.querySelector('.video-fullscreen__actions') as HTMLElement | null;
    if (deltaX === null) {
      if (contentWrapper) {
        contentWrapper.style.removeProperty('margin-right');
        contentWrapper.style.removeProperty('transition');
      }
      if (actions) {
        actions.style.removeProperty('right');
        actions.style.removeProperty('transition');
      }
      return;
    }
    if (deltaX === 'dismiss') {
      if (contentWrapper) {
        contentWrapper.style.removeProperty('transition');
        contentWrapper.style.setProperty('margin-right', '0px', 'important');
      }
      if (actions) {
        actions.style.removeProperty('transition');
        actions.style.setProperty('right', '8px', 'important');
      }
      setTimeout(() => {
        if (contentWrapper) {
          contentWrapper.style.removeProperty('margin-right');
          contentWrapper.style.removeProperty('transition');
        }
        if (actions) {
          actions.style.removeProperty('right');
          actions.style.removeProperty('transition');
        }
      }, 350);
      return;
    }
    const panel = sidePanelRef.current;
    if (!panel) return;
    const panelWidth = panel.offsetWidth;
    const visibleWidth = Math.max(0, panelWidth - deltaX);
    if (contentWrapper) {
      contentWrapper.style.setProperty('transition', 'none', 'important');
      contentWrapper.style.setProperty('margin-right', visibleWidth + 'px', 'important');
    }
    if (actions) {
      actions.style.setProperty('transition', 'none', 'important');
      actions.style.setProperty('right', visibleWidth + 8 + 'px', 'important');
    }
  }, []);

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

  const handleSideTouchStart = React.useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
    isDragging.current = true;
    if (sidePanelRef.current) {
      sidePanelRef.current.style.transition = 'none';
    }
  }, []);

  const handleSideTouchMove = React.useCallback(
    (e) => {
      if (!isDragging.current || !sidePanelRef.current) return;
      const deltaX = e.touches[0].clientX - touchStartX.current;
      if (deltaX > 0) {
        sidePanelRef.current.style.transform = `translateX(${deltaX}px)`;
        adjustVideoForSwipe(deltaX);
      }
    },
    [adjustVideoForSwipe]
  );

  const handleSideTouchEnd = React.useCallback(
    (e) => {
      if (!isDragging.current || !sidePanelRef.current) return;
      isDragging.current = false;
      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      const panelWidth = sidePanelRef.current.offsetWidth;
      sidePanelRef.current.style.transition = '';
      if (deltaX > panelWidth * 0.3) {
        adjustVideoForSwipe('dismiss');
        sidePanelRef.current.style.transform = '';
        handleClosePanel();
      } else {
        adjustVideoForSwipe(null);
        sidePanelRef.current.style.transform = '';
      }
    },
    [handleClosePanel, adjustVideoForSwipe]
  );

  React.useEffect(() => {
    const onFsChange = () => {
      if (!getFullscreenElement()) {
        handleClosePanel();
      }
    };
    onFullscreenChange(document, 'add', onFsChange);
    return () => onFullscreenChange(document, 'remove', onFsChange);
  }, [handleClosePanel]);

  React.useEffect(() => {
    const onPanel = (e) => {
      const { mode } = e.detail;
      if (!useSidePanel && drawerOpenRef.current) {
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
  }, [handleTogglePanel, hasChapters, playingCollectionId, useSidePanel]);

  React.useEffect(() => {
    const panel = sidePanelRef.current;
    if (!panel) return;
    const onClick = (e) => {
      if (e.target.closest('a') && getFullscreenElement()) {
        exitFullscreen();
      }
    };
    panel.addEventListener('click', onClick);
    return () => panel.removeEventListener('click', onClick);
  }, []);

  const triggerFireGlow = React.useCallback(() => {
    setFireGlow(false);
    clearTimeout(fireGlowTimeout.current);
    requestAnimationFrame(() => {
      setFireGlow(true);
      fireGlowTimeout.current = setTimeout(() => setFireGlow(false), 2000);
    });
  }, []);

  const triggerSlimeGlow = React.useCallback(() => {
    setSlimeGlow(false);
    clearTimeout(slimeGlowTimeout.current);
    requestAnimationFrame(() => {
      setSlimeGlow(true);
      slimeGlowTimeout.current = setTimeout(() => setSlimeGlow(false), 3000);
    });
  }, []);

  const handleShareClick = React.useCallback(() => {
    handleOpenModal(MODALS.SOCIAL_SHARE, { uri, webShareable: true });
  }, [handleOpenModal, uri]);

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

  const prevSidePanelRef = React.useRef(useSidePanel);
  React.useEffect(() => {
    if (prevSidePanelRef.current === useSidePanel) return;
    prevSidePanelRef.current = useSidePanel;

    const fsTarget = document.querySelector('.player-fullscreen-target');
    if (fsTarget) fsTarget.classList.add('player-fullscreen-target--no-transition');

    if (!useSidePanel && panelMode) {
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
    } else if (useSidePanel && panelMode) {
      setPanelMode(panelMode);
      window.dispatchEvent(new CustomEvent('fullscreen-panel-change', { detail: { mode: panelMode } }));
      setTimeout(() => {
        if (fsTarget) fsTarget.classList.remove('player-fullscreen-target--no-transition');
      }, 150);
    } else if (fsTarget) {
      setTimeout(() => fsTarget.classList.remove('player-fullscreen-target--no-transition'), 150);
    }
  }, [useSidePanel, panelMode, tabModes]);

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
          useSidePanel ? 'video-fullscreen__actions-wrapper--landscape' : ''
        }`}
      >
        {useSidePanel ? (
          <div
            ref={sidePanelRef}
            className={`video-fullscreen__side-panel ${panelMode ? 'video-fullscreen__side-panel--open' : ''}`}
          >
            <div
              className="video-fullscreen__side-handle"
              onTouchStart={handleSideTouchStart}
              onTouchMove={handleSideTouchMove}
              onTouchEnd={handleSideTouchEnd}
            >
              <span className="video-fullscreen__puller video-fullscreen__puller--vertical" />
            </div>
            <div className="video-fullscreen__side-panel-inner">
              <ForceMobileProvider value={true}>
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
                    onSwipeDismiss={handleClosePanel}
                    swipeDismissRef={sidePanelRef}
                    onSwipeProgress={adjustVideoForSwipe}
                  />
                )}
              </ForceMobileProvider>
            </div>
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
          isFs && (
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
          )
        ) : (
          <>
            <div className="video-fullscreen__actions-group">
              <Button
                className={`video-fullscreen__action-btn video-fullscreen__action-btn--reaction ${
                  myReaction === REACTION_TYPES.LIKE ? 'button--fire' : ''
                } ${fireGlow ? 'button--fire-glow-pulse' : ''}`}
                onClick={() => {
                  if (myReaction !== REACTION_TYPES.LIKE) triggerFireGlow();
                  handleReactionLike(uri);
                }}
                icon={myReaction === REACTION_TYPES.LIKE ? ICONS.FIRE_ACTIVE : ICONS.FIRE}
                iconSize={18}
                title={__('Like')}
                label={
                  myReaction === REACTION_TYPES.LIKE ? (
                    <>
                      <div className="button__fire-glow" />
                      <div className="button__fire-particle1" />
                      <div className="button__fire-particle2" />
                      <div className="button__fire-particle3" />
                      <div className="button__fire-particle4" />
                      <div className="button__fire-particle5" />
                      <div className="button__fire-particle6" />
                    </>
                  ) : undefined
                }
              />
              <Button
                className={`video-fullscreen__action-btn video-fullscreen__action-btn--reaction ${
                  myReaction === REACTION_TYPES.DISLIKE ? 'button--slime' : ''
                } ${slimeGlow ? 'button--slime-glow-pulse' : ''}`}
                onClick={() => {
                  if (myReaction !== REACTION_TYPES.DISLIKE) triggerSlimeGlow();
                  handleReactionDislike(uri);
                }}
                icon={myReaction === REACTION_TYPES.DISLIKE ? ICONS.SLIME_ACTIVE : ICONS.SLIME}
                iconSize={18}
                title={__('Dislike')}
                label={
                  myReaction === REACTION_TYPES.DISLIKE ? (
                    <>
                      <div className="button__slime-stain" />
                      <div className="button__slime-drop1" />
                      <div className="button__slime-drop2" />
                    </>
                  ) : undefined
                }
              />
            </div>

            <div className="video-fullscreen__actions-group">
              <Button
                className={`video-fullscreen__action-btn ${
                  panelMode === 'info' ? 'video-fullscreen__action-btn--active' : ''
                }`}
                onClick={() => handleTogglePanel('info')}
                icon={ICONS.INFO}
                iconSize={18}
                title={__('Show Details')}
              />

              {hasChapters && (
                <Button
                  className={`video-fullscreen__action-btn ${
                    panelMode === 'chapters' ? 'video-fullscreen__action-btn--active' : ''
                  }`}
                  onClick={() => handleTogglePanel('chapters')}
                  icon={ICONS.VIEW_LIST}
                  iconSize={18}
                  title={__('Chapters')}
                />
              )}

              {hasPlaylist && (
                <Button
                  className={`video-fullscreen__action-btn ${
                    panelMode === 'playlist' ? 'video-fullscreen__action-btn--active' : ''
                  }`}
                  onClick={() => handleTogglePanel('playlist')}
                  icon={ICONS.PLAYLIST}
                  iconSize={18}
                  title={__('Playlist')}
                />
              )}

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
                  <Button
                    className={`video-fullscreen__action-btn ${
                      panelMode === 'related' ? 'video-fullscreen__action-btn--active' : ''
                    }`}
                    onClick={() => handleTogglePanel('related')}
                    icon={ICONS.DISCOVER}
                    iconSize={18}
                    title={__('Related')}
                  />
                </>
              )}
            </div>
          </>
        )}
      </div>

      <div
        ref={sidePanelRef}
        className={`video-fullscreen__side-panel ${panelMode ? 'video-fullscreen__side-panel--open' : ''} ${
          panelMode === 'chat' ? 'video-fullscreen__side-panel--chat' : ''
        } ${panelMode === 'playlist' ? 'video-fullscreen__side-panel--playlist' : ''} ${
          panelMode === 'chapters' ? 'video-fullscreen__side-panel--chapters' : ''
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
          {panelMode === 'info' && <FileTitleSection uri={uri} accessStatus={accessStatus} expandOverride />}
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
            <ChaptersCard uri={uri} description={description} visible setVisible={handleClosePanel} />
          )}
          {panelMode === 'playlist' && hasPlaylist && (
            <PlaylistCard id={playingCollectionId} uri={uri} onClose={handleClosePanel} />
          )}
          {panelMode === 'related' && <RecommendedContent uri={uri} />}
        </div>
      </div>
    </div>
  );
}
