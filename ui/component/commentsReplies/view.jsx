// @flow
import Button from 'component/button';
import Comment from 'component/comment';
import React from 'react';

type Props = {
  uri: string,
  linkedCommentId?: string,
  threadDepth: number,
  numDirectReplies: number, // Total replies for parentId as reported by 'comment[replies]'. Includes blocked items.
  hasMore: boolean,
  supportDisabled: boolean,
  onShowMore?: () => void,
  // redux
  fetchedReplies: Array<Comment>,
  claimIsMine: boolean,
};

export default function CommentsReplies(props: Props) {
  const {
    uri,
    fetchedReplies,
    claimIsMine,
    linkedCommentId,
    threadDepth,
    numDirectReplies,
    hasMore,
    supportDisabled,
    onShowMore,
  } = props;

  return !numDirectReplies ? null : (
    <div className="comment__replies-container">
      <ul className="comment__replies">
        {fetchedReplies.map((comment) => (
          <Comment
            key={comment.comment_id}
            threadDepth={threadDepth}
            uri={uri}
            comment={comment}
            claimIsMine={claimIsMine}
            linkedCommentId={linkedCommentId}
            supportDisabled={supportDisabled}
          />
        ))}
      </ul>

      {fetchedReplies && hasMore && (
        <div className="comment__actions--nested">
          <Button
            button="link"
            label={__('Show more')}
            onClick={() => onShowMore && onShowMore()}
            className="button--uri-indicator"
          />
        </div>
      )}
    </div>
  );
}
