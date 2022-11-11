// @flow
import * as React from 'react';
import { lazyImport } from 'util/lazyImport';
import Page from 'component/page';
import FileTitleSection from 'component/fileTitleSection';

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
  } = props;

  if (isMature) {
    return (
      <PageWrapper>
        <PostWrapper>
          <FileTitleSection uri={uri} accessStatus={accessStatus} isNsfwBlocked />
        </PostWrapper>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <PostWrapper>
        <React.Suspense fallback={null}>
          <PostViewer uri={uri} />
        </React.Suspense>
      </PostWrapper>

      {!commentSettingDisabled && contentUnlocked && (
        <div className="file-page__post-comments">
          <React.Suspense fallback={null}>
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
    </PageWrapper>
  );
}

const PageWrapper = ({ children }: { children: any }) => (
  <Page className="file-page" filePage isMarkdown>
    {children}
  </Page>
);

const PostWrapper = ({ children }: { children: any }) => (
  <div className="section card-stack file-page__md">{children}</div>
);
