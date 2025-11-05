// @flow
import React from 'react';
import { lazyImport } from 'util/lazyImport';
import FileTitleSection from 'component/fileTitleSection';
import Empty from 'component/common/empty';
import Button from 'component/button';
import * as ICONS from 'constants/icons';

const CommentsList = lazyImport(() => import('component/commentsList'));

type Props = {
  isOpen: boolean,
  uri: string,
  accessStatus: ?string,
  contentUnlocked: boolean,
  commentsDisabled: ?boolean,
  linkedCommentId?: string,
  threadCommentId?: string,
  isComments?: boolean,
  onClose?: () => void,
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
  }: Props) => {
    return (
      <div className={`shorts-page__side-panel ${isOpen ? 'shorts-page__side-panel--open' : ''}`}>
        <div className="shorts-page__close-button-container">
          <Button
            className="shorts-page__close-button"
            onClick={onClose}
            icon={ICONS.REMOVE}
            iconSize={20}
            title={'Close'}
          />
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
    );
  }
);

export default ShortsSidePanel;
