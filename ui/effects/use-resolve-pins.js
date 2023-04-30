// @flow
import React from 'react';
import useFetched from 'effects/use-fetched';

type Props = {
  pins?: { urls?: Array<string>, claimIds?: Array<string>, onlyPinForOrder?: string },
  doResolveClaimIds: (Array<string>) => Promise<any>,
  doResolveUris: (Array<string>, boolean) => Promise<any>,
};

export default function useResolvePins(props: Props) {
  const { pins, doResolveClaimIds, doResolveUris } = props;

  const [resolvedPinUris, setResolvedPinUris] = React.useState(pins ? undefined : null);
  const [isResolving, setIsResolving] = React.useState(false);
  const hasResolvedPinUris = useFetched(isResolving); // Only attempt once

  React.useEffect(() => {
    if (resolvedPinUris === undefined && pins && !isResolving && !hasResolvedPinUris) {
      if (pins.claimIds) {
        setIsResolving(true);
        // $FlowIgnore (null checked)
        doResolveClaimIds(pins.claimIds)
          .then((result) => {
            const uris = [];
            if (result) {
              Object.values(result).forEach((r) => {
                // $FlowIgnore (flow mixed bug)
                const claim = r && r.stream;
                // $FlowIgnore (flow mixed bug)
                if (claim && pins.claimIds?.includes(claim.claim_id)) {
                  if (claim.canonical_url) {
                    // $FlowIgnore (flow mixed bug)
                    uris.push(claim.canonical_url);
                  }
                }
              });
            }
            setResolvedPinUris(uris.length > 0 ? uris : null);
          })
          .finally(() => setIsResolving(false));
      } else if (pins.urls) {
        setIsResolving(true);
        // $FlowIgnore (null checked)
        doResolveUris(pins.urls, true).finally(() => {
          setIsResolving(false);
          setResolvedPinUris(pins.urls);
        });
      } else {
        setResolvedPinUris(null);
      }
    }
  }, [resolvedPinUris, pins, doResolveUris, doResolveClaimIds, isResolving, hasResolvedPinUris]);

  return resolvedPinUris;
}
