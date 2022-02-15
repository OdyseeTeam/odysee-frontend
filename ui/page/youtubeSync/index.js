import { connect } from 'react-redux';
import { selectYoutubeChannels } from 'redux/selectors/user';
import { selectBalance } from 'redux/selectors/wallet';
import { doUserFetch } from 'redux/actions/user';
import CreatorDashboardPage from './view';

const select = (state) => ({
  youtubeChannels: selectYoutubeChannels(state),
  balance: selectBalance(state),
});

export default connect(select, {
  doUserFetch,
})(CreatorDashboardPage);
