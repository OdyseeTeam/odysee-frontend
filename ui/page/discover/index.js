import * as CS from 'constants/claim_search';
import { connect } from 'react-redux';
import { doResolveUri } from 'redux/actions/claims';
import { selectClaimForUri } from 'redux/selectors/claims';
import * as SETTINGS from 'constants/settings';
import { selectClientSetting } from 'redux/selectors/settings';
import DiscoverPage from './view';

const select = (state, props) => {
  const urlParams = new URLSearchParams(props.location.search);
  const repostedUriInUrl = urlParams.get(CS.REPOSTED_URI_KEY);
  const repostedUri = repostedUriInUrl ? decodeURIComponent(repostedUriInUrl) : undefined;

  return {
    repostedUri: repostedUri,
    repostedClaim: repostedUri ? selectClaimForUri(state, repostedUri, false) : null,
    tileLayout: selectClientSetting(state, SETTINGS.TILE_LAYOUT),
  };
};

const perform = {
  doResolveUri,
};

export default connect(select, perform)(DiscoverPage);
