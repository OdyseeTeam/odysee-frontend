// @flow
import { connect } from 'react-redux';
import type { Props } from './view';
import HiddenContentPage from './view';

import { selectUser } from 'redux/selectors/user';

const select = (state) => ({
  user: selectUser(state),
});

export default connect<_, Props, _, _, _, _>(select, {})(HiddenContentPage);
