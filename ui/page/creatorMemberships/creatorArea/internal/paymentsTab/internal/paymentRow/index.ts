import { connect } from 'react-redux';
import PaymentRow from './view';
import { selectClaimForClaimId } from 'redux/selectors/claims';
import { selectMembershipForId } from 'redux/selectors/memberships';

const select = (state, props) => {
  const { transaction } = props;
  const recipientChannel = selectClaimForClaimId(state, transaction?.creator_channel_claim_id);
  const senderChannel = selectClaimForClaimId(state, transaction?.subscriber_channel_claim_id);
  const membership = selectMembershipForId(state, transaction.membership_id);
  return {
    recipientChannel,
    senderChannel,
    membership,
  };
};

export default connect(select)(PaymentRow);
