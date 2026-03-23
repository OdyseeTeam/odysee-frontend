// @flow
import React from 'react';
import ClaimList from 'component/claimList';
import Page from 'component/page';
import Button from 'component/button';
import classnames from 'classnames';
import Icon from 'component/common/icon';
import Spinner from 'component/spinner';
import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';
import { YRBL_SAD_IMG_URL } from 'config';
import Tooltip from 'component/common/tooltip';
import useClaimListInfiniteScroll from 'effects/use-claimList-infinite-scroll';
import './style.scss';

export const PAGE_SIZE = 30;

// ****************************************************************************
// ****************************************************************************

export type Props = {||};

type StateProps = {|
  historyUris: Array<string>,
  fetchingRemoteHistory: boolean,
  isAuthenticated: boolean,
|};

type DispatchProps = {|
  doClearContentHistoryAll: () => void,
  doFetchViewHistory: () => void,
  doDeleteRemoteViewHistory: (claimId?: string) => Promise<any>,
  doResolveUris: (uris: Array<string>, returnCachedClaims: boolean, resolveReposts: boolean) => void,
  doOpenModal: (id: any, modalProps: any) => void,
|};

// ****************************************************************************
// WatchHistoryPage
// ****************************************************************************

export default function WatchHistoryPage(props: Props & StateProps & DispatchProps) {
  const {
    historyUris,
    fetchingRemoteHistory,
    isAuthenticated,
    doClearContentHistoryAll,
    doFetchViewHistory,
    doDeleteRemoteViewHistory,
    doResolveUris,
    doOpenModal,
  } = props;

  const { uris, page, isLoadingPage, bumpPage } = useClaimListInfiniteScroll(
    historyUris,
    doResolveUris,
    PAGE_SIZE,
    true
  );

  // Re-fetch remote history when visiting the page, but only if we haven't fetched recently (5 min cooldown)
  const REFETCH_COOLDOWN_MS = 5 * 60 * 1000;
  React.useEffect(() => {
    if (isAuthenticated) {
      const store = window.store;
      const state = store && store.getState();
      const lastFetched = state && state.content && state.content.remoteHistoryLastFetched;
      if (!lastFetched || Date.now() - lastFetched > REFETCH_COOLDOWN_MS) {
        doFetchViewHistory();
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function clearHistory() {
    doOpenModal(MODALS.CONFIRM, {
      title: __('Clear History'),
      subtitle: isAuthenticated
        ? __('Watch history will be cleared from this device and your synced account.')
        : __('Watch history will be cleared from this device.'),
      onConfirm: (closeModal) => {
        doClearContentHistoryAll();
        if (isAuthenticated) {
          doDeleteRemoteViewHistory();
        }
        closeModal();
      },
    });
  }

  const historyInfoText = isAuthenticated
    ? __('Your watch history syncs across devices for the last 30 days. Older history is kept locally on this device.')
    : __('Your watch history is only saved locally on this device. Sign in to sync across devices.');

  return (
    <Page className="historyPage-wrapper">
      <div className={classnames('section card-stack')}>
        <div className="claim-list__header">
          <h1 className="page__title">
            <Icon icon={ICONS.WATCH_HISTORY} style={{ marginRight: 'var(--spacing-s)' }} />
            <label>{__('Watch History')}</label>
            <Tooltip title={historyInfoText}>
              <Button className="icon--help" icon={ICONS.HELP} iconSize={14} />
            </Tooltip>
          </h1>

          <div className="claim-list__alt-controls--wrap">
            {fetchingRemoteHistory && (
              <span className="watch-history__syncing">
                <Spinner type="small" />
                <span>{__('Syncing history...')}</span>
              </span>
            )}
            {uris.length > 0 && (
              <Button
                title={__('Clear History')}
                button="primary"
                label={__('Clear History')}
                onClick={() => clearHistory()}
              />
            )}
          </div>
        </div>
        {isAuthenticated && uris.length > 0 && (
          <div className="watch-history__sync-notice">
            <Icon icon={ICONS.INFO} size={16} />
            <span>
              {__('Synced history is available for the last 30 days. Older history is only stored on this device.')}
            </span>
          </div>
        )}
        {uris.length > 0 && (
          <ClaimList
            uris={uris.slice(0, (page + 1) * PAGE_SIZE)}
            onScrollBottom={bumpPage}
            page={page + 1}
            pageSize={PAGE_SIZE}
            loading={isLoadingPage}
            useLoadingSpinner
            inWatchHistory
          />
        )}
        {uris.length === 0 && !fetchingRemoteHistory && (
          <div style={{ textAlign: 'center' }}>
            <img src={YRBL_SAD_IMG_URL} />
            <h2 className="main--empty empty" style={{ marginTop: '0' }}>
              {__('Nothing here')}
            </h2>
          </div>
        )}
        {uris.length === 0 && fetchingRemoteHistory && (
          <div style={{ textAlign: 'center', padding: 'var(--spacing-l)' }}>
            <Spinner type="small" />
            <p style={{ marginTop: 'var(--spacing-s)' }}>{__('Loading watch history from your account...')}</p>
          </div>
        )}
      </div>
    </Page>
  );
}
