// @flow
import React from 'react';
import useFetched from 'effects/use-fetched';

type Props = {
  pins?: { urls?: Array<string>, claimIds?: Array<string>, onlyPinForOrder?: string },
  claimsById: { [string]: Claim },
  doResolveClaimIds: (Array<string>) => Promise<any>,
  doResolveUris: (Array<string>, boolean) => Promise<any>,
};

export default function useResolvePins(props: Props) {
  const { pins, claimsById, doResolveClaimIds, doResolveUris } = props;

  const [resolvedPinUris, setResolvedPinUris] = React.useState(pins ? undefined : null);
  const [isResolving, setIsResolving] = React.useState(false);
  const hasResolvedPinUris = useFetched(isResolving);

  React.useEffect(() => {
    if (resolvedPinUris === undefined && pins && !isResolving) {
      if (pins.claimIds) {
        setIsResolving(true);
        // $FlowIgnore (null checked)
        doResolveClaimIds(pins.claimIds).finally(() => setIsResolving(false));
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
  }, [resolvedPinUris, pins, doResolveUris, doResolveClaimIds, isResolving]);

  React.useEffect(() => {
    if (hasResolvedPinUris) {
      if (pins && pins.claimIds) {
        const uris = [];

        pins.claimIds.forEach((id) => {
          const uri = claimsById[id]?.canonical_url;
          if (uri) {
            // The pinned IDs could lead to deleted claims. Discard nulls.
            uris.push(uri);
          }
        });

        setResolvedPinUris(uris.length > 0 ? uris : null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only do this over a false->true->false transition for hasResolvedPinUris.
  }, [hasResolvedPinUris]);

  return resolvedPinUris;
}
