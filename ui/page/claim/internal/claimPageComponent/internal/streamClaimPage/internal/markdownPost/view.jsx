// @flow
import * as React from 'react';
import { lazyImport } from 'util/lazyImport';
import FileTitleSection from 'component/fileTitleSection';

const CommentsList = lazyImport(() => import('component/commentsList' /* webpackChunkName: "comments" */));
const PostViewer = lazyImport(() => import('component/postViewer' /* webpackChunkName: "postViewer" */));

type Props = {
  uri: string,
  accessStatus: ?string,
  // -- redux --
  isMature: boolean,
  commentSettingDisabled: ?boolean,
  contentUnlocked: boolean,
};

export default function MarkdownPostPage(props: Props) {
  const {
    uri,
    accessStatus,
    // -- redux --
    isMature,
    commentSettingDisabled,
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

      {!commentSettingDisabled && contentUnlocked && (
        <div className="file-page__post-comments">
          <React.Suspense fallback={null}>
            <CommentsList
              uri={uri}
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
