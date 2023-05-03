// @flow
import * as React from 'react';
import Ad from 'web/component/ad';
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
  commentSettingDisabled: ?boolean,
  contentUnlocked: boolean,
  hasPremiumPlus: boolean,
};

export default function MarkdownPostPage(props: Props) {
  const {
    uri,
    accessStatus,
    // -- redux --
    isMature,
    linkedCommentId,
    threadCommentId,
    commentSettingDisabled,
    contentUnlocked,
    hasPremiumPlus,
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

      {!commentSettingDisabled && contentUnlocked && (
        <div className="file-page__post-comments">
          <React.Suspense fallback={null}>
            {!hasPremiumPlus && <Ad type="aboveComments" />}
            <CommentsList
              uri={uri}
              linkedCommentId={linkedCommentId}
              threadCommentId={threadCommentId}
              commentsAreExpanded
              notInDrawer
            />
          </React.Suspense>
        </div>
      )}
    </>
  );
}

const PostWrapper = ({ children }: { children: any }) => (
  <div className="section card-stack file-page__md">{children}</div>
);
