import React from 'react';
import Button from 'component/button';
import ChannelThumbnail from 'component/channelThumbnail';
import ClaimList from 'component/claimList';
import ClaimPreviewTitle from 'component/claimPreviewTitle';
import DebouncedInput from 'component/common/debounced-input';
import Empty from 'component/common/empty';
import Page from 'component/page';
import Spinner from 'component/spinner';
import * as ICONS from 'constants/icons';
import { SIDEBAR_SUBS_DISPLAYED } from 'constants/subscriptions';
import useComponentDidMount from 'effects/use-component-did-mount';
import useClaimListInfiniteScroll from 'effects/use-claimList-infinite-scroll';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { doResolveUris } from 'redux/actions/claims';
import { doFetchLastActiveSubs } from 'redux/actions/subscriptions';
import { selectLastActiveSubscriptions, selectSubscriptionUris } from 'redux/selectors/subscriptions';
import './style.scss';

function getFilteredUris(uris: Array<string>, filterQuery: string) {
  if (filterQuery) {
    const filterQueryLowerCase = filterQuery.toLowerCase();
    return uris.filter((uri) => uri.toLowerCase().includes(filterQueryLowerCase));
  }

  return null;
}

// ****************************************************************************
// ChannelsFollowingManage
// ****************************************************************************
const FOLLOW_PAGE_SIZE = 30;
export default function ChannelsFollowingManage() {
  const dispatch = useAppDispatch();
  const subscribedChannelUris = useAppSelector(selectSubscriptionUris);
  const lastActiveSubs = useAppSelector(selectLastActiveSubscriptions);

  const doResolveUrisFn = React.useCallback(
    (uris: Array<string>, returnCachedClaims: boolean, resolveReposts: boolean) => {
      dispatch(doResolveUris(uris, returnCachedClaims, resolveReposts));
    },
    [dispatch]
  );
  const { uris, page, isLoadingPage, bumpPage } = useClaimListInfiniteScroll(
    subscribedChannelUris,
    doResolveUrisFn,
    FOLLOW_PAGE_SIZE
  );
  // Filtered query and their uris.
  const [filterQuery, setFilterQuery] = React.useState('');
  const [filteredUris, setFilteredUris] = React.useState(null);

  async function resolveUris(uris: Array<string>) {
    return doResolveUrisFn(uris, true, false);
  }

  React.useEffect(() => {
    const filteredUris = getFilteredUris(uris, filterQuery);

    if (filteredUris) {
      resolveUris(filteredUris).finally(() => setFilteredUris(filteredUris));
    } else {
      setFilteredUris(filteredUris);
    } // eslint-disable-next-line react-hooks/exhaustive-deps -- Only need to respond to 'filterQuery'
  }, [filterQuery]);
  useComponentDidMount(() => {
    dispatch(doFetchLastActiveSubs(true));
  });
  return (
    <Page noFooter>
      <div className="card__title-section">
        <div className="card__title"> {__('Followed Channels')}</div>
      </div>

      {page < 0 ? (
        <div className="main--empty">
          <Spinner delayed />
        </div>
      ) : uris && uris.length === 0 ? (
        <Empty padded text={__('No followed channels.')} />
      ) : (
        <>
          <DebouncedInput icon={ICONS.SEARCH} placeholder={__('Filter')} onChange={setFilterQuery} inline />

          {filteredUris && <ClaimList uris={filteredUris} />}

          {!filteredUris && lastActiveSubs && lastActiveSubs.length === SIDEBAR_SUBS_DISPLAYED && (
            <>
              <div className="card__title-section">
                <div className="card__subtitle"> {__('Recently Active')}</div>
              </div>
              <div className="following__recently-active">
                {lastActiveSubs.map((sub) => {
                  return (
                    <div key={sub.uri} className="navigation-link__wrapper navigation__subscription">
                      <Button
                        navigate={sub.uri}
                        className="navigation-link navigation-link--with-thumbnail"
                        activeClass="navigation-link--active"
                      >
                        <ChannelThumbnail xsmall uri={sub.uri} hideStakedIndicator />
                        <div className="navigation__subscription-title">
                          <ClaimPreviewTitle uri={sub.uri} />
                          <span dir="auto" className="channel-name">
                            {sub.channelName}
                          </span>
                        </div>
                      </Button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {!filteredUris && uris.length > 0 && (
            <>
              <div className="card__title-section">
                <div className="card__subtitle"> {__('All Channels')}</div>
              </div>
              <ClaimList
                uris={uris.slice(0, (page + 1) * FOLLOW_PAGE_SIZE)}
                onScrollBottom={bumpPage}
                page={page + 1}
                pageSize={FOLLOW_PAGE_SIZE}
                loading={isLoadingPage}
                useLoadingSpinner
                showHiddenByUser
                showUnresolvedClaims
              />
            </>
          )}
        </>
      )}
    </Page>
  );
}
