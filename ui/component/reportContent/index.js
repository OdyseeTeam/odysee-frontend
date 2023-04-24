import { connect } from 'react-redux';
import { doCommentById } from 'redux/actions/comments';
import { selectActiveChannelClaim, selectIncognito } from 'redux/selectors/app';
import { selectCommentForCommentId } from 'redux/selectors/comments';
import { doClaimSearch } from 'redux/actions/claims';
import { selectClaimForClaimId } from 'redux/selectors/claims';
import { withRouter } from 'react-router';
import { sendContentReport } from 'services/reportContent';
import ReportContent from './view';

const select = (state, props) => {
  const { search } = props.location;
  const urlParams = new URLSearchParams(search);
  const claimId = urlParams.get('claimId');
  const commentId = urlParams.get('commentId');

  return {
    claimId,
    commentId,
    activeChannelClaim: selectActiveChannelClaim(state),
    incognito: selectIncognito(state),
    claim: selectClaimForClaimId(state, claimId),
    comment: selectCommentForCommentId(state, commentId),
    sendContentReport: sendContentReport,
  };
};

const perform = {
  doClaimSearch,
  doCommentById,
};

export default withRouter(connect(select, perform)(ReportContent));
