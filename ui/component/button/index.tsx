import Button from './view';
import React, { forwardRef } from 'react';
import { connect } from 'react-redux';
import { selectUser, selectUserVerifiedEmail } from 'redux/selectors/user';
import { selectHasChannels } from 'redux/selectors/claims';
import { doHideModal } from 'redux/actions/app';

// Only compute auth-related state when the button actually needs it.
// This prevents every single button in the app from re-rendering on
// unrelated Redux state changes (user, router, channels).
const EMPTY_AUTH_STATE = {};

const mapStateToProps = (state: any, ownProps: any) => {
  if (!ownProps.requiresAuth && !ownProps.requiresChannel) {
    return EMPTY_AUTH_STATE;
  }
  return {
    pathname: state.router.location.pathname,
    emailVerified: selectUserVerifiedEmail(state),
    user: selectUser(state),
    hasChannels: selectHasChannels(state),
  };
};

const perform = {
  doHideModal,
};
const ConnectedButton = connect(mapStateToProps, perform)(Button);
export default forwardRef((props, ref) => <ConnectedButton {...props} myref={ref} />);
