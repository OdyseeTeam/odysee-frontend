import React from 'react';
import Spinner from 'component/spinner';
import * as COLLECTIONS_CONSTS from 'constants/collections';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import {
  selectHasPrivateCollectionForId,
  selectUrlsForCollectionId,
  selectUrlsForCollectionIdNonDeleted,
  selectClaimIdsForCollectionId,
  selectCollectionHasItemsResolvedForId,
} from 'redux/selectors/collections';
import { doResolveClaimId } from 'redux/actions/claims';
import { doFetchItemsInCollection } from 'redux/actions/collections';

type Props = {
  collectionId: string;
  useIds?: boolean;
};

const withCollectionItems = (Component: FunctionalComponentParam) => {
  const CollectionItemsWrapper = (props: Props) => {
    const { collectionId, useIds } = props;
    const dispatch = useAppDispatch();
    const isPrivate = useAppSelector((state) => selectHasPrivateCollectionForId(state, collectionId));
    const collectionUrls = useAppSelector((state) =>
      collectionId === COLLECTIONS_CONSTS.WATCH_LATER_ID
        ? selectUrlsForCollectionIdNonDeleted(state, collectionId)
        : selectUrlsForCollectionId(state, collectionId)
    );
    const collectionIds = useAppSelector((state) => selectClaimIdsForCollectionId(state, collectionId));
    const collectionHasItemsResolved = useAppSelector((state) =>
      selectCollectionHasItemsResolvedForId(state, collectionId)
    );

    const collectionItems = useIds ? collectionIds : collectionUrls;
    const shouldFetchCollectionItems = collectionItems === undefined || !collectionHasItemsResolved;

    React.useEffect(() => {
      if (!isPrivate) {
        dispatch(doResolveClaimId(collectionId, true, { include_is_my_output: true }));
      }
    }, [collectionId, dispatch, isPrivate]);

    React.useEffect(() => {
      if (shouldFetchCollectionItems) {
        dispatch(doFetchItemsInCollection({ collectionId }));
      }
    }, [collectionId, dispatch, shouldFetchCollectionItems]);

    if (collectionItems === undefined) {
      return (
        <div className="main--empty">
          <Spinner />
        </div>
      );
    }

    return (
      <Component
        {...props}
        isPrivate={isPrivate}
        collectionUrls={collectionUrls}
        collectionIds={collectionIds}
        collectionHasItemsResolved={collectionHasItemsResolved}
      />
    );
  };

  return CollectionItemsWrapper;
};

export default withCollectionItems;
