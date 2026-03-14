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

  const [panelMode, setPanelMode] = React.useState(null);

  const handleTogglePanel = React.useCallback((mode) => {
    setPanelMode((prev) => (prev === mode ? null : mode));
  }, []);

  const handleClosePanel = React.useCallback(() => {
    setPanelMode(null);
  }, []);

  const sidePanelRef = React.useRef(null);

  React.useEffect(() => {
    const onFsChange = () => {
      // $FlowFixMe
      if (!document.fullscreenElement) {
        setPanelMode(null);
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

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
              <Button
                className={`video-fullscreen__action-btn ${
                  panelMode === 'comments' ? 'video-fullscreen__action-btn--active' : ''
                }`}
                onClick={() => handleTogglePanel('comments')}
                icon={ICONS.COMMENTS_LIST}
                iconSize={18}
                title={__('Comments')}
              />
            )}
          </>
        )}
      </div>

      {/* $FlowFixMe */}
      <div
        ref={sidePanelRef}
        className={`video-fullscreen__side-panel ${panelMode ? 'video-fullscreen__side-panel--open' : ''} ${
          panelMode === 'chat' ? 'video-fullscreen__side-panel--chat' : ''
        }`}
      >
        <div className="video-fullscreen__close-button-container">
          <Button
            className="video-fullscreen__close-button"
            onClick={handleClosePanel}
            icon={ICONS.REMOVE}
            iconSize={20}
            title={__('Close')}
          />
        </div>

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
