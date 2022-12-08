import { connect } from 'react-redux';
import { punctuationMarks } from 'util/remark-lbry';

import { selectClaimForUri, selectIsUriResolving } from 'redux/selectors/claims';

import { doResolveUri } from 'redux/actions/claims';

import ClaimLink from './view';

const select = (state, props) => {
  let uri = props.uri;
  let claim;

  /* Used in case of a non-existant claim ending on a punctuation mark,
    checks if the url exists without it in case the user was looking for it
    and added the punctuation mark for grammatical purposes (it gets added
    as part of the URI because some punctuation marks are allowed on URIs) */
  function getValidClaim(testUri) {
    if (testUri.replace('lbry://', '').length <= 1) return;

    claim = selectClaimForUri(state, testUri);
    if (claim === null && punctuationMarks.includes(testUri.charAt(testUri.length - 1))) {
      getValidClaim(testUri.substring(0, testUri.length - 1));
    } else {
      uri = testUri;
    }
  }
  getValidClaim(uri);

  return {
    uri,
    claim,
    fullUri: props.uri,
    isResolvingUri: selectIsUriResolving(state, uri),
  };
};

const perform = {
  doResolveUri,
};

export default connect(select, perform)(ClaimLink);
