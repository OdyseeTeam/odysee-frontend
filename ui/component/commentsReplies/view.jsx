// @flow
import Button from 'component/button';
import CommentView from 'component/comment';
import React from 'react';
import Spinner from 'component/spinner';

// ****************************************************************************
// ****************************************************************************

export type Props = {|
  uri?: string,
  parentId: CommentId,
  linkedCommentId?: string,
  threadCommentId?: ?string,
  numDirectReplies: number, // Total replies for parentId as reported by 'comment[replies]'. Includes blocked items.
  hasMore: boolean,
  supportDisabled?: boolean,
  threadDepthLevel?: number,
  onShowMore?: () => void,
  threadLevel: number,
  updateUiFilteredComments?: (commentIds: Array<string>) => void,
|};

type StateProps = {|
  fetchedReplies: Array<Comment>,
  isFetching: boolean,
|};

type DispatchProps = {||};

// ****************************************************************************
// CommentsReplies
// ****************************************************************************

export default function CommentsReplies(props: Props & StateProps & DispatchProps) {
  const {
    uri,
    fetchedReplies,
    linkedCommentId,
    threadCommentId,
    numDirectReplies,
    hasMore,
    supportDisabled,
    threadDepthLevel,
    onShowMore,
    threadLevel,
    isFetching,
    updateUiFilteredComments,
  } = props;

  return !numDirectReplies ? null : (
    <div className="comment__replies-container">
      <ul className="comment__replies">
        {fetchedReplies.map((comment) => (
          <CommentView
            key={comment.comment_id}
            uri={uri}
            comment={comment}
            linkedCommentId={linkedCommentId}
            threadCommentId={threadCommentId}
            supportDisabled={supportDisabled}
            threadLevel={threadLevel + 1}
            threadDepthLevel={threadDepthLevel}
            updateUiFilteredComments={updateUiFilteredComments}
          />
        ))}
      </ul>

      {fetchedReplies.length > 0 &&
        hasMore &&
        (isFetching ? (
          <span className="comment__actions--nested comment__replies-loading--more">
            <Spinner text={__('Loading')} type="small" />
          </span>
        ) : (
          <div className="comment__actions--nested">
            <Button
              button="link"
              label={__('Show more')}
              onClick={() => onShowMore && onShowMore()}
              className="button--uri-indicator"
            />
          </div>
        ))}
    </div>
  );
}
