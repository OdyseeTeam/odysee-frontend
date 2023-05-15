// @flow
import React from 'react';
import classnames from 'classnames';

import './style.scss';
import Button from 'component/button';
import ClaimSearchView from 'component/claimSearchView';
import Page from 'component/page';
import Yrbl from 'component/yrbl';
import { MS } from 'constants/date-time';
import { SCHEDULED_TAGS, VISIBILITY_TAGS } from 'constants/tags';

// ****************************************************************************
// ****************************************************************************

export type Props = {||};

type StateProps = {| user: ?User |};

type DispatchProps = {||};

// ****************************************************************************
// ****************************************************************************

const FILTER = { UNLISTED: 0, SCHEDULED: 1 };

const csOptionsUnlisted: ClaimSearchOptions = {
  page_size: 20,
  any_tags: [VISIBILITY_TAGS.UNLISTED],
  claim_type: ['stream'],
  has_source: true,
  order_by: ['height'],
  remove_duplicates: true,
};

const csOptionsScheduled: ClaimSearchOptions = {
  page_size: 20,
  any_tags: [SCHEDULED_TAGS.SHOW, SCHEDULED_TAGS.HIDE],
  claim_type: ['stream'],
  has_source: true,
  order_by: ['height'],
  remove_duplicates: true,
  release_time: `>${Math.floor(Date.now() / MS.HOUR) * 3600}`,
};

// ****************************************************************************
// HiddenContentPage
// ****************************************************************************

function HiddenContentPage(props: Props & StateProps & DispatchProps) {
  const { user } = props;
  const canView = process.env.ENABLE_WIP_FEATURES || user?.global_mod;
  const [filter, setFilter] = React.useState(FILTER.UNLISTED);

  // --------------------------------------------------------------------------

  const Header = () => {
    return (
      <div className="hidden-content__header">
        <div className="hidden-content__filter">
          <Button
            button="alt"
            key="unlisted"
            label={__('Unlisted')}
            onClick={() => setFilter(FILTER.UNLISTED)}
            className={classnames(`button-toggle`, { 'button-toggle--active': filter === FILTER.UNLISTED })}
          />
          <Button
            button="alt"
            key="scheduled"
            label={__('Scheduled')}
            onClick={() => setFilter(FILTER.SCHEDULED)}
            className={classnames(`button-toggle`, { 'button-toggle--active': filter === FILTER.SCHEDULED })}
          />
        </div>
      </div>
    );
  };

  const NoAccess = () => {
    return (
      <Yrbl
        type="sad"
        title={__('Sorry, no soup for you!')}
        actions={
          <div className="section__actions">
            <Button button="primary" navigate="/" label={__('Go Home')} />
          </div>
        }
      />
    );
  };

  // --------------------------------------------------------------------------

  return (
    <Page>
      {canView ? (
        <>
          <Header />
          <ClaimSearchView
            key={filter === FILTER.UNLISTED ? 'unlisted' : 'scheduled'}
            csOptions={filter === FILTER.UNLISTED ? csOptionsUnlisted : csOptionsScheduled}
            layout="list"
            pagination="infinite"
          />
        </>
      ) : (
        <NoAccess />
      )}
    </Page>
  );
}

export default HiddenContentPage;
