import { connect } from 'react-redux';
import Logo from './view';
import { selectTheme } from 'redux/selectors/settings';

const select = (state, props) => ({
  currentTheme: selectTheme(state),
});

export default connect(select)(Logo);
