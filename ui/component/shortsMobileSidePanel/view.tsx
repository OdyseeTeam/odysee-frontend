import * as React from 'react';
import { createPortal } from 'react-dom';
import { lazyImport } from 'util/lazyImport';
import * as ICONS from 'constants/icons';
import FileTitleSection from 'component/fileTitleSection';
import Empty from 'component/common/empty';
import Button from 'component/button';
import { lockBodyScroll, unlockBodyScroll } from 'util/body-scroll-lock';
import './style.scss';

const CommentsList = lazyImport(
  () =>
    import(
      'component/commentsList'
      /* webpackChunkName: "comments" */
    )
);

type Props = {
  isOpen: boolean;
  onClose: () => void;
  uri: string;
  accessStatus: string | null | undefined;
  contentUnlocked: boolean;
  commentsDisabled: boolean | null | undefined;
  linkedCommentId?: string;
  threadCommentId?: string;
  isComments?: boolean;
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
  const modalRef = React.useRef<HTMLDivElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const commentsRef = React.useRef<HTMLDivElement | null>(null);
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
      lockBodyScroll();
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      if (isOpen) unlockBodyScroll();
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
  React.useEffect(() => {
    if (!isOpen) return;

    const contentEl = contentRef.current;
    if (!contentEl) return;

    const raf = requestAnimationFrame(() => {
      if (isComments && commentsRef.current) {
        contentEl.scrollTo({
          top: commentsRef.current.offsetTop,
          behavior: 'smooth',
        });
      } else {
        contentEl.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
      }
    });

    return () => cancelAnimationFrame(raf);
  }, [isOpen, isComments, uri, linkedCommentId, threadCommentId]);

  if (!document.body) return null;
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

            <div ref={contentRef} className="shorts-mobile-panel__content">
              <FileTitleSection uri={uri} accessStatus={accessStatus} />

              <div ref={commentsRef} className="shorts-mobile-panel__comments-section">
                <h4>{__('Comments')}</h4>
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
              </div>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
