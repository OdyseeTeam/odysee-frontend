import { connect } from 'react-redux';
import { doSetHomepage } from 'redux/actions/settings';
import { selectHomepageCode } from 'redux/selectors/settings';
import FeaturedBanner from './view';

const select = (state) => ({
  // homepage: selectHomepageCode(state),
});

const perform = (dispatch) => ({
  // setHomepage: value => dispatch(doSetHomepage(value)),
});

export default connect(select, perform)(FeaturedBanner);
