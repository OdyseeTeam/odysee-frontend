import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import JoinMembershipCard from './view';

export default withRouter(connect()(JoinMembershipCard));
