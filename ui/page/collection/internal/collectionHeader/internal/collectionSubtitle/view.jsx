// @flow
import React from 'react';

import * as PAGES from 'constants/pages';
import * as ICONS from 'constants/icons';

import { formatCredits } from 'util/format-credits';

import ClaimDescription from 'component/claimDescription';
import ClaimAuthor from 'component/claimAuthor';
import CollectionPrivateIcon from 'component/common/collection-private-icon';
import Skeleton from '@mui/material/Skeleton';
import Button from 'component/button';
import LbcSymbol from 'component/common/lbc-symbol';
import FileValues from 'component/fileValues';
import FileDetails from 'component/fileDetails';
import ClaimTags from 'component/claimTags';
import ClaimSupportsLiquidateButton from 'component/claimSupportsLiquidateButton';

const EXPAND = {
  NONE: 'none',
  CREDIT_DETAILS: 'credit_details',
  FILE_DETAILS: 'file_details',
};

type Props = {
  // -- redux --
  uri?: string,
  collectionDescription?: string,
  collectionCount?: number,
  sourceId: ?string,
  hasClaim: boolean,
  claimAmount: number,
  isFeaturedChannels: ?boolean,
};

const CollectionTitle = (props: Props) => {
  const { uri, collectionDescription, collectionCount, sourceId, hasClaim, claimAmount, isFeaturedChannels } = props;

  const [expand, setExpand] = React.useState(EXPAND.NONE);

  const formattedAmount = formatCredits(claimAmount, 2, true);

  function handleExpand(newExpand) {
    if (expand === newExpand) {
      setExpand(EXPAND.NONE);
    } else {
      setExpand(newExpand);
    }
  }

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

          {hasClaim && !isFeaturedChannels && (
            <div className="collection-subtitle__info">
              <Button
                button="link"
                className="dim"
                icon={ICONS.INFO}
                aria-label={__('View claim details')}
                onClick={() => handleExpand(EXPAND.FILE_DETAILS)}
              />

              <Button button="link" className="dim" onClick={() => handleExpand(EXPAND.CREDIT_DETAILS)}>
                <LbcSymbol postfix={expand === EXPAND.CREDIT_DETAILS ? __('Hide') : formattedAmount} />
              </Button>

              <ClaimSupportsLiquidateButton uri={uri} />
            </div>
          )}
        </span>
      ) : (
        <Skeleton variant="text" animation="wave" className="header__navigationItem--balanceLoading" />
      )}

      <ClaimDescription uri={uri} description={collectionDescription} />

      {expand === EXPAND.CREDIT_DETAILS && (
        <div className="section post__info--credit-details">
          <FileValues uri={uri} />
        </div>
      )}

      {expand === EXPAND.FILE_DETAILS && (
        <div className="section post__info--credit-details">
          <ClaimTags uri={uri} type="large" />
          <FileDetails uri={uri} />
        </div>
      )}

      {uri ? <ClaimAuthor uri={uri} /> : <CollectionPrivateIcon />}
    </div>
  );
};

export default CollectionTitle;
