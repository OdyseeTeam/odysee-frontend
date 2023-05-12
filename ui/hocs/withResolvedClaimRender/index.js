import { connect } from 'react-redux';
import Comments from 'comments';
import withResolvedClaimRender from './view';

import { PREFERENCE_EMBED } from 'constants/tags';
import { selectIsClaimBlackListedForUri, selectIsClaimFilteredForUri } from 'lbryinc';

import { selectGblAvailable } from 'redux/selectors/blocked';
import {
  selectClaimForUri,
  selectHasClaimForUri,
  selectClaimIsMine,
  selectGeoRestrictionForUri,
  selectIsUriUnlisted,
  makeSelectTagInClaimOrChannelForUri,
} from 'redux/selectors/claims';
import { selectContentStates } from 'redux/selectors/content';
import { selectUser, selectUserVerifiedEmail } from 'redux/selectors/user';

import { doResolveUri } from 'redux/actions/claims';
import { doBeginPublish } from 'redux/actions/publish';
import { doOpenModal } from 'redux/actions/app';

const select = (state, props) => {
  const { uri } = props;

  const claim = selectClaimForUri(state, uri);

  const preferEmbed = makeSelectTagInClaimOrChannelForUri(uri, PREFERENCE_EMBED)(state);

  return {
    uri,
    claim,
    hasClaim: selectHasClaimForUri(state, uri),
    isClaimBlackListed: selectIsClaimBlackListedForUri(state, uri),
    isClaimFiltered: selectIsClaimFilteredForUri(state, uri),
    claimIsMine: selectClaimIsMine(state, claim),
    isUnlisted: selectIsUriUnlisted(state, uri),
    isAuthenticated: selectUserVerifiedEmail(state),
    isGlobalMod: Boolean(selectUser(state)?.global_mod),
    uriAccessKey: selectContentStates(state).uriAccessKeys[uri],
    geoRestriction: selectGeoRestrictionForUri(state, uri),
    gblAvailable: selectGblAvailable(state),
    preferEmbed,
    verifyClaimSignature: Comments.verify_claim_signature,
  };
};

const perform = {
  doResolveUri,
  doBeginPublish,
  doOpenModal,
};

export default (Component) => connect(select, perform)(withResolvedClaimRender(Component));
