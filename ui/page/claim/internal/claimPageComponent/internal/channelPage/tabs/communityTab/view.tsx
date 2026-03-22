import React from 'react';
import Empty from 'component/common/empty';
import { LINKED_COMMENT_QUERY_PARAM, THREAD_COMMENT_QUERY_PARAM } from 'constants/comment';
import { useLocation } from 'react-router-dom';
import { lazyImport } from 'util/lazyImport';
const CommentsList = lazyImport(
  () =>
    import(
      'component/commentsList'
      /* webpackChunkName: "comments" */
    )
);
type Props = {
  uri: string;
  commentSettingDisabled: boolean | null | undefined;
};

function CommunityTab(props: Props) {
  const { uri, commentSettingDisabled } = props;
  const { search } = useLocation();
  const urlParams = new URLSearchParams(search);
  const linkedCommentId = urlParams.get(LINKED_COMMENT_QUERY_PARAM) || undefined;
  const threadCommentId = urlParams.get(THREAD_COMMENT_QUERY_PARAM) || undefined;

  if (commentSettingDisabled) {
    return <Empty text={__('The creator of this content has disabled comments.')} />;
  }

  return (
    <section className="section">
      <React.Suspense fallback={null}>
        <CommentsList
          uri={uri}
          linkedCommentId={linkedCommentId}
          threadCommentId={threadCommentId}
          commentsAreExpanded
          notInDrawer
        />
      </React.Suspense>
    </section>
  );
}

export default CommunityTab;
