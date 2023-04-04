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
import Card from 'component/common/card';
import Button from 'component/button';

type Props = {
  // -- path match --
  collectionId: string,
  // -- redux --
  hasClaim: ?boolean,
  collection: Collection,
  brokenUrls: ?Array<any>,
  isCollectionMine: boolean,
  isPrivate: boolean,
  hasPrivate: boolean,
  doResolveClaimId: (claimId: string, returnCachedClaims?: boolean, options?: {}) => void,
  doCollectionEdit: (collectionId: string, params: CollectionEditParams) => void,
  doRemoveFromUnsavedChangesCollectionsForCollectionId: (collectionId: string) => void,
};

export const CollectionPageContext = React.createContext<any>();

const CollectionPage = (props: Props) => {
  const {
    // -- path match --
    collectionId,
    // -- redux --
    hasClaim,
    collection,
    brokenUrls,
    isCollectionMine,
    isPrivate,
    hasPrivate,
    doResolveClaimId,
    doCollectionEdit,
    doRemoveFromUnsavedChangesCollectionsForCollectionId,
  } = props;

  const {
    push,
    location: { search, state },
  } = useHistory();
  const { showEdit: pageShowEdit } = state || {};

  const [showEdit, setShowEdit] = React.useState(pageShowEdit);
  const [unavailableUris, setUnavailable] = React.useState(brokenUrls || []);

  const { name } = collection || {};

  const urlParams = new URLSearchParams(search);
  const publishing = urlParams.get(COLLECTION_PAGE.QUERIES.VIEW) === COLLECTION_PAGE.VIEWS.PUBLISH;
  const editing = urlParams.get(COLLECTION_PAGE.QUERIES.VIEW) === COLLECTION_PAGE.VIEWS.EDIT;
  const publishPage = editing || publishing;
  const isBuiltin = COLLECTIONS_CONSTS.BUILTIN_PLAYLISTS.includes(collectionId);
  const isOnPublicView = urlParams.get(COLLECTION_PAGE.QUERIES.VIEW) === COLLECTION_PAGE.VIEWS.PUBLIC;

  const isResolvingCollection = hasClaim === undefined;

  function togglePublicCollection() {
    if (isOnPublicView) {
      return push(`/$/${PAGES.PLAYLIST}/${collectionId}`);
    }

    const newUrlParams = new URLSearchParams();
    newUrlParams.append(COLLECTION_PAGE.QUERIES.VIEW, COLLECTION_PAGE.VIEWS.PUBLIC);
    push(`/$/${PAGES.PLAYLIST}/${collectionId}?${newUrlParams.toString()}`);
  }

  function saveChanges() {
    doCollectionEdit(collectionId, { isPreview: false });
    setShowEdit(false);
  }

  function clearChanges() {
    doRemoveFromUnsavedChangesCollectionsForCollectionId(collectionId);
    setShowEdit(false);
  }

  React.useEffect(() => {
    if (!isPrivate) {
      doResolveClaimId(collectionId, true, { include_is_my_output: true });
    }
  }, [collectionId, doResolveClaimId, isPrivate]);

  if (!hasPrivate && isResolvingCollection) {
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

  if (publishPage && !isBuiltin && isCollectionMine) {
    const getPagePath = (id) => `/$/${PAGES.PLAYLIST}/${id}`;
    const doReturnForId = (id) => push(getPagePath(id));

    return (
      <Page
        noFooter
        noSideNavigation
        backout={{ title: (editing ? __('Editing') : hasClaim ? __('Updating') : __('Publishing')) + ' ' + name }}
      >
        <CollectionPublishForm collectionId={collectionId} onDoneForId={doReturnForId} useIds />
      </Page>
    );
  }

  return (
    <Page className="playlists-page-wrapper">
      <div className="section card-stack">
        <CollectionPageContext.Provider value={{ togglePublicCollection }}>
          <CollectionHeader
            collection={collection}
            showEdit={showEdit}
            setShowEdit={setShowEdit}
            unavailableUris={unavailableUris}
            setUnavailable={setUnavailable}
          />

          <CollectionItemsList
            collectionId={collectionId}
            showEdit={showEdit}
            isEditPreview
            unavailableUris={unavailableUris}
            showNullPlaceholder
          />
        </CollectionPageContext.Provider>
      </div>
      {showEdit && (
        <div className="card-fixed-bottom">
          <Card
            className="card--after-tabs tab__panel"
            actions={
              <>
                <div className="section__actions">
                  <Button button="primary" label={__('Save')} onClick={saveChanges} />
                  <Button button="link" label={__('Cancel')} onClick={clearChanges} />
                </div>
              </>
            }
          />
        </div>
      )}
    </Page>
  );
};

export default CollectionPage;
