import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import * as MODALS from 'constants/modal_types';
import React from 'react';
import { parseURI } from 'util/lbryURI';
import ClaimPreview from 'component/claimPreview';
import Button from 'component/button';
import ClaimEffectiveAmount from 'component/claimEffectiveAmount';
import ClaimRepostAuthor from 'component/claimRepostAuthor';
import I18nMessage from 'component/i18nMessage';
import LbcSymbol from 'component/common/lbc-symbol';
import { DOMAIN } from 'config';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { doBeginPublish } from 'redux/actions/publish';
import { doResolveUris } from 'redux/actions/claims';
import { doOpenModal } from 'redux/actions/app';
import { selectPendingIds, selectClaimForUri } from 'redux/selectors/claims';
import { makeSelectWinningUriForQuery, selectIsResolvingWinningUri } from 'redux/selectors/search';

type Props = {
  query: string;
  hideLink?: boolean;
  setChannelActive: (arg0: boolean) => void;
  isSearching: boolean;
};

export default function SearchTopClaim(props: Props) {
  const { query = '', hideLink = false, setChannelActive, isSearching } = props;
  const dispatch = useAppDispatch();

  const winningUriSelector = React.useMemo(() => makeSelectWinningUriForQuery(query), [query]);
  const winningUri = useAppSelector(winningUriSelector);
  const winningClaim = useAppSelector((state) => (winningUri ? selectClaimForUri(state, winningUri) : undefined));
  const isResolvingWinningUri = useAppSelector((state) => (query ? selectIsResolvingWinningUri(state, query) : false));

  const uriFromQuery = `lbry://${query}`;
  let name;
  let channelUriFromQuery;
  let winningUriIsChannel;

  try {
    const { isChannel, streamName, channelName } = parseURI(uriFromQuery);

    if (!isChannel) {
      channelUriFromQuery = `lbry://@${query}`;
      name = streamName;
    } else {
      name = channelName;
    }
  } catch (e) {}

  if (winningUri) {
    try {
      const { isChannel: winnerIsChannel } = parseURI(winningUri);
      winningUriIsChannel = winnerIsChannel;
    } catch (e) {}
  }

  React.useEffect(() => {
    setChannelActive && winningUriIsChannel && setChannelActive(true);
  }, [setChannelActive, winningUriIsChannel]);
  React.useEffect(() => {
    let urisToResolve = [];

    if (uriFromQuery) {
      urisToResolve.push(uriFromQuery);
    }

    if (channelUriFromQuery) {
      urisToResolve.push(channelUriFromQuery);
    }

    if (urisToResolve.length > 0) {
      dispatch(doResolveUris(urisToResolve));
    }
  }, [dispatch, uriFromQuery, channelUriFromQuery]);
  return (
    <div className="search__header">
      {winningUri && (
        <div className="claim-preview__actions--header">
          <a
            className="media__uri"
            target="_blank"
            rel="noreferrer"
            href="https://help.odysee.tv/category-blockchain/category-staking/increase/"
            title={__('Learn more about Credits on %DOMAIN%', {
              DOMAIN,
            })}
          >
            <LbcSymbol prefix={__('Most supported')} />
          </a>
        </div>
      )}
      {winningUri && winningClaim && (
        <div className="card">
          <ClaimPreview
            hideRepostLabel
            showNullPlaceholder
            uri={winningUri}
            properties={(claim) => (
              <span className="claim-preview__custom-properties">
                <ClaimRepostAuthor short uri={winningUri} />
                <ClaimEffectiveAmount uri={winningUri} />
              </span>
            )}
          />
        </div>
      )}
      {!winningUri && (isSearching || isResolvingWinningUri) && (
        <div className="card">
          <ClaimPreview placeholder={'loading'} />
        </div>
      )}
      {!winningUri && !isSearching && !isResolvingWinningUri && uriFromQuery && (
        <div className="card card--section help--inline">
          <I18nMessage
            tokens={{
              repost: (
                <Button button="link" onClick={() => dispatch(doOpenModal(MODALS.REPOST, {}))} label={__('Repost')} />
              ),
              publish: (
                <span>
                  <Button button="link" onClick={() => dispatch(doBeginPublish('file', name))} label={__('publish')} />
                </span>
              ),
            }}
          >
            You have found the edge of the internet. %repost% or %publish% your stuff here to claim this spot.
          </I18nMessage>
        </div>
      )}
      {!hideLink && winningUri && (
        <div className="section__actions--between section__actions--no-margin">
          <span />
          <Button
            button="link"
            className="search__top-link"
            label={
              <I18nMessage
                tokens={{
                  name: <strong>{query}</strong>,
                }}
              >
                View competing uploads for %name%
              </I18nMessage>
            }
            navigate={`/$/${PAGES.TOP}?name=${query}`}
            iconRight={ICONS.ARROW_RIGHT}
          />
        </div>
      )}
    </div>
  );
}
