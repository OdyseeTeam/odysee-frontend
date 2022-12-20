import { connect } from 'react-redux';

import { PREFERENCE_EMBED } from 'constants/tags';
import { selectIsClaimBlackListedForUri, selectIsClaimFilteredForUri } from 'lbryinc';

import {
  selectClaimForUri,
  selectHasClaimForUri,
  selectClaimIsMineForUri,
  selectGeoRestrictionForUri,
  makeSelectTagInClaimOrChannelForUri,
} from 'redux/selectors/claims';
import { selectUserVerifiedEmail } from 'redux/selectors/user';

import { doResolveUri } from 'redux/actions/claims';
import { doBeginPublish } from 'redux/actions/publish';
import { doOpenModal } from 'redux/actions/app';

import withResolvedClaimRender from './view';

const select = (state, props) => {
  const { uri } = props;

  const claim = selectClaimForUri(state, uri);

  const preferEmbed = makeSelectTagInClaimOrChannelForUri(uri, PREFERENCE_EMBED)(state);

  return {
    uri,
    hasClaim: selectHasClaimForUri(state, uri),
    isClaimBlackListed: selectIsClaimBlackListedForUri(state, uri),
    isClaimFiltered: selectIsClaimFilteredForUri(state, uri),
    claimIsMine: selectClaimIsMineForUri(state, claim),
    isAuthenticated: selectUserVerifiedEmail(state),
    geoRestriction: selectGeoRestrictionForUri(state, uri),
    preferEmbed,
  };
};

const perform = {
  doResolveUri,
  doBeginPublish,
  doOpenModal,
};

export default (Component) => connect(select, perform)(withResolvedClaimRender(Component));
