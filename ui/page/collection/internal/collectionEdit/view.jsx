// @flow
import React from 'react';
import Button from 'component/button';
import TagsSearch from 'component/tagsSearch';
import ErrorText from 'component/common/error-text';
import ClaimAbandonButton from 'component/claimAbandonButton';
import CollectionItemsList from 'component/collectionItemsList';
import Card from 'component/common/card';
import { useHistory } from 'react-router-dom';
import { isNameValid } from 'util/lbryURI';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'component/common/tabs';
import { FormField } from 'component/common/form';
import { handleBidChange, handleLanguageChange } from 'util/publish';
import { INVALID_NAME_ERROR } from 'constants/claim';
import SUPPORTED_LANGUAGES from 'constants/supported_languages';
import * as PAGES from 'constants/pages';
import * as PUBLISH from 'constants/publish';
import analytics from 'analytics';
import CollectionGeneralTab from './internal/collectionGeneralTab';
import PublishBidTab from 'component/publishBidField';

export const PAGE_TAB_QUERY = `tab`;
const MAX_TAG_SELECT = 5;

const PAGE = {
  GENERAL: 'general',
  ITEMS: 'items',
  CREDITS: 'credits',
  TAGS: 'tags',
  OTHER: 'other',
};

type Props = {
  uri: string, // collection uri
  collectionId: string,
  // -- redux -
  hasClaim: boolean,
  balance: number,
  amount: number,
  collectionParams: CollectionPublishParams,
  collectionClaimIds: Array<string>,
  updatingCollection: boolean,
  updateError: string,
  createError: string,
  creatingCollection: boolean,
  doCollectionPublishUpdate: (CollectionUpdateParams) => Promise<any>,
  doCollectionPublish: (CollectionPublishParams, string) => Promise<any>,
  doClearCollectionErrors: () => void,
  onDone: (string) => void,
};

function CollectionForm(props: Props) {
  const {
    uri,
    collectionId,
    // -- redux -
    hasClaim,
    balance,
    amount,
    collectionParams,
    collectionClaimIds,
    updatingCollection,
    updateError,
    createError,
    creatingCollection,
    doCollectionPublishUpdate,
    doCollectionPublish,
    doClearCollectionErrors,
    onDone,
  } = props;

  const {
    replace,
    push,
    location: { pathname, search },
  } = useHistory();

  const [nameError, setNameError] = React.useState(undefined);
  const [thumbailError, setThumbnailError] = React.useState('');
  const [bidError, setBidError] = React.useState('');
  const [params, setParams] = React.useState({});
  const [loading, setLoading] = React.useState(false);

  const { name, languages, claims, tags } = params;

  const urlParams = new URLSearchParams(search);
  const currentView = urlParams.get(PAGE_TAB_QUERY) || PAGE.GENERAL;
  const isNewCollection = !uri;
  const languageParam = languages || [];
  const primaryLanguage = Array.isArray(languageParam) && languageParam.length && languageParam[0];
  const secondaryLanguage = Array.isArray(languageParam) && languageParam.length >= 2 && languageParam[1];
  const hasClaims = claims && claims.length;
  const collectionClaimIdsString = JSON.stringify(collectionClaimIds);
  const itemError = !hasClaims ? __('Cannot publish empty list') : '';
  const submitError = nameError || bidError || itemError || updateError || createError || thumbailError;

  function updateParams(newParams) {
    // $FlowFixMe
    setParams({ ...params, ...newParams });
  }

  function handleSubmit() {
    if (uri) {
      doCollectionPublishUpdate(params).then((pendingClaim) => {
        if (pendingClaim) {
          const claimId = pendingClaim.claim_id;
          analytics.apiLogPublish(pendingClaim);
          onDone(claimId);
        }
      });
    } else {
      // $FlowFixMe
      doCollectionPublish(params, collectionId).then((pendingClaim) => {
        if (pendingClaim) {
          const claimId = pendingClaim.claim_id;
          analytics.apiLogPublish(pendingClaim);
          onDone(claimId);
        }
      });
    }
  }

  React.useEffect(() => {
    const collectionClaimIds = JSON.parse(collectionClaimIdsString);
    // $FlowFixMe
    updateParams({ claims: collectionClaimIds });
    doClearCollectionErrors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionClaimIdsString, setParams]);

  React.useEffect(() => {
    let nameError;
    if (!name && name !== undefined) {
      nameError = __('A name is required for your url');
    } else if (!isNameValid(name)) {
      nameError = INVALID_NAME_ERROR;
    }

    setNameError(nameError);
  }, [name]);

  // setup initial params after we're sure if it's published or not
  React.useEffect(() => {
    if (!uri || (uri && hasClaim)) {
      updateParams(collectionParams);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uri, hasClaim]);

  function onTabChange(newTabIndex) {
    let search = '&';

    if (newTabIndex === 0) {
      search += `${PAGE_TAB_QUERY}=${PAGE.GENERAL}`;
    } else if (newTabIndex === 1) {
      search += `${PAGE_TAB_QUERY}=${PAGE.ITEMS}`;
    } else if (newTabIndex === 2) {
      search += `${PAGE_TAB_QUERY}=${PAGE.CREDITS}`;
    } else if (newTabIndex === 3) {
      search += `${PAGE_TAB_QUERY}=${PAGE.TAGS}`;
    } else {
      search += `${PAGE_TAB_QUERY}=${PAGE.OTHER}`;
    }

    push(`${pathname}?view=edit${search}`);
  }

  let tabIndex;
  switch (currentView) {
    case PAGE.GENERAL:
      tabIndex = 0;
      break;
    case PAGE.ITEMS:
      tabIndex = 1;
      break;
    case PAGE.CREDITS:
      tabIndex = 2;
      break;
    case PAGE.TAGS:
      tabIndex = 3;
      break;
    case PAGE.OTHER:
      tabIndex = 4;
      break;
    default:
      tabIndex = 0;
      break;
  }

  return (
    <div className="main--contained publishList-wrapper">
      <Tabs onChange={onTabChange} index={tabIndex}>
        <TabList className="tabs__list--collection-edit-page">
          <Tab>{__('General')}</Tab>
          <Tab>{__('Items')}</Tab>
          <Tab>{__('Credits')}</Tab>
          <Tab>{__('Tags')}</Tab>
          <Tab>{__('Other')}</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            {currentView === PAGE.GENERAL && (
              <CollectionGeneralTab
                uri={uri}
                params={params}
                nameError={nameError}
                setThumbnailError={setThumbnailError}
                updateParams={updateParams}
                setLoading={setLoading}
              />
            )}
          </TabPanel>

          <TabPanel>
            {currentView === PAGE.ITEMS && (
              <CollectionItemsList collectionId={collectionId} empty={__('This playlist has no items.')} showEdit />
            )}
          </TabPanel>

          <TabPanel>
            {currentView === PAGE.CREDITS && (
              <PublishBidTab
                params={params}
                bidError={bidError}
                onChange={(event) =>
                  handleBidChange(parseFloat(event.target.value), amount, balance, setBidError, updateParams)
                }
              />
            )}
          </TabPanel>

          <TabPanel>
            {currentView === PAGE.TAGS && (
              <Card
                body={
                  <TagsSearch
                    suggestMature
                    disableAutoFocus
                    limitSelect={MAX_TAG_SELECT}
                    tagsPassedIn={tags || []}
                    label={__('Selected Tags')}
                    onRemove={(clickedTag) => {
                      // $FlowFixMe
                      const newTags = tags.slice().filter((tag) => tag.name !== clickedTag.name);
                      updateParams({ tags: newTags });
                    }}
                    onSelect={(newTags) => {
                      tags &&
                        newTags.forEach((newTag) => {
                          // $FlowFixMe
                          if (!tags.map((savedTag) => savedTag.name).includes(newTag.name)) {
                            // $FlowFixMe
                            updateParams({ tags: [...tags, newTag] });
                          } else {
                            // If it already exists and the user types it in, remove itit
                            // $FlowFixMe
                            updateParams({ tags: tags.filter((tag) => tag.name !== newTag.name) });
                          }
                        });
                    }}
                  />
                }
              />
            )}
          </TabPanel>

          <TabPanel>
            {currentView === PAGE.OTHER && (
              <Card
                body={
                  <>
                    <FormField
                      name="language_select"
                      type="select"
                      label={__('Primary Language')}
                      onChange={(event) =>
                        handleLanguageChange(0, event.target.value, languageParam, setParams, params)
                      }
                      value={primaryLanguage}
                      helper={__('Your main content language')}
                    >
                      <option key={'pri-langNone'} value={PUBLISH.LANG_NONE}>
                        {__('None selected')}
                      </option>
                      {Object.keys(SUPPORTED_LANGUAGES).map((language) => (
                        <option key={language} value={language}>
                          {SUPPORTED_LANGUAGES[language]}
                        </option>
                      ))}
                    </FormField>
                    <FormField
                      name="language_select2"
                      type="select"
                      label={__('Secondary Language')}
                      onChange={(event) =>
                        handleLanguageChange(1, event.target.value, languageParam, setParams, params)
                      }
                      value={secondaryLanguage}
                      disabled={!languageParam[0]}
                      helper={__('Your other content language')}
                    >
                      <option key={'sec-langNone'} value={PUBLISH.LANG_NONE}>
                        {__('None selected')}
                      </option>
                      {Object.keys(SUPPORTED_LANGUAGES)
                        .filter((lang) => lang !== languageParam[0])
                        .map((language) => (
                          <option key={language} value={language}>
                            {SUPPORTED_LANGUAGES[language]}
                          </option>
                        ))}
                    </FormField>
                  </>
                }
              />
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>

      {!loading && (
        <Card
          className="card--after-tabs"
          actions={
            <>
              <div className="section__actions">
                <Button
                  button="primary"
                  disabled={creatingCollection || updatingCollection || Boolean(submitError) || !hasClaims}
                  label={creatingCollection || updatingCollection ? __('Submitting') : __('Submit')}
                  onClick={handleSubmit}
                />
                <Button button="link" label={__('Cancel')} onClick={() => onDone(collectionId)} />
              </div>

              {submitError ? (
                <ErrorText>{submitError}</ErrorText>
              ) : (
                <p className="help">
                  {__('After submitting, it will take a few minutes for your changes to be live for everyone.')}
                </p>
              )}

              {!isNewCollection && (
                <div className="section__actions">
                  <ClaimAbandonButton uri={uri} abandonActionCallback={() => replace(`/$/${PAGES.LIBRARY}`)} />
                </div>
              )}
            </>
          }
        />
      )}
    </div>
  );
}

export default CollectionForm;
