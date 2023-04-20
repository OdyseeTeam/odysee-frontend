// @flow
import React from 'react';

/**
 * Appends the uri access key to the address bar if:
 *
 * 1. The creator is viewing own unlisted.
 *    - People are more likely to just grab from the address bar rather than
 *      Share Modal. While this will be the undesired long form URL, at least it
 *      contains the signature.
 * 2. The viewer has accessed the valid link before, went elsewhere, and
 *    navigated back.
 *
 * Generated keys are stored in redux.
 *
 * doFetchUriAccessKey() will return any cached key, and will only perform the
 * signing for case #1. It also serves as a cheat to get data from redux without
 * needing additional props (somewhat dirty, but practical).
 *
 * @param claim
 * @param doFetchUriAccessKey
 */
export default function useAppendAccessKeyToUrl(
  claim: ?Claim,
  doFetchUriAccessKey: (uri: string) => Promise<?UriAccessKey>
) {
  const uri = claim?.canonical_url;

  React.useEffect(() => {
    if (uri) {
      doFetchUriAccessKey(uri)
        .then((accessKey: ?UriAccessKey) => {
          if (accessKey && accessKey.signature && accessKey.signature_ts) {
            const url = new URL(window.location.href);
            url.searchParams.set('signature', accessKey.signature);
            url.searchParams.set('signature_ts', accessKey.signature_ts);
            history.replaceState(null, '', url.toString());
          }
        })
        .catch();
    }
  }, [uri, doFetchUriAccessKey]);
}
