// @flow
import * as React from 'react';
import { createPortal } from 'react-dom';
import { lazyImport } from 'util/lazyImport';
import * as ICONS from 'constants/icons';
import FileTitleSection from 'component/fileTitleSection';
import Empty from 'component/common/empty';
import Button from 'component/button';
import './style.scss';

const CommentsList = lazyImport(() => import('component/commentsList' /* webpackChunkName: "comments" */));

type Props = {
  isOpen: boolean,
  onClose: () => void,
  uri: string,
  accessStatus: ?string,
  contentUnlocked: boolean,
  commentsDisabled: ?boolean,
  linkedCommentId?: string,
  threadCommentId?: string,
  isComments?: boolean,
};

export default function MobilePanel(props: Props) {
  const {
    isOpen,
    onClose,
    uri,
    accessStatus,
    contentUnlocked,
    commentsDisabled,
    linkedCommentId,
    threadCommentId,
    isComments,
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

  React.useEffect(() => {
    const handleEscape: any = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // $FlowIssue
      if (document.body?.style) document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      // $FlowIssue
      if (document.body?.style) document.body.style.overflow = 'unset';
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

  return createPortal(
    <div className={`shorts-mobile-panel ${isOpen ? 'shorts-mobile-panel--modal-open' : ''}`}>
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
                <div>{isComments ? __('Comments') : __('Video Details')}</div>
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
