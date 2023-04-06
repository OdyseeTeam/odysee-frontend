import { connect } from 'react-redux';
import SwipeableDrawer from './view';
import { selectIsDrawerOpenForType } from 'redux/selectors/app';
import { doToggleAppDrawer } from 'redux/actions/app';

const select = (state, props) => {
  const { type } = props;

  return {
    open: selectIsDrawerOpenForType(state, type),
  };
};

const perform = {
  doToggleAppDrawer,
};

export default connect(select, perform)(SwipeableDrawer);
