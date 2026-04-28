import React from 'react';
import analytics from 'analytics';
import classnames from 'classnames';
import * as MODALS from 'constants/modal_types';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import { useLocation, useNavigate } from 'react-router-dom';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'component/common/tabs';
import { Form, Submit, FormErrors } from 'component/common/form';
import { COLLECTION_PAGE } from 'constants/urlParams';
import Button from 'component/button';
// import CollectionDeleteButton from 'component/collectionDeleteButton';
import SortButton from '../../internal/collectionActions/internal/sortButton';
import CollectionItemsList from 'component/collectionItemsList';
import Spinner from 'component/spinner';
import BusyIndicator from 'component/common/busy-indicator';
import Tooltip from 'component/common/tooltip';
import CollectionGeneralTab from './internal/collectionGeneralTab';
import withCollectionItems from 'hocs/withCollectionItems';
import ErrorBubble from 'component/common/error-bubble';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import {
  selectHasClaimForId,
  selectClaimBidAmountForId,
  selectClaimIsPendingForId,
  selectClaimUriForId,
} from 'redux/selectors/claims';
import { selectBalance } from 'redux/selectors/wallet';
import { selectCollectionClaimUploadParamsForId } from 'redux/selectors/publish';
import {
  selectCollectionForId,
  selectCollectionHasEditsForId,
  selectHasUnavailableClaimIdsForCollectionId,
  selectCollectionHasUnsavedEditsForId,
} from 'redux/selectors/collections';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import {
  doCollectionPublish,
  doCollectionEdit,
  doClearEditsForCollectionId,
  doRemoveFromUnsavedChangesCollectionsForCollectionId,
} from 'redux/actions/collections';
import { doOpenModal } from 'redux/actions/app';
import './style.scss';
export const PAGE_TAB_QUERY = `tab`;
const TAB = {
  GENERAL: 0,
  ITEMS: 1,
};

function getTabIndexFromSearch(search: string) {
  const urlParams = new URLSearchParams(search);
  return urlParams.get(COLLECTION_PAGE.QUERIES.TAB) === COLLECTION_PAGE.TABS.ITEMS ? TAB.ITEMS : TAB.GENERAL;
}

type Props = {
  collectionId: string;
  onDoneForId?: (arg0: any) => any;
  useIds?: boolean;
};
export const CollectionFormContext = React.createContext<any>(undefined);

const CollectionPublishForm = (props: Props) => {
  const { collectionId, onDoneForId } = props;
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { search } = useLocation();
  const hasClaim = useAppSelector((state) => selectHasClaimForId(state, collectionId));
  const collectionParams = useAppSelector((state) => selectCollectionClaimUploadParamsForId(state, collectionId));
  const isClaimPending = useAppSelector((state) => selectClaimIsPendingForId(state, collectionId));
  const activeChannelClaim = useAppSelector(selectActiveChannelClaim);
  const collectionHasEdits = useAppSelector((state) => selectCollectionHasEditsForId(state, collectionId));
  const collectionHasUnSavedEdits = useAppSelector((state) =>
    selectCollectionHasUnsavedEditsForId(state, collectionId)
  );
  const currentCollection = useAppSelector((state) => selectCollectionForId(state, collectionId));
  const hasUnavailableClaims = useAppSelector((state) =>
    selectHasUnavailableClaimIdsForCollectionId(state, collectionId)
  );
  const effectiveSearch = search || (typeof window !== 'undefined' && window.location ? window.location.search : '');
  const urlParams = new URLSearchParams(effectiveSearch);
  const editing = urlParams.get(COLLECTION_PAGE.QUERIES.VIEW) === COLLECTION_PAGE.VIEWS.EDIT;
  const publishing = urlParams.get(COLLECTION_PAGE.QUERIES.VIEW) === COLLECTION_PAGE.VIEWS.PUBLISH;
  const tabIndexFromUrl = getTabIndexFromSearch(effectiveSearch);
  const [thumbailError, setThumbnailError] = React.useState<string | undefined>();
  const initialParams = React.useRef(collectionParams);
  const collectionResetPending = React.useRef(false);
  const [formParams, setFormParams] = React.useState(collectionParams);
  const [optimisticTabIndex, setOptimisticTabIndex] = React.useState<number | null>(null);
  const [showItemsSpinner, setShowItemsSpinner] = React.useState(false);
  const [publishPending, setPublishPending] = React.useState(isClaimPending);
  const tabIndex = optimisticTabIndex ?? tabIndexFromUrl;
  const { claims } = formParams;
  const hasClaims = claims && claims.length;
  const itemError = publishing && !hasClaims ? __('Cannot publish empty list') : undefined;
  const hasChanges =
    (publishing && !hasClaim) ||
    collectionHasEdits ||
    collectionHasUnSavedEdits ||
    JSON.stringify(initialParams.current) !== JSON.stringify(formParams);
  const publishingClaimWithNoChanges = publishing && hasClaim && !collectionHasEdits && !hasChanges;

  function navigateToCollectionView() {
    if (onDoneForId) {
      onDoneForId(collectionId);
    } else {
      const target = `/$/${PAGES.PLAYLIST}/${collectionId}`;
      navigate(target, { replace: true });
    }
  }

  function updateFormParams(newParams: {}) {
    setFormParams((prevParams) => ({ ...prevParams, ...newParams }));
  }

  const syncTabToUrl = React.useCallback(
    (nextTabIndex: number) => {
      const nextParams = new URLSearchParams(effectiveSearch);

      if (nextTabIndex === TAB.ITEMS) {
        nextParams.set(COLLECTION_PAGE.QUERIES.TAB, COLLECTION_PAGE.TABS.ITEMS);
      } else {
        nextParams.delete(COLLECTION_PAGE.QUERIES.TAB);
      }

      navigate(`?${nextParams.toString()}`, { replace: true });
    },
    [effectiveSearch, navigate]
  );

  function handlePublish(params) {
    setPublishPending(true);

    const successCb = (pendingClaim) => {
      setPublishPending(false);

      if (pendingClaim) {
        const claimId = pendingClaim.claim_id;
        analytics.apiLog.publish(pendingClaim);
        onDoneForId(claimId);
      }
    };

    dispatch(doCollectionPublish(params, collectionId))
      .then(successCb)
      .catch(() => setPublishPending(false));
  }

  function handleSubmitForm() {
    if (!hasChanges) return navigateToCollectionView();
    const trimmedParams = { ...formParams };
    if (trimmedParams.title) trimmedParams.title = trimmedParams.title.trim();
    if (currentCollection?.items) {
      trimmedParams.claims = currentCollection.items.filter((item) => typeof item === 'string');
    }
    setFormParams(trimmedParams);

    if (editing) {
      dispatch(doCollectionEdit(collectionId, trimmedParams));
      dispatch(doRemoveFromUnsavedChangesCollectionsForCollectionId(collectionId));
      navigateToCollectionView();
      return;
    }

    if (hasUnavailableClaims) {
      dispatch(
        doOpenModal(MODALS.CONFIRM, {
          title: __('Confirm Publish'),
          subtitle: __(
            'You are about to publish this playlist with unavailable items that will be removed (all other items will be unaffected). This action is permanent and cannot be undone.'
          ),
          onConfirm: (closeModal) => {
            handlePublish(trimmedParams);
            closeModal();
          },
        })
      );
    } else {
      handlePublish(trimmedParams);
    }
  }

  function handleCancelButton() {
    dispatch(doRemoveFromUnsavedChangesCollectionsForCollectionId(collectionId));
    navigateToCollectionView();
  }

  function handleClearUpdates() {
    collectionResetPending.current = true;
    dispatch(doClearEditsForCollectionId(collectionId));
    navigateToCollectionView();
  }

  function onTabChange(newTabIndex) {
    if (tabIndex !== newTabIndex) {
      setOptimisticTabIndex(newTabIndex);
      syncTabToUrl(newTabIndex);
      setShowItemsSpinner(false);
    }
  }

  React.useEffect(() => {
    if (optimisticTabIndex !== null && optimisticTabIndex === tabIndexFromUrl) {
      setOptimisticTabIndex(null);
    }
  }, [optimisticTabIndex, tabIndexFromUrl]);

  // Reset the form to original collection state if the edits are cleared
  React.useEffect(() => {
    if (collectionParams && collectionResetPending.current) {
      setFormParams(collectionParams);
      initialParams.current = collectionParams;
      collectionResetPending.current = false;
    } else if (collectionParams) {
      // Keep claims in formParams up to date
      updateFormParams({
        claims: collectionParams.claims,
      });
    }
  }, [collectionParams]);

  if (publishing && activeChannelClaim === undefined) {
    return (
      <div className="main--empty">
        <Spinner />
      </div>
    );
  }

  return (
    <Form
      className="main--contained collection-publish-form__wrapper"
      onSubmit={handleSubmitForm}
      errors={{
        ...(itemError
          ? {
              items: itemError,
            }
          : {}),
        ...(thumbailError
          ? {
              thumbnail: thumbailError,
            }
          : {}),
      }}
      disableSubmitOnEnter
    >
      <CollectionFormContext.Provider
        value={{
          collectionId,
          formParams,
          updateFormParams,
        }}
      >
        <Tabs onChange={onTabChange} index={tabIndex}>
          <TabList className="tabs__list--collection-edit-page">
            <Tab>{__('General')}</Tab>
            <Tab>
              {__('Items')}
              {showItemsSpinner && <Spinner type="small" />}
            </Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              {tabIndex === TAB.GENERAL && (
                <CollectionGeneralTab
                  collectionId={collectionId}
                  formParams={formParams}
                  setThumbnailError={setThumbnailError}
                  updateFormParams={updateFormParams}
                />
              )}
            </TabPanel>

            <TabPanel>
              {tabIndex === TAB.ITEMS && (
                <>
                  <div className={classnames('collection-actions')}>
                    <SortButton collectionId={collectionId} />
                  </div>
                  <CollectionItemsList
                    collectionId={collectionId}
                    {...({ empty: __('This playlist has no items.'), showEdit: true, isEditPreview: true } as any)}
                  />
                </>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>

        {hasUnavailableClaims && publishing && (
          <ErrorBubble>
            {__(
              'This playlist has unavailable items and they will not be published. Make sure you want to continue before uploading.'
            )}
          </ErrorBubble>
        )}

        <div className="section__actions">
          <Submit
            {...({
              button: 'primary',
              disabled: publishingClaimWithNoChanges || publishPending,
              label: publishPending ? <BusyIndicator message={__('Submitting')} /> : __(editing ? 'Save' : 'Submit'),
            } as any)}
          />
          <Button button="link" label={__('Cancel')} onClick={handleCancelButton} />

          {collectionHasEdits && (
            <Tooltip title={__('Delete all edits from this published playlist')}>
              <Button button="alt" icon={ICONS.REFRESH} label={__('Clear Updates')} onClick={handleClearUpdates} />
            </Tooltip>
          )}
        </div>

        <FormErrors />

        <p className="help">
          {publishing
            ? __('After submitting, it will take a few minutes for your changes to be live for everyone.')
            : __('After saving, all changes will remain private')}
        </p>
      </CollectionFormContext.Provider>
    </Form>
  );
};

export default withCollectionItems(CollectionPublishForm);
