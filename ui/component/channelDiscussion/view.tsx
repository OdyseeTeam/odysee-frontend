import React from 'react';
import Empty from 'component/common/empty';
import { lazyImport } from 'util/lazyImport';
import { LINKED_COMMENT_QUERY_PARAM, THREAD_COMMENT_QUERY_PARAM } from 'constants/comment';
import { selectClaimForUri } from 'redux/selectors/claims';
import { selectCommentsDisabledSettingForChannelId } from 'redux/selectors/comments';
import { getChannelIdFromClaim } from 'util/claim';
import { useAppSelector } from 'redux/hooks';

const CommentsList = lazyImport(
  () =>
    import(
      'component/commentsList'
      /* webpackChunkName: "comments" */
    )
);
type Props = {
  uri: string;
};

function ChannelDiscussion(props: Props) {
  const { uri } = props;

  const search = useAppSelector((state) => state.router?.location?.search || '');
  const urlParams = new URLSearchParams(search);
  const linkedCommentId = urlParams.get(LINKED_COMMENT_QUERY_PARAM) || undefined;
  const threadCommentId = urlParams.get(THREAD_COMMENT_QUERY_PARAM) || undefined;
  const claim = useAppSelector((state) => selectClaimForUri(state, uri));
  const channelId = getChannelIdFromClaim(claim);
  const commentSettingDisabled = useAppSelector((state) => selectCommentsDisabledSettingForChannelId(state, channelId));

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

export default ChannelDiscussion;
