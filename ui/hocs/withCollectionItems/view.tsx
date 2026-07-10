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
  selectCountForCollectionId,
} from 'redux/selectors/collections';
import { doResolveClaimId } from 'redux/actions/claims';
import { doFetchItemsInCollection } from 'redux/actions/collections';

type Props = {
  collectionId: string;
  useIds?: boolean;
};
type InjectedProps = {
  isPrivate: boolean;
  collectionUrls: any;
  collectionIds: any;
  collectionHasItemsResolved: boolean;
};

const withCollectionItems = <P extends Props>(Component: React.ComponentType<P & InjectedProps>) => {
  const CollectionItemsWrapper = (props: P) => {
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
    const rawCollectionItemCount = useAppSelector((state) => selectCountForCollectionId(state, collectionId));
    const collectionItemCount = typeof rawCollectionItemCount === 'number' ? rawCollectionItemCount : 0;

    const collectionItems = useIds ? collectionIds : collectionUrls;
    const hasResolvedCollectionItems =
      Array.isArray(collectionItems) && (collectionItems.length > 0 || collectionItemCount === 0);
    const effectiveCollectionHasItemsResolved = collectionHasItemsResolved || hasResolvedCollectionItems;
    const shouldFetchCollectionItems = collectionItems === undefined || !effectiveCollectionHasItemsResolved;
    const hasNoResolvedItems = Array.isArray(collectionItems) && collectionItems.length === 0;
    const shouldKeepLoading =
      collectionItems === undefined ||
      (!effectiveCollectionHasItemsResolved && collectionItemCount > 0 && hasNoResolvedItems);

    React.useEffect(() => {
      if (!isPrivate) {
        dispatch(doResolveClaimId(collectionId, true, { include_is_my_output: true }));
      }
    }, [collectionId, dispatch, isPrivate]);

    const [fetchAttempt, setFetchAttempt] = React.useState(0);

    React.useEffect(() => {
      setFetchAttempt(0);
    }, [collectionId]);

    React.useEffect(() => {
      if (shouldFetchCollectionItems) {
        let cancelled = false;
        let retryTimeout;

        // A failed fetch used to leave the spinner up forever because nothing
        // re-triggered this effect — retry a few times (with backoff) instead.
        Promise.resolve(dispatch(doFetchItemsInCollection({ collectionId }))).finally(() => {
          if (!cancelled) {
            retryTimeout = setTimeout(
              () => {
                if (!cancelled) setFetchAttempt((attempt) => (attempt < 3 ? attempt + 1 : attempt));
              },
              2000 * (fetchAttempt + 1)
            );
          }
        });

        return () => {
          cancelled = true;
          if (retryTimeout) clearTimeout(retryTimeout);
        };
      }
    }, [collectionId, dispatch, shouldFetchCollectionItems, fetchAttempt]);

    if (shouldKeepLoading) {
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
        collectionHasItemsResolved={effectiveCollectionHasItemsResolved}
      />
    );
  };

  CollectionItemsWrapper.displayName = `withCollectionItems(${Component.displayName || Component.name || 'Component'})`;
  return CollectionItemsWrapper;
};

export default withCollectionItems;
