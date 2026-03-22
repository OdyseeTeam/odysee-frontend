import React from 'react';
import { Modal } from 'modal/modal';
import Button from 'component/button';
import CommentView from 'component/comment';
import Card from 'component/common/card';
import { useAppDispatch, useAppSelector } from 'redux/hooks';
import { doHideModal } from 'redux/actions/app';
import { doCommentAbandon } from 'redux/actions/comments';
import { selectCommentForCommentId } from 'redux/selectors/comments';
type Props = {
  commentId: string;
  // sha256 digest identifying the comment
  deleterClaim: Claim;
  deleterIsModOrAdmin?: boolean;
  creatorClaim?: Claim;
  supportAmount?: any;
  setQuickReply: (arg0: any) => void;
};

function getCommentPreview(comment: Comment | null | undefined) {
  return comment ? (
    <div className="section comment-preview non-clickable">
      <CommentView comment={comment} threadLevel={-1} isTopLevel hideActions hideContextMenu forceDisplayDeadComment />
    </div>
  ) : null;
}

function ModalRemoveComment(props: Props) {
  const { commentId, deleterClaim, deleterIsModOrAdmin, creatorClaim, supportAmount, setQuickReply } = props;
  const dispatch = useAppDispatch();
  const comment = useAppSelector((state) => selectCommentForCommentId(state, commentId));

  return (
    <Modal isOpen contentLabel={__('Confirm Comment Deletion')} type="card" onAborted={() => dispatch(doHideModal())}>
      <Card
        title={__('Remove Comment')}
        body={
          <React.Fragment>
            <p>{__('Are you sure you want to remove this comment?')}</p>
            {Boolean(supportAmount) && (
              <p className="help error__text">
                {__('This comment has a tip associated with it which cannot be reverted.')}
              </p>
            )}
            <div>{getCommentPreview(comment)}</div>
          </React.Fragment>
        }
        actions={
          <>
            <div className="section__actions">
              <Button
                button="primary"
                label={__('Remove')}
                onClick={() => {
                  dispatch(doHideModal());
                  dispatch(doCommentAbandon(commentId, deleterClaim, deleterIsModOrAdmin, creatorClaim));

                  if (setQuickReply) {
                    setQuickReply(undefined);
                  }
                }}
              />
              <Button button="link" label={__('Cancel')} onClick={() => dispatch(doHideModal())} />
            </div>
          </>
        }
      />
    </Modal>
  );
}

export default ModalRemoveComment;
