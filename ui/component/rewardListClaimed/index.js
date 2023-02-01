import { connect } from 'react-redux';
import { selectClaimedRewards } from 'redux/selectors/rewards';
import { selectLanguage } from 'redux/selectors/settings';
import RewardListClaimed from './view';

const select = state => ({
  rewards: selectClaimedRewards(state),
  appLanguage: selectLanguage(state),
});

export default connect(select, null)(RewardListClaimed);
