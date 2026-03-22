import React from 'react';
import CollectionItemsList from 'component/collectionItemsList';
import Page from 'component/page';
import * as PAGES from 'constants/pages';
import * as COLLECTIONS_CONSTS from 'constants/collections';
import { COLLECTION_PAGE } from 'constants/urlParams';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import CollectionPublishForm from './internal/collectionPublishForm';
import CollectionHeader from './internal/collectionHeader';
import Spinner from 'component/spinner';
import Card from 'component/common/card';
import Button from 'component/button';
import Yrbl from 'component/yrbl';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import {
  selectHasClaimForId,
  selectClaimIsPendingForId,
  selectClaimForId,
  selectGeoRestrictionForUri,
} from 'redux/selectors/claims';
import {
  selectCollectionForId,
  selectBrokenUrlsForCollectionId,
  selectCollectionIsMine,
  selectHasPrivateCollectionForId,
  selectIsCollectionPrivateForId,
} from 'redux/selectors/collections';
import { doResolveClaimId as doResolveClaimIdAction } from 'redux/actions/claims';
import {
  doCollectionEdit as doCollectionEditAction,
  doRemoveFromUnsavedChangesCollectionsForCollectionId as doRemoveUnsavedAction,
} from 'redux/actions/collections';
import '../playlists/style.scss';

type Props = {
  collectionId?: string;
};
export const CollectionPageContext = React.createContext<any>({});

const CollectionPage = (props: Props) => {
  const dispatch = useAppDispatch();
  const { collectionId: routeCollectionId = '' } = useParams();
  const collectionId = props.collectionId || routeCollectionId;
  const claim = useAppSelector((state) => selectClaimForId(state, collectionId));
  const geoRestriction = useAppSelector((state) => selectGeoRestrictionForUri(state, claim?.permanent_url));
  const hasClaim = useAppSelector((state) => selectHasClaimForId(state, collectionId));
  const collection = useAppSelector((state) => selectCollectionForId(state, collectionId));
  const brokenUrls = useAppSelector((state) => selectBrokenUrlsForCollectionId(state, collectionId));
  const isCollectionMine = useAppSelector((state) => selectCollectionIsMine(state, collectionId));
  const hasPrivate = useAppSelector((state) => selectHasPrivateCollectionForId(state, collectionId));
  const isPrivate = useAppSelector((state) => selectIsCollectionPrivateForId(state, collectionId));
  const isClaimPending = useAppSelector((state) => selectClaimIsPendingForId(state, collectionId));
  const navigate = useNavigate();
  const { search, state, pathname } = useLocation();
  const isEmbedPath = pathname && pathname.startsWith('/$/embed');
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
      return navigate(`/$/${PAGES.PLAYLIST}/${collectionId}`);
    }

    const newUrlParams = new URLSearchParams();
    newUrlParams.append(COLLECTION_PAGE.QUERIES.VIEW, COLLECTION_PAGE.VIEWS.PUBLIC);
    navigate(`/$/${PAGES.PLAYLIST}/${collectionId}?${newUrlParams.toString()}`);
  }

  function saveChanges() {
    dispatch(
      doCollectionEditAction(collectionId, {
        isPreview: false,
      })
    );
    setShowEdit(false);
  }

  function clearChanges() {
    dispatch(doRemoveUnsavedAction(collectionId));
    setShowEdit(false);
  }

  React.useEffect(() => {
    if (!isPrivate) {
      dispatch(
        doResolveClaimIdAction(collectionId, true, {
          include_is_my_output: true,
        })
      );
    }
  }, [collectionId, dispatch, isPrivate]);

  if (geoRestriction) {
    return (
      <Page noSideNavigation={isEmbedPath}>
        <div className="main--empty">
          <Yrbl
            title={__('Content unavailable')}
            subtitle={geoRestriction.message ? __(geoRestriction.message) : ''}
            type="sad"
            alwaysShow
          />
        </div>
      </Page>
    );
  }

  if (!hasPrivate && isResolvingCollection) {
    return (
      <div className="main--empty">
        <Spinner />
      </div>
    );
  }

  if (!collection && !isResolvingCollection) {
    return (
      <Page noSideNavigation={isEmbedPath}>
        <div className="main--empty empty">{__('Nothing here')}</div>
      </Page>
    );
  }

  if (publishPage && !isBuiltin && isCollectionMine) {
    const getPagePath = (id) => `/$/${PAGES.PLAYLIST}/${id}`;

    const doReturnForId = (id) => navigate(getPagePath(id));

    return (
      <Page
        noFooter
        noSideNavigation
        backout={{
          title: (editing ? __('Editing') : hasClaim ? __('Updating') : __('Publishing')) + ' ' + name,
        }}
      >
        <CollectionPublishForm collectionId={collectionId} onDoneForId={doReturnForId} useIds />
      </Page>
    );
  }

  return (
    <Page className="playlists-page__wrapper" noSideNavigation={isEmbedPath}>
      <div className="section card-stack">
        <CollectionPageContext.Provider
          value={{
            togglePublicCollection,
          }}
        >
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
