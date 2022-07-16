import { connect } from 'react-redux';
import { doOpenModal } from 'redux/actions/app';
// import { selectMyChannelUrls } from 'redux/selectors/claims';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import MarkdownLink from './view';

const select = (state, props) => ({
  // myChannelUrls: selectMyChannelUrls(state),
  activeChannelClaim: selectActiveChannelClaim(state),
});

const perform = (dispatch) => ({
  openModal: (modal, props) => dispatch(doOpenModal(modal, props)),
});

export default connect(select, perform)(MarkdownLink);
