// @flow
import React from 'react';

import * as PAGES from 'constants/pages';
import * as ICONS from 'constants/icons';

import ClaimDescription from 'component/claimDescription';
import ClaimAuthor from 'component/claimAuthor';
import CollectionPrivateIcon from 'component/common/collection-private-icon';
import Skeleton from '@mui/material/Skeleton';
import Button from 'component/button';

type Props = {
  // -- redux --
  uri?: string,
  collectionDescription?: string,
  collectionCount?: number,
  sourceId: ?string,
};

const CollectionTitle = (props: Props) => {
  const { uri, collectionDescription, collectionCount, sourceId } = props;

  return (
    <div>
      {sourceId && (
        <span className="collection__subtitle">
          <Button
            iconRight={ICONS.EXTERNAL}
            label={__('View copied playlist source')}
            button="link"
            navigate={`/$/${PAGES.PLAYLIST}/${sourceId}`}
          />
        </span>
      )}

      {collectionCount || collectionCount === 0 ? (
        <span className="collection__subtitle">
          {collectionCount === 1 ? __('1 item') : __('%collectionCount% items', { collectionCount })}
        </span>
      ) : (
        <Skeleton variant="text" animation="wave" className="header__navigationItem--balanceLoading" />
      )}

      <ClaimDescription uri={uri} description={collectionDescription} />

      {uri ? <ClaimAuthor uri={uri} /> : <CollectionPrivateIcon />}
    </div>
  );
};

export default CollectionTitle;
