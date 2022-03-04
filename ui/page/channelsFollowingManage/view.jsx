// @flow
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

function getFilteredUris(uris, filterQuery) {
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

type Props = {
  subscribedChannelUris: Array<string>,
  lastActiveSubs: ?Array<Subscription>,
  doResolveUris: (uris: Array<string>, returnCachedClaims: boolean, resolveReposts: boolean) => void,
};

export default function ChannelsFollowingManage(props: Props) {
  const { subscribedChannelUris, lastActiveSubs, doResolveUris } = props;

  // The locked-on-mount full set of subscribed uris.
  const [uris, setUris] = React.useState([]);

  // Filtered query and their uris.
  const [filterQuery, setFilterQuery] = React.useState('');
  const [filteredUris, setFilteredUris] = React.useState(null);

  // Infinite-scroll handling. 'page' is 0-indexed.
  const [page, setPage] = React.useState(-1);
  const lastPage = Math.max(0, Math.ceil(uris.length / FOLLOW_PAGE_SIZE) - 1);
  const [loadingPage, setLoadingPage] = React.useState(false);

  async function resolveUris(uris) {
    return doResolveUris(uris, true, false);
  }

  async function resolveNextPage(uris, currPage, pageSize = FOLLOW_PAGE_SIZE) {
    const nextPage = currPage + 1;
    const nextUriBatch = uris.slice(nextPage * pageSize, (nextPage + 1) * pageSize);
    return resolveUris(nextUriBatch);
  }

  function bumpPage() {
    if (page < lastPage) {
      setLoadingPage(true);
      resolveNextPage(uris, page).finally(() => {
        setLoadingPage(false);
        setPage(page + 1);
      });
    }
  }

  React.useEffect(() => {
    setUris(subscribedChannelUris);
    resolveNextPage(subscribedChannelUris, -1).finally(() => setPage(0));
    // eslint-disable-next-line react-hooks/exhaustive-deps, (lock list on mount so it doesn't shift when unfollow)
  }, []);

  React.useEffect(() => {
    const filteredUris = getFilteredUris(uris, filterQuery);
    if (filteredUris) {
      resolveUris(filteredUris).finally(() => setFilteredUris(filteredUris));
    } else {
      setFilteredUris(filteredUris);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps, (only need to respond to 'filterQuery')
  }, [filterQuery]);

  return (
    <Page className="followManage-wrapper" noFooter>
      <div className="card__title-section">
        <div className="card__title"> {__('Followed Channels')}</div>
      </div>

      {page < 0 ? (
        <div className="main--empty">
          <Spinner delayed />
        </div>
      ) : uris && uris.length === 0 ? (
        <Empty padded text="No followed channels." />
      ) : (
        <>
          <DebouncedInput icon={ICONS.SEARCH} placeholder={__('Filter')} onChange={setFilterQuery} inline />

          {filteredUris && <ClaimList uris={filteredUris} />}

          {!filteredUris && lastActiveSubs && lastActiveSubs.length === SIDEBAR_SUBS_DISPLAYED && (
            <>
              <div className="card__title-section">
                <div className="card__subtitle"> {__('Recently Active')}</div>
              </div>
              <div className="followManage-wrapper__activeSubs">
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
                loading={loadingPage}
                useLoadingSpinner
              />
            </>
          )}
        </>
      )}
    </Page>
  );
}
