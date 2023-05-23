// @flow
import React from 'react';
import ClaimList from 'component/claimList';
import Page from 'component/page';
import Button from 'component/button';
import classnames from 'classnames';
import Icon from 'component/common/icon';
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
|};

type DispatchProps = {|
  doClearContentHistoryAll: () => void,
  doResolveUris: (uris: Array<string>, returnCachedClaims: boolean, resolveReposts: boolean) => void,
  doOpenModal: (id: any, modalProps: any) => void,
|};

// ****************************************************************************
// WatchHistoryPage
// ****************************************************************************

export default function WatchHistoryPage(props: Props & StateProps & DispatchProps) {
  const { historyUris, doClearContentHistoryAll, doResolveUris, doOpenModal } = props;

  const { uris, page, isLoadingPage, bumpPage } = useClaimListInfiniteScroll(
    historyUris,
    doResolveUris,
    PAGE_SIZE,
    true
  );

  function clearHistory() {
    doOpenModal(MODALS.CONFIRM, {
      title: __('Clear History'),
      subtitle: __('Watch history will be cleared from this device.'),
      onConfirm: (closeModal) => {
        doClearContentHistoryAll();
        closeModal();
      },
    });
  }

  return (
    <Page className="historyPage-wrapper">
      <div className={classnames('section card-stack')}>
        <div className="claim-list__header">
          <h1 className="page__title">
            <Icon icon={ICONS.WATCH_HISTORY} style={{ marginRight: 'var(--spacing-s)' }} />
            <label>{__('Watch History')}</label>
            <Tooltip title={__('Currently, your watch history is only saved locally.')}>
              <Button className="icon--help" icon={ICONS.HELP} iconSize={14} />
            </Tooltip>
          </h1>

          <div className="claim-list__alt-controls--wrap">
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
        {uris.length === 0 && (
          <div style={{ textAlign: 'center' }}>
            <img src={YRBL_SAD_IMG_URL} />
            <h2 className="main--empty empty" style={{ marginTop: '0' }}>
              {__('Nothing here')}
            </h2>
          </div>
        )}
      </div>
    </Page>
  );
}
