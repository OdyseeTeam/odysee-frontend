// @flow
import React from 'react';
import CollectionItemsList from 'component/collectionItemsList';
import Page from 'component/page';
import * as PAGES from 'constants/pages';
import * as COLLECTIONS_CONSTS from 'constants/collections';
import { COLLECTION_PAGE } from 'constants/urlParams';
import { useHistory } from 'react-router-dom';
import CollectionPublishForm from './internal/collectionPublishForm';
import CollectionHeader from './internal/collectionHeader';
import Spinner from 'component/spinner';

type Props = {
  // -- path match --
  collectionId: string,
  // -- redux --
  hasClaim: boolean,
  collection: Collection,
  collectionUrls: Array<string>,
  brokenUrls: ?Array<any>,
  isResolvingCollection: boolean,
  isResolving: boolean,
  isCollectionMine: boolean,
  collectionClaimsIds: Array<string>,
  doFetchItemsInCollection: (params: { collectionId: string }, cb?: () => void) => void,
};

export const CollectionPageContext = React.createContext<any>();

export default function CollectionPage(props: Props) {
  const {
    // -- path match --
    collectionId,
    // -- redux --
    hasClaim,
    collection,
    collectionUrls,
    brokenUrls,
    isResolvingCollection,
    isResolving,
    isCollectionMine,
    collectionClaimsIds,
    doFetchItemsInCollection,
  } = props;

  const {
    push,
    location: { search, state },
  } = useHistory();
  const { showEdit: pageShowEdit } = state || {};

  const [showEdit, setShowEdit] = React.useState(pageShowEdit);
  const [unavailableUris, setUnavailable] = React.useState(brokenUrls || []);

  const { name, itemCount, items } = collection || {};

  const urlParams = new URLSearchParams(search);
  const publishing = urlParams.get(COLLECTION_PAGE.QUERIES.VIEW) === COLLECTION_PAGE.VIEWS.PUBLISH;
  const editing = urlParams.get(COLLECTION_PAGE.QUERIES.VIEW) === COLLECTION_PAGE.VIEWS.EDIT;
  const editPage = editing || publishing;
  const isBuiltin = COLLECTIONS_CONSTS.BUILTIN_PLAYLISTS.includes(collectionId);

  const urlsReady = collectionUrls && (itemCount === undefined || (itemCount && itemCount === collectionUrls.length));

  const privateColItemsToBeFetched = !hasClaim && items && items.length !== collectionClaimsIds.length;

  function togglePublicCollection() {
    const isOnPublicView = urlParams.get(COLLECTION_PAGE.QUERIES.VIEW) === COLLECTION_PAGE.VIEWS.PUBLIC;

    if (isOnPublicView) {
      return push(`/$/${PAGES.PLAYLIST}/${collectionId}`);
    }

    const newUrlParams = new URLSearchParams();
    newUrlParams.append(COLLECTION_PAGE.QUERIES.VIEW, COLLECTION_PAGE.VIEWS.PUBLIC);
    push(`/$/${PAGES.PLAYLIST}/${collectionId}?${newUrlParams.toString()}`);
  }

  React.useEffect(() => {
    if ((!urlsReady && !collection) || privateColItemsToBeFetched) {
      doFetchItemsInCollection({ collectionId });
    }
  }, [collection, collectionId, doFetchItemsInCollection, privateColItemsToBeFetched, urlsReady]);

  if (isResolving || isResolving === undefined || isResolvingCollection || isCollectionMine === undefined) {
    return (
      <div className="main--empty">
        <Spinner />
      </div>
    );
  }

  if (!collection && !isResolvingCollection) {
    return (
      <Page>
        <div className="main--empty empty">{__('Nothing here')}</div>
      </Page>
    );
  }

  if (editPage && !isBuiltin && isCollectionMine) {
    const getPagePath = (id) => `/$/${PAGES.PLAYLIST}/${id}`;
    const doReturnForId = (id) => push(getPagePath(id));

    return (
      <Page
        noFooter
        noSideNavigation
        backout={{ title: (editing ? __('Editing') : hasClaim ? __('Updating') : __('Publishing')) + ' ' + name }}
      >
        <CollectionPageContext.Provider value={{}}>
          <CollectionPublishForm collectionId={collectionId} onDoneForId={doReturnForId} />
        </CollectionPageContext.Provider>
      </Page>
    );
  }

  return (
    <Page className="playlists-page-wrapper">
      <div className="section card-stack">
        <CollectionPageContext.Provider value={{ togglePublicCollection }}>
          <CollectionHeader
            collectionId={collectionId}
            showEdit={showEdit}
            setShowEdit={setShowEdit}
            unavailableUris={unavailableUris}
            setUnavailable={setUnavailable}
          />

          <CollectionItemsList
            collectionId={collectionId}
            showEdit={showEdit}
            unavailableUris={unavailableUris}
            showNullPlaceholder
          />
        </CollectionPageContext.Provider>
      </div>
    </Page>
  );
}
