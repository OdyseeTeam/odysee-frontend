import React from 'react';
import LbcSymbol from 'component/common/lbc-symbol';
import WunderbarSuggestion from 'component/wunderbarSuggestion';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import {
  makeSelectClaimForUri,
  selectIsUriResolving,
  makeSelectTagInClaimOrChannelForUri,
} from 'redux/selectors/claims';
import { doResolveUris } from 'redux/actions/claims';
import { parseURI } from 'util/lbryURI';
import { makeSelectWinningUriForQuery } from 'redux/selectors/search';
import { PREFERENCE_EMBED } from 'constants/tags';

type Props = {
  query: string;
};
export default function WunderbarTopSuggestion(props: Props) {
  const { query } = props;
  const dispatch = useAppDispatch();

  const uriFromQuery = `lbry://${query}`;
  const uris = React.useMemo(() => {
    const result = [uriFromQuery];
    try {
      const { isChannel } = parseURI(uriFromQuery);
      if (!isChannel) {
        const channelUriFromQuery = `lbry://@${query}`;
        result.push(channelUriFromQuery);
      }
    } catch (e) {}
    return result;
  }, [uriFromQuery, query]);

  const resolvingUris = useAppSelector((state) => uris.some((uri) => selectIsUriResolving(state, uri)));
  const winningUri = useAppSelector((state) => makeSelectWinningUriForQuery(query)(state));
  const winningClaim = useAppSelector((state) => (winningUri ? makeSelectClaimForUri(winningUri)(state) : undefined));
  const preferEmbed = useAppSelector((state) =>
    makeSelectTagInClaimOrChannelForUri(winningUri, PREFERENCE_EMBED)(state)
  );

  const stringifiedUris = JSON.stringify(uris);
  React.useEffect(() => {
    if (stringifiedUris) {
      const arrayUris = JSON.parse(stringifiedUris);

      if (arrayUris.length > 0) {
        dispatch(doResolveUris(arrayUris));
      }
    }
  }, [dispatch, stringifiedUris]);

  if (resolvingUris) {
    return (
      <div className="wunderbar__winning-claim">
        <div className="wunderbar__label wunderbar__placeholder-label" />

        <div className="wunderbar__suggestion wunderbar__placeholder-suggestion">
          <div className="wunderbar__placeholder-thumbnail" />
          <div className="wunderbar__placeholder-info" />
        </div>
        <hr className="wunderbar__top-separator" />
      </div>
    );
  }

  if (!winningUri || preferEmbed) {
    return null;
  }

  return (
    <>
      <div className="wunderbar__label">
        <LbcSymbol prefix={__('Most Supported')} />
      </div>

      <WunderbarSuggestion uri={winningUri} />
      <hr className="wunderbar__top-separator" />
    </>
  );
}
