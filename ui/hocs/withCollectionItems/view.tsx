import React from 'react';
import Spinner from 'component/spinner';
type Props = {
  collectionId: string;
  useIds?: boolean;
  // -- redux --
  isPrivate: boolean | null | undefined;
  collectionUrls: Array<string> | null | undefined;
  collectionIds: Array<string> | null | undefined;
  collectionHasItemsResolved: boolean;
  doResolveClaimId: (claimId: string, returnCachedClaims?: boolean, options?: {}) => void;
  doFetchItemsInCollection: (params: { collectionId: string }) => void;
};

/**
 * HigherOrderComponent for collections to resolve it and its items
 *
 * @param Component: FunctionalComponentParam
 * @returns {FunctionalComponent}
 */
const withCollectionItems = (Component: FunctionalComponentParam) => {
  const CreditCardPrompt = (props: Props) => {
    const {
      collectionId,
      useIds,
      isPrivate,
      collectionUrls,
      collectionIds,
      collectionHasItemsResolved,
      doResolveClaimId,
      doFetchItemsInCollection,
    } = props;
    const collectionItems = useIds ? collectionIds : collectionUrls;
    const shouldFetchCollectionItems = collectionItems === undefined || !collectionHasItemsResolved;
    React.useEffect(() => {
      if (!isPrivate) {
        doResolveClaimId(collectionId, true, {
          include_is_my_output: true,
        });
      }
    }, [collectionId, doResolveClaimId, isPrivate]);
    React.useEffect(() => {
      if (shouldFetchCollectionItems) {
        doFetchItemsInCollection({
          collectionId,
        });
      }
    }, [collectionId, doFetchItemsInCollection, shouldFetchCollectionItems]);

    if (collectionItems === undefined) {
      return (
        <div className="main--empty">
          <Spinner />
        </div>
      );
    }

    return <Component {...props} />;
  };

  return CreditCardPrompt;
};

export default withCollectionItems;
