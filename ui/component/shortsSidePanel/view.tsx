import React from 'react';
import { createPortal } from 'react-dom';
import { lazyImport } from 'util/lazyImport';
import FileTitleSection from 'component/fileTitleSection';
import Empty from 'component/common/empty';
import Button from 'component/button';
import * as ICONS from 'constants/icons';

const CommentsList = lazyImport(() => import('component/commentsList'));

type Props = {
  isOpen: boolean;
  uri: string;
  accessStatus: string | null | undefined;
  contentUnlocked: boolean;
  commentsDisabled: boolean | null | undefined;
  linkedCommentId?: string;
  threadCommentId?: string;
  isComments?: boolean;
  onClose?: () => void;
  portalTarget?: Element;
};

const ShortsSidePanel = React.memo<Props>(
  ({
    isOpen,
    uri,
    accessStatus,
    contentUnlocked,
    commentsDisabled,
    linkedCommentId,
    threadCommentId,
    isComments,
    onClose,
    portalTarget,
  }: Props) => {
    const contentRef = React.useRef<HTMLDivElement | null>(null);
    const commentsRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
      if (!isOpen || !contentRef.current) return;

      const contentEl = contentRef.current;
      const raf = requestAnimationFrame(() => {
        if (isComments && commentsRef.current) {
          const contentRect = contentEl.getBoundingClientRect();
          const commentsRect = commentsRef.current.getBoundingClientRect();
          contentEl.scrollTo({
            top: commentsRect.top - contentRect.top + contentEl.scrollTop,
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

    const panel = (
      <div className={`shorts-page__side-panel ${isOpen ? 'shorts-page__side-panel--open' : ''}`}>
        <div className="shorts-page__close-button-container">
          <Button
            className="shorts-page__close-button"
            onClick={onClose}
            icon={ICONS.REMOVE}
            iconSize={20}
            title={__('Close')}
          />
        </div>

        <div ref={contentRef} className="shorts-page__side-panel-content">
          <FileTitleSection uri={uri} accessStatus={accessStatus} />

          <div ref={commentsRef} className="shorts-page__side-panel-comments">
            <h2 className="shorts-page__side-panel-comments-title">{__('Comments')}</h2>
            {isOpen &&
              contentUnlocked &&
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
    );

    return portalTarget ? createPortal(panel, portalTarget) : panel;
  }
);

export default ShortsSidePanel;
