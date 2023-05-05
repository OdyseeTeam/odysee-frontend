import { connect } from 'react-redux';
import withResolvedClaimRender from './view';

import { PREFERENCE_EMBED } from 'constants/tags';
import { selectIsClaimBlackListedForUri, selectIsClaimFilteredForUri } from 'lbryinc';

import { selectGblAvailable } from 'redux/selectors/blocked';
import {
  selectClaimForUri,
  selectHasClaimForUri,
  selectClaimIsMine,
  selectGeoRestrictionForUri,
  makeSelectTagInClaimOrChannelForUri,
} from 'redux/selectors/claims';
import { selectUserVerifiedEmail } from 'redux/selectors/user';

import { doResolveUri } from 'redux/actions/claims';
import { doBeginPublish } from 'redux/actions/publish';
import { doOpenModal } from 'redux/actions/app';

const select = (state, props) => {
  const { uri } = props;

  const claim = selectClaimForUri(state, uri);

  const preferEmbed = makeSelectTagInClaimOrChannelForUri(uri, PREFERENCE_EMBED)(state);

  return {
    uri,
    hasClaim: selectHasClaimForUri(state, uri),
    isClaimBlackListed: selectIsClaimBlackListedForUri(state, uri),
    isClaimFiltered: selectIsClaimFilteredForUri(state, uri),
    claimIsMine: selectClaimIsMine(state, claim),
    isAuthenticated: selectUserVerifiedEmail(state),
    geoRestriction: selectGeoRestrictionForUri(state, uri),
    gblAvailable: selectGblAvailable(state),
    preferEmbed,
  };
};

const perform = {
  doResolveUri,
  doBeginPublish,
  doOpenModal,
};

export default (Component) => connect(select, perform)(withResolvedClaimRender(Component));
