import { connect } from 'react-redux';
import InvitedPage from './view';
import { selectPermanentUrlForUri } from 'redux/selectors/claims';
import { doResolveUri } from 'redux/actions/claims';
import { useParams } from 'react-router-dom';
import React from 'react';

const select = (state, props) => {
  const { referrer } = props;
  const uri = `lbry://${referrer}`;
  return {
    uri,
    referrerUri: selectPermanentUrlForUri(state, uri),
  };
};

const perform = {
  doResolveUri,
};
const ConnectedInvitedPage = connect(select, perform)(InvitedPage);

export default function InvitedRoute(props) {
  const { referrer = '' } = useParams();
  return React.createElement(ConnectedInvitedPage, { ...props, referrer });
}
