import { connect } from 'react-redux';
import { selectShouldShowAds } from 'redux/selectors/app';
import RCAboveComments from './view';

const select = (state, props) => ({
  shouldShowAds: selectShouldShowAds(state),
});

export default connect(select)(RCAboveComments);
