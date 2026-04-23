import * as ICONS from 'constants/icons';
import React, { useState } from 'react';
import usePersistedState from 'effects/use-persisted-state';
import Button from 'component/button';
import ClaimList from 'component/claimList';
import Paginate from 'component/common/paginate';
import { PAGE_SIZE } from 'constants/claim';
import { Form } from 'component/common/form-components/form';
import Icon from 'component/common/icon';
import { FormField } from 'component/common/form-components/form-field';
import classnames from 'classnames';
import Yrbl from 'component/yrbl';
import { PURCHASES_PAGE_SIZE } from 'page/library/view';
import Spinner from 'component/spinner';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from 'redux/hooks';
import {
  makeSelectSearchDownloadUrlsForPage,
  selectDownloadUrlsCount,
  selectIsFetchingFileList,
} from 'redux/selectors/file_info';
import {
  makeSelectMyPurchasesForPage,
  selectIsFetchingMyPurchases,
  selectMyPurchasesCount,
} from 'redux/selectors/claims';

const VIEW_DOWNLOADS = 'view_download';
const VIEW_PURCHASES = 'view_purchases';
const ENABLE_DOWNLOADS_TAB = false;

function FileListDownloaded() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const urlParams = new URLSearchParams(search);
  const query = urlParams.get('query') || '';
  const page = Number(urlParams.get('page')) || 1;
  const downloadedUrlsCount = useAppSelector(selectDownloadUrlsCount);
  const myPurchasesCount = useAppSelector(selectMyPurchasesCount);
  const myPurchases = useAppSelector((state) => makeSelectMyPurchasesForPage(query, page)(state));
  const myDownloads = useAppSelector((state) => makeSelectSearchDownloadUrlsForPage(query, page)(state));
  const fetchingFileList = useAppSelector(selectIsFetchingFileList);
  const fetchingMyPurchases = useAppSelector(selectIsFetchingMyPurchases);
  const loading = fetchingFileList || fetchingMyPurchases;
  const [viewMode, setViewMode] = usePersistedState('library-view-mode', VIEW_PURCHASES);
  const [searchQuery, setSearchQuery] = useState('');

  function handleInputChange(e) {
    const { value } = e.target;

    if (value !== searchQuery) {
      setSearchQuery(value);
      navigate(`?query=${value}&page=1`, { replace: true });
    }
  }

  return (
    <>
      <div className="section__header--actions">
        {ENABLE_DOWNLOADS_TAB && (
          <div className="section__actions--inline">
            <Button
              icon={ICONS.LIBRARY}
              button="alt"
              label={__('Downloads')}
              className={classnames(`button-toggle`, {
                'button-toggle--active': viewMode === VIEW_DOWNLOADS,
              })}
              onClick={() => setViewMode(VIEW_DOWNLOADS)}
            />
            <Button
              icon={ICONS.PURCHASED}
              button="alt"
              label={__('Purchases')}
              className={classnames(`button-toggle`, {
                'button-toggle--active': viewMode === VIEW_PURCHASES,
              })}
              onClick={() => setViewMode(VIEW_PURCHASES)}
            />
            {loading && <Spinner type="small" />}
          </div>
        )}
      </div>
      {IS_WEB && viewMode === VIEW_DOWNLOADS ? (
        <div className="main--empty">
          <Yrbl
            title={__('Try out the app!')}
            subtitle={
              <p className="section__subtitle">{__("Download the app to track files you've viewed and downloaded.")}</p>
            }
            actions={
              <div className="section__actions">
                <Button button="primary" label={__('Get The App')} href="https://lbry.com/get" />
              </div>
            }
          />
        </div>
      ) : (
        <div>
          <ClaimList
            header={<h1 className="section__title">{__('Purchases')}</h1>}
            headerAltControls={
              <Form onSubmit={() => {}} className="wunderbar--inline">
                <Icon icon={ICONS.SEARCH} />
                <FormField
                  className="wunderbar__input--inline"
                  onChange={handleInputChange}
                  value={query}
                  type="text"
                  name="query"
                  placeholder={__('Search')}
                />
              </Form>
            }
            renderProperties={() => null}
            empty={
              viewMode === VIEW_PURCHASES && !query ? (
                <div>{__('No purchases found.')}</div>
              ) : (
                __('No results for %query%', {
                  query,
                })
              )
            }
            uris={viewMode === VIEW_PURCHASES ? myPurchases : myDownloads}
            loading={loading}
          />
          {!query && (
            <Paginate
              totalPages={Math.ceil(
                Number(viewMode === VIEW_PURCHASES ? myPurchasesCount : downloadedUrlsCount) /
                  Number(viewMode === VIEW_PURCHASES ? PURCHASES_PAGE_SIZE : PAGE_SIZE)
              )}
            />
          )}
        </div>
      )}
    </>
  );
}
export default FileListDownloaded;
