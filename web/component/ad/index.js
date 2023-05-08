import { connect } from 'react-redux';
import { selectShouldShowAds } from 'redux/selectors/app';
import Ad from './view';

const select = (state, props) => ({
  shouldShowAds: selectShouldShowAds(state),
});

export default connect(select)(Ad);
