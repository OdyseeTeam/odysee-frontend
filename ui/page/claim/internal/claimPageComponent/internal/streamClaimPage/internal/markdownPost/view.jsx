// @flow
import * as React from 'react';
import Empty from 'component/common/empty';
import FileTitleSection from 'component/fileTitleSection';
import { lazyImport } from 'util/lazyImport';

const CommentsList = lazyImport(() => import('component/commentsList' /* webpackChunkName: "comments" */));
const PostViewer = lazyImport(() => import('component/postViewer' /* webpackChunkName: "postViewer" */));

type Props = {
  uri: string,
  accessStatus: ?string,
  // -- redux --
  isMature: boolean,
  linkedCommentId?: string,
  threadCommentId?: string,
  commentsDisabled: ?boolean,
  contentUnlocked: boolean,
};

export default function MarkdownPostPage(props: Props) {
  const {
    uri,
    accessStatus,
    // -- redux --
    isMature,
    linkedCommentId,
    threadCommentId,
    commentsDisabled,
    contentUnlocked,
  } = props;

  if (isMature) {
    return (
      <PostWrapper>
        <FileTitleSection uri={uri} accessStatus={accessStatus} isNsfwBlocked />
      </PostWrapper>
    );
  }

  return (
    <>
      <PostWrapper>
        <React.Suspense fallback={null}>
          <PostViewer uri={uri} />
        </React.Suspense>
      </PostWrapper>

      <div className="file-page__post-comments">
        {commentsDisabled ? (
          <Empty text={__('The creator of this content has disabled comments.')} />
        ) : contentUnlocked ? (
          <React.Suspense fallback={null}>
            <CommentsList
              uri={uri}
              linkedCommentId={linkedCommentId}
              threadCommentId={threadCommentId}
              commentsAreExpanded
              notInDrawer
            />
          </React.Suspense>
        ) : null}
      </div>
    </>
  );
}

const PostWrapper = ({ children }: { children: any }) => (
  <div className="section card-stack file-page__md">{children}</div>
);
