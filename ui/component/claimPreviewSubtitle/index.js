import { connect } from 'react-redux';
import { doBeginPublish } from 'redux/actions/publish';
import { selectClaimForUri, makeSelectClaimIsPending } from 'redux/selectors/claims';
import { selectLanguage } from 'redux/selectors/settings';
import ClaimPreviewSubtitle from './view';
import { doFetchSubCount, selectSubCountForUri } from 'lbryinc';
import { isStreamPlaceholderClaim } from 'util/claim';

const select = (state, props) => {
  const claim = selectClaimForUri(state, props.uri);
  const isChannel = claim && claim.value_type === 'channel';
  const isLivestream = isStreamPlaceholderClaim(claim);
  return {
    claim,
    pending: makeSelectClaimIsPending(props.uri)(state),
    isLivestream,
    subCount: isChannel ? selectSubCountForUri(state, claim.repost_url ? claim.canonical_url : props.uri) : null,
    lang: selectLanguage(state),
  };
};

const perform = {
  doBeginPublish,
  fetchSubCount: doFetchSubCount,
};

export default connect(select, perform)(ClaimPreviewSubtitle);
