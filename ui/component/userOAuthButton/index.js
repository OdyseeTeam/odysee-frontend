import { connect } from 'react-redux';
import { selectUser } from 'redux/selectors/user';
import UserOAuthButton from './view';

const select = (state) => ({
  user: selectUser(state),
});

export default connect(select)(UserOAuthButton);
