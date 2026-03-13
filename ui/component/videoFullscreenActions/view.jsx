// @flow
import React from 'react';
import { lazyImport } from 'util/lazyImport';
import FileTitleSection from 'component/fileTitleSection';
import FileReactions from 'component/fileReactions';
import Empty from 'component/common/empty';
import Button from 'component/button';
import * as ICONS from 'constants/icons';

const CommentsList = lazyImport(() => import('component/commentsList'));

type Props = {
  uri: string,
  accessStatus: ?string,
  contentUnlocked: boolean,
  commentsDisabled: ?boolean,
  linkedCommentId?: string,
  threadCommentId?: string,
  panelMode: ?string,
  onTogglePanel: (mode: string) => void,
  onClosePanel: () => void,
};

export default function VideoFullscreenActions(props: Props) {
  const {
    uri,
    accessStatus,
    contentUnlocked,
    commentsDisabled,
    linkedCommentId,
    threadCommentId,
    panelMode,
    onTogglePanel,
    onClosePanel,
  } = props;

  return (
    <>
      <div className="video-fullscreen__actions">
        <Button
          className="video-fullscreen__action-btn"
          onClick={() => onTogglePanel('info')}
          icon={ICONS.INFO}
          iconSize={18}
          title={__('Show Details')}
        />

        <div className="video-fullscreen__reactions-no-count">
          <FileReactions uri={uri} />
        </div>

        <Button
          className="video-fullscreen__action-btn"
          onClick={() => onTogglePanel('comments')}
          icon={ICONS.COMMENTS_LIST}
          iconSize={18}
          title={__('Comments')}
        />
      </div>

      <div className={`video-fullscreen__side-panel ${panelMode ? 'video-fullscreen__side-panel--open' : ''}`}>
        <div className="video-fullscreen__close-button-container">
          <Button
            className="video-fullscreen__close-button"
            onClick={onClosePanel}
            icon={ICONS.REMOVE}
            iconSize={20}
            title={__('Close')}
          />
        </div>

        <div className="video-fullscreen__side-panel-content">
          {panelMode === 'info' && <FileTitleSection uri={uri} accessStatus={accessStatus} />}
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
    </>
  );
}
