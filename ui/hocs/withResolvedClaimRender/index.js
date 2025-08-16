import { connect } from 'react-redux';
import Comments from 'comments';
import withResolvedClaimRender from './view';

import { selectBlackListDataForUri, selectFilterDataForUri } from 'lbryinc';

import { selectGblAvailable } from 'redux/selectors/blocked';
import {
  selectClaimForUri,
  selectHasClaimForUri,
  selectClaimIsMine,
  selectGeoRestrictionForUri,
  selectIsUriUnlisted,
} from 'redux/selectors/claims';
import { selectContentStates } from 'redux/selectors/content';
import { selectUser, selectUserVerifiedEmail } from 'redux/selectors/user';

import { doResolveUri } from 'redux/actions/claims';
import { doBeginPublish } from 'redux/actions/publish';
import { doOpenModal } from 'redux/actions/app';

const select = (state, props) => {
  const { uri } = props;

  const claim = selectClaimForUri(state, uri);

  const filterData = selectFilterDataForUri(state, uri);
  const isClaimFiltered = filterData && filterData.tag_name !== 'internal-hide-trending';

  return {
    uri,
    claim,
    hasClaim: selectHasClaimForUri(state, uri),
    isClaimBlackListed: Boolean(selectBlackListDataForUri(state, uri)),
    isClaimFiltered,
    claimIsMine: selectClaimIsMine(state, claim),
    isUnlisted: selectIsUriUnlisted(state, uri),
    isAuthenticated: selectUserVerifiedEmail(state),
    isGlobalMod: Boolean(selectUser(state)?.global_mod),
    uriAccessKey: selectContentStates(state).uriAccessKeys[uri],
    geoRestriction: selectGeoRestrictionForUri(state, uri),
    gblAvailable: selectGblAvailable(state),
    verifyClaimSignature: Comments.verify_claim_signature,
  };
};

const perform = {
  doResolveUri,
  doBeginPublish,
  doOpenModal,
};

export default (Component) => connect(select, perform)(withResolvedClaimRender(Component));
