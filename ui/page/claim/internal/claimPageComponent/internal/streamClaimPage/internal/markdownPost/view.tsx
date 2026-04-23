import * as React from 'react';
import Empty from 'component/common/empty';
import FileTitleSection from 'component/fileTitleSection';
import { lazyImport } from 'util/lazyImport';
import { useAppSelector } from 'redux/hooks';
import { LINKED_COMMENT_QUERY_PARAM, THREAD_COMMENT_QUERY_PARAM } from 'constants/comment';
import * as TAGS from 'constants/tags';
import { selectCommentsDisabledSettingForChannelId } from 'redux/selectors/comments';
import {
  selectClaimIsNsfwForUri,
  selectClaimForUri,
  makeSelectTagInClaimOrChannelForUri,
} from 'redux/selectors/claims';
import { selectNoRestrictionOrUserIsMemberForContentClaimId } from 'redux/selectors/memberships';
import { getChannelIdFromClaim } from 'util/claim';
const CommentsList = lazyImport(
  () =>
    import(
      'component/commentsList'
      /* webpackChunkName: "comments" */
    )
);
const PostViewer = lazyImport(
  () =>
    import(
      'component/postViewer'
      /* webpackChunkName: "postViewer" */
    )
);
type Props = {
  uri: string;
  accessStatus: string | null | undefined;
};
export default function MarkdownPostPage(props: Props) {
  const { uri, accessStatus } = props;
  const { search } = location;
  const urlParams = new URLSearchParams(search);
  const claim = useAppSelector((state) => selectClaimForUri(state, uri));
  const claimId = claim?.claim_id;
  const commentSettingDisabled = useAppSelector((state) =>
    selectCommentsDisabledSettingForChannelId(state, getChannelIdFromClaim(claim))
  );
  const isMature = useAppSelector((state) => selectClaimIsNsfwForUri(state, uri));
  const linkedCommentId = urlParams.get(LINKED_COMMENT_QUERY_PARAM);
  const threadCommentId = urlParams.get(THREAD_COMMENT_QUERY_PARAM);
  const contentUnlockedValue = useAppSelector((state) =>
    claimId ? selectNoRestrictionOrUserIsMemberForContentClaimId(state, claimId) : undefined
  );
  const contentUnlocked = claimId && contentUnlockedValue;
  const commentsDisabledTag = useAppSelector((state) =>
    makeSelectTagInClaimOrChannelForUri(uri, TAGS.DISABLE_COMMENTS_TAG)(state)
  );
  const commentsDisabled = commentSettingDisabled || commentsDisabledTag;

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
