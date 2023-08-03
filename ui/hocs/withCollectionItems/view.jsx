// @flow
import React from 'react';

import Spinner from 'component/spinner';

type Props = {
  collectionId: string,
  useIds?: boolean,
  // -- redux --
  isPrivate: ?boolean,
  collectionUrls: ?Array<string>,
  collectionIds: ?Array<string>,
  doResolveClaimId: (claimId: string, returnCachedClaims?: boolean, options?: {}) => void,
  doFetchItemsInCollection: (params: { collectionId: string }) => void,
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
      doResolveClaimId,
      doFetchItemsInCollection,
    } = props;

    const collectionItems = useIds ? collectionIds : collectionUrls;

    React.useEffect(() => {
      if (!isPrivate) {
        doResolveClaimId(collectionId, true, { include_is_my_output: true });
      }
    }, [collectionId, doResolveClaimId, isPrivate]);

    React.useEffect(() => {
      doFetchItemsInCollection({ collectionId });
    }, [collectionId, doFetchItemsInCollection]);

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
