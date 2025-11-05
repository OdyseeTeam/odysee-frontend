// @flow
import * as React from 'react';
import { createPortal } from 'react-dom';
import { lazyImport } from 'util/lazyImport';
import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';
import * as REACTION_TYPES from 'constants/reactions';
import FileTitleSection from 'component/fileTitleSection';
import Empty from 'component/common/empty';
import Button from 'component/button';
import classnames from 'classnames';
import { formatNumberWithCommas } from 'util/number';
import Skeleton from '@mui/material/Skeleton';
import './style.scss';

const CommentsList = lazyImport(() => import('component/commentsList' /* webpackChunkName: "comments" */));

type Props = {
  hasPlaylist: boolean,
  isLoading?: boolean,
  isOpen: boolean,
  onClose: () => void,
  onInfoClick: () => void,
  onNext: () => void,
  onPrevious: () => void,
  hasNext: boolean,
  hasPrevious: boolean,
  isLoading?: boolean,
  uri: string,
  accessStatus: ?string,
  contentUnlocked: boolean,
  commentsDisabled: ?boolean,
  commentsListTitle: string,
  linkedCommentId?: string,
  threadCommentId?: string,
  autoPlayNextShort?: boolean,
  doToggleShortsAutoplay?: () => void,
  // Redux - reactions
  claimId?: string,
  likeCount: number,
  dislikeCount: number,
  myReaction: ?string,
  isLivestreamClaim?: boolean,
  doFetchReactions: (claimId: ?string) => void,
  doReactionLike: (uri: string) => void,
  doReactionDislike: (uri: string) => void,
  // Redux - share
  webShareable: boolean,
  collectionId?: string,
  isUnlisted: ?boolean,
  doOpenModal?: (id: string, modalProps: any) => void,
  onCommentsClick?: () => void,
  onInfoButtonClick?: () => void,
  isComments?: boolean,
};

const LIVE_REACTION_FETCH_MS = 1000 * 45;

export default function MobilePanel(props: Props) {
  const {
    isOpen,
    onClose,
    onInfoButtonClick,
    uri,
    accessStatus,
    contentUnlocked,
    commentsDisabled,
    linkedCommentId,
    threadCommentId,
    autoPlayNextShort,
    doToggleShortsAutoplay,
    onCommentsClick,
    isComments,
    // Reactions
    claimId,
    likeCount,
    dislikeCount,
    myReaction,
    isLivestreamClaim,
    doFetchReactions,
    doReactionLike,
    doReactionDislike,
    // Share
    webShareable,
    collectionId,
    isUnlisted,
    doOpenModal,
  } = props;

  const modalRef = React.useRef();
  const [isClosing, setIsClosing] = React.useState(false);

  const handleClose = React.useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 250);
  }, [onClose]);

  // Handle share button click
  const handleShareClick = React.useCallback(() => {
    doOpenModal(MODALS.SOCIAL_SHARE, { uri, webShareable, collectionId });
  }, [doOpenModal, uri, webShareable, collectionId]);

  // Fetch reactions
  React.useEffect(() => {
    function fetchReactions() {
      doFetchReactions(claimId);
    }

    let fetchInterval;
    if (claimId) {
      fetchReactions();

      if (isLivestreamClaim) {
        fetchInterval = setInterval(fetchReactions, LIVE_REACTION_FETCH_MS);
      }
    }

    return () => {
      if (fetchInterval) {
        clearInterval(fetchInterval);
      }
    };
  }, [claimId, doFetchReactions, isLivestreamClaim]);

  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleClose]);

  const handleBackdropClick = (e) => {
    if (e.target === modalRef.current) {
      handleClose();
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
    }
  }, [isOpen]);

  const Placeholder = <Skeleton variant="text" animation="wave" className="reaction-count-placeholder" />;

  return createPortal(
    <div className={`shorts-mobile-panel ${isOpen ? 'shorts-mobile-panel--modal-open' : ''}`}>
      <div className="shorts-mobile-panel__actions">
        <div className="shorts-mobile-panel__action-item">
          <Button
            onClick={() => doReactionLike(uri)}
            icon={myReaction === REACTION_TYPES.LIKE ? ICONS.FIRE_ACTIVE : ICONS.FIRE}
            iconSize={24}
            title={__('I Like This')}
            requiresAuth
            authSrc="filereaction_like"
            className={classnames('shorts-mobile-panel__action-button button--file-action button-like', {
              'button--fire': myReaction === REACTION_TYPES.LIKE,
            })}
            label={
              <>
                {myReaction === REACTION_TYPES.LIKE && (
                  <>
                    <div className="button__fire-glow" />
                    <div className="button__fire-particle1" />
                    <div className="button__fire-particle2" />
                    <div className="button__fire-particle3" />
                    <div className="button__fire-particle4" />
                    <div className="button__fire-particle5" />
                    <div className="button__fire-particle6" />
                  </>
                )}
              </>
            }
          />
          <span className="shorts-mobile-panel__count">
            {Number.isInteger(likeCount) ? formatNumberWithCommas(likeCount, 0) : Placeholder}
          </span>
        </div>

        <div className="shorts-mobile-panel__action-item">
          <Button
            requiresAuth
            authSrc={'filereaction_dislike'}
            title={__('I dislike this')}
            className={classnames('shorts-mobile-panel__action-button button--file-action button-dislike', {
              'button--slime': myReaction === REACTION_TYPES.DISLIKE,
            })}
            label={
              <>
                {myReaction === REACTION_TYPES.DISLIKE && (
                  <>
                    <div className="button__slime-stain" />
                    <div className="button__slime-drop1" />
                    <div className="button__slime-drop2" />
                  </>
                )}
              </>
            }
            iconSize={24}
            icon={myReaction === REACTION_TYPES.DISLIKE ? ICONS.SLIME_ACTIVE : ICONS.SLIME}
            onClick={() => doReactionDislike(uri)}
          />
          <span className="shorts-mobile-panel__count">
            {Number.isInteger(dislikeCount) ? formatNumberWithCommas(dislikeCount, 0) : Placeholder}
          </span>
        </div>

        <div className="shorts-mobile-panel__action-item">
          <Button
            className="shorts-mobile-panel__action-button"
            onClick={onCommentsClick}
            icon={ICONS.COMMENTS_LIST}
            iconSize={20}
          />
          <span className="shorts-mobile-panel__count">Comments</span>
        </div>
        <div className="shorts-mobile-panel__action-item">
          <Button
            className="shorts-mobile-panel__action-button"
            onClick={handleShareClick}
            icon={ICONS.SHARE}
            iconSize={24}
            title={isUnlisted ? __('Get a sharable link for your unlisted content') : __('Share')}
          />
          <span className="shorts-mobile-panel__count">Share</span>
        </div>

        <div className="shorts-mobile-panel__action-item">
          <Button
            className="shorts-mobile-panel__action-button"
            onClick={onInfoButtonClick}
            icon={ICONS.INFO}
            iconSize={20}
          />
          <span className="shorts-mobile-panel__count">Details</span>
        </div>

        <div className="shorts-mobile-panel__action-item">
          <Button
            className={classnames('shorts-mobile-panel__action-button button-bubble', {
              'button-bubble--active': autoPlayNextShort,
            })}
            isShorts
            requiresAuth={IS_WEB}
            title={__('Autoplay Next')}
            onClick={doToggleShortsAutoplay}
            icon={ICONS.AUTOPLAY_NEXT}
            iconSize={24}
          />
          <span className="shorts-mobile-panel__count">Auto Next</span>
        </div>
      </div>

      {(isOpen || isClosing) && (
        <div
          className={`shorts-mobile-panel__backdrop ${isClosing ? 'shorts-mobile-panel__backdrop--closing' : ''}`}
          ref={modalRef}
          onClick={handleBackdropClick}
        >
          <div className={`shorts-mobile-panel__modal ${isClosing ? 'shorts-mobile-panel__modal--closing' : ''}`}>
            <div className="shorts-mobile-panel__header">
              <div className="shorts-mobile-panel__drag-handle" />
              <div className="shorts-mobile-panel__title-section">
                <div>{__('Video Details')}</div>
                <Button
                  className="shorts-mobile-panel__close-button"
                  onClick={handleClose}
                  icon={ICONS.REMOVE}
                  iconSize={20}
                  title={__('Close')}
                />
              </div>
            </div>

            <div className="shorts-page__side-panel-content">
              {!isComments ? (
                <FileTitleSection uri={uri} accessStatus={accessStatus} />
              ) : (
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
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
