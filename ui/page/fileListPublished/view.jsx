// @flow
import type { DoFetchClaimListMine } from 'redux/actions/claims';

import './style.scss';
import * as ICONS from 'constants/icons';
import React, { useEffect } from 'react';
import Button from 'component/button';
import ClaimList from 'component/claimList';
import ClaimPreview from 'component/claimPreview';
import Page from 'component/page';
import Icon from 'component/common/icon';
import Paginate from 'component/common/paginate';
import WebUploadList from 'component/webUploadList';
import Spinner from 'component/spinner';
import Yrbl from 'component/yrbl';
import classnames from 'classnames';

type FilterInfo = { key: string, cmd: string, label: string, ariaLabel?: string };

const FILTER: { [string]: FilterInfo } = Object.freeze({
  ALL: { key: 'ALL', cmd: 'stream,repost', label: 'All', ariaLabel: 'All uploads' },
  UPLOADS: { key: 'UPLOADS', cmd: 'stream', label: 'Uploads' },
  REPOSTS: { key: 'REPOSTS', cmd: 'repost', label: 'Reposts' },
  UNLISTED: { key: 'UNLISTED', cmd: '', label: 'Unlisted' },
  SCHEDULED: { key: 'SCHEDULED', cmd: '', label: 'Scheduled' },
});

type Props = {
  uploadCount: number,
  checkPendingPublishes: () => void,
  doBeginPublish: (PublishType, ?string) => void,
  fetchClaimListMine: DoFetchClaimListMine,
  fetching: boolean,
  myClaims: Array<Claim>,
  myStreamClaims: Array<Claim>,
  myRepostClaims: Array<Claim>,
  myUnlistedClaims: Array<Claim>,
  myScheduledClaims: Array<Claim>,
  history: { replace: (string) => void, push: (string) => void },
  page: number,
  pageSize: number,
  myChannelIds: ?Array<ClaimId>,
};

function FileListPublished(props: Props) {
  const {
    checkPendingPublishes,
    doBeginPublish,
    fetchClaimListMine,
    fetching,
    myClaims,
    myStreamClaims,
    myRepostClaims,
    myUnlistedClaims,
    myScheduledClaims,
    page,
    pageSize,
  } = props;

  const [filterBy, setFilterBy] = React.useState(FILTER.ALL.key);
  const [shouldResetPageNumber, setShouldResetPageNumber] = React.useState(false);

  const claimsToShow = React.useMemo(() => {
    let claims;
    switch (filterBy) {
      case FILTER.ALL.key:
        claims = myClaims;
        break;
      case FILTER.UPLOADS.key:
        claims = myStreamClaims;
        break;
      case FILTER.REPOSTS.key:
        claims = myRepostClaims;
        break;
      case FILTER.UNLISTED.key:
        claims = myUnlistedClaims;
        break;
      case FILTER.SCHEDULED.key:
        claims = myScheduledClaims;
        break;
      default:
        claims = [];
        break;
    }
    return claims;
  }, [myClaims, myStreamClaims, myRepostClaims, myUnlistedClaims, myScheduledClaims, filterBy]);

  const AdvisoryMsg = () => {
    if (filterBy === FILTER.UNLISTED.key) {
      return (
        <div className="flp__advisory">
          <Icon icon={ICONS.INFO} />
          <p>
            {__(
              'A special link is required to share unlisted contents. The link can be obtained from "Copy Link" in the context menu, or the "Share" functionality in the file page.'
            )}
          </p>
        </div>
      );
    }
    return null;
  };

  function getHeaderJsx() {
    return (
      <div className={classnames('flp__header')}>
        <div className="flp__filter">
          {/* $FlowIgnore: mixed bug */}
          {Object.values(FILTER).map((info: FilterInfo) => (
            <Button
              button="alt"
              key={info.label}
              label={__(info.label)}
              aria-label={info.ariaLabel}
              onClick={() => setFilterBy(info.key)}
              className={classnames(`button-toggle`, { 'button-toggle--active': filterBy === info.key })}
            />
          ))}
        </div>
        <div className="flp__refresh">
          {!fetching && (
            <Button
              button="alt"
              label={__('Refresh')}
              icon={ICONS.REFRESH}
              onClick={() => {
                fetchClaimListMine(1, 999999, true, [], true);
              }}
            />
          )}
        </div>
      </div>
    );
  }

  function getClaimListResultsJsx() {
    const startIndex = (page - 1) * Number(pageSize);
    const endIndex = startIndex + Number(pageSize);

    const urls = claimsToShow.slice(startIndex, endIndex).map((claim) => claim.permanent_url);
    return (
      <>
        {!!urls && (
          <>
            <ClaimList
              noEmpty
              persistedStorageKey="claim-list-published"
              showHiddenByUser
              uris={fetching ? [] : urls}
              loading={fetching}
            />
            {getFetchingPlaceholders()}
            <Paginate
              totalPages={claimsToShow.length > 0 ? Math.ceil(claimsToShow.length / Number(pageSize)) : 1}
              shouldResetPageNumber={shouldResetPageNumber}
            />
          </>
        )}
      </>
    );
  }

  function getFetchingPlaceholders() {
    return (
      <>
        {fetching &&
          new Array(Number(pageSize)).fill(1).map((x, i) => {
            return <ClaimPreview key={i} placeholder="loading" />;
          })}
      </>
    );
  }

  useEffect(() => {
    checkPendingPublishes();
  }, [checkPendingPublishes]);

  useEffect(() => {
    fetchClaimListMine(1, 999999, true, [], true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const firstUpdate = React.useRef(true);
  React.useLayoutEffect(() => {
    if (firstUpdate.current) {
      firstUpdate.current = false;
      return;
    }
    setShouldResetPageNumber(true);
  }, [filterBy]);

  React.useEffect(() => {
    if (shouldResetPageNumber) {
      setShouldResetPageNumber(false);
    }
  }, [shouldResetPageNumber]);

  return (
    <Page>
      <div className="card-stack">
        <WebUploadList />
        {getHeaderJsx()}
        <AdvisoryMsg />
        {getClaimListResultsJsx()}
      </div>
      {!(claimsToShow && claimsToShow.length) && (
        <React.Fragment>
          {!fetching ? (
            <section className="main--empty">
              <Yrbl
                title={filterBy === FILTER.REPOSTS ? __('No Reposts') : __('No uploads')}
                subtitle={
                  filterBy === FILTER.REPOSTS
                    ? __("You haven't reposted anything yet.")
                    : __("You haven't uploaded anything yet. This is where you can find them when you do!")
                }
                actions={
                  filterBy !== FILTER.REPOSTS && (
                    <div className="section__actions">
                      <Button
                        button="primary"
                        label={__('Upload Something New')}
                        onClick={() => doBeginPublish('file')}
                      />
                    </div>
                  )
                }
              />
            </section>
          ) : (
            <section className="main--empty">
              <Spinner delayed />
            </section>
          )}
        </React.Fragment>
      )}
    </Page>
  );
}

export default FileListPublished;
