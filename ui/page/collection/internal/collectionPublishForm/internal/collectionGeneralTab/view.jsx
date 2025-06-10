// @flow
import React from 'react';
import { useHistory } from 'react-router-dom';

import { FF_MAX_CHARS_IN_DESCRIPTION } from 'constants/form-field';
import * as THUMBNAIL_STATUSES from 'constants/thumbnail_upload_statuses';
import * as TAGS from 'constants/tags';
import { COLLECTION_PAGE } from 'constants/urlParams';

import { FormField, FormUrlName } from 'component/common/form';
import { FormContext } from 'component/common/form-components/form';
import TagsSelect from 'component/tagsSelect';
import Card from 'component/common/card';
import ChannelSelector from 'component/channelSelector';
import CollectionPublishAdditionalOptions from './internal/additionalOptions';

import { lazyImport } from 'util/lazyImport';

import './style.scss';

const SelectThumbnail = lazyImport(() => import('component/selectThumbnail' /* webpackChunkName: "selectThumbnail" */));
const TAGS_LIMIT = 5;

type Props = {
  formParams: any,
  setThumbnailError: (error: ?string) => void,
  updateFormParams: (obj: any) => void,
  // -- redux --
  hasClaim: boolean,
  collectionChannelName: ?string,
};

function CollectionGeneralTab(props: Props) {
  const {
    formParams,
    setThumbnailError,
    updateFormParams,
    // -- redux --
    hasClaim,
    collectionChannelName,
  } = props;

  const { updateFormErrors } = React.useContext(FormContext);

  const {
    location: { search },
  } = useHistory();
  const { tags } = formParams;

  const urlParams = new URLSearchParams(search);
  const publishing = urlParams.get(COLLECTION_PAGE.QUERIES.VIEW) === COLLECTION_PAGE.VIEWS.PUBLISH;

  const { channel_id: collectionChannelId, name, title, description, thumbnail_url: thumbnailUrl } = formParams;

  const [thumbStatus, setThumbStatus] = React.useState();
  const [thumbError, setThumbError] = React.useState();

  function handleUpdateThumbnail(update: { [string]: string }) {
    const { thumbnail_url: url, thumbnail_status: status, thumbnail_error: error } = update;

    if (url?.length >= 0) {
      const newParams = url.length === 0 ? { thumbnail_url: undefined } : update;
      updateFormParams(!publishing ? { thumbnail_url: newParams.thumbnail_url } : newParams);
      setThumbStatus(undefined);
      setThumbError(undefined);
    } else {
      if (status) {
        setThumbStatus(status);
      } else {
        setThumbError(error);
      }
    }
  }

  React.useEffect(() => {
    const thumbnailError =
      thumbError && thumbStatus !== THUMBNAIL_STATUSES.COMPLETE
        ? __('Invalid thumbnail')
        : thumbStatus === THUMBNAIL_STATUSES.IN_PROGRESS
        ? __('Please wait for thumbnail to finish uploading')
        : undefined;

    setThumbnailError(thumbnailError);
    updateFormErrors('thumbnail', thumbnailError);

    // eslint-disable-next-line react-hooks/exhaustive-deps -- ignore updateFormErrors
  }, [setThumbnailError, thumbError, thumbStatus]);

  return (
    <div className="card card--background collection-edit__wrapper">
      {publishing && (
        <>
          <ChannelSelector
            autoSet
            channelToSet={collectionChannelId}
            onChannelSelect={(id) => updateFormParams({ channel_id: id })}
          />

          <div className="collection__name-wrapper">
            <h2>{__('Name')}</h2>
            <div className="collection__name">
              <FormUrlName
                channelName={collectionChannelName}
                name={name}
                autoFocus={!hasClaim}
                disabled={hasClaim}
                onChange={(e) => updateFormParams({ name: e.target.value || '' })}
              />

              <span className="form-field__help">
                {!hasClaim
                  ? __("This won't be able to be changed in the future.")
                  : __('This field cannot be changed.')}
              </span>
            </div>
          </div>
        </>
      )}

      <div className="collection__title">
        <h2>{__('Title')}</h2>
        <FormField
          type="text"
          name="collection_title"
          placeholder={__('My Awesome Playlist')}
          value={title || ''}
          onChange={(e) => updateFormParams({ title: e.target.value || '' })}
        />
      </div>

      <fieldset-section>
        <SelectThumbnail
          thumbnailParam={thumbnailUrl}
          thumbnailParamError={thumbError}
          thumbnailParamStatus={thumbStatus}
          updateThumbnailParams={handleUpdateThumbnail}
          optional
        />
      </fieldset-section>

      <h2>{__('Description')}</h2>
      <FormField
        type="markdown"
        name="collection_description"
        value={(typeof description === 'string' && description) || ''}
        onChange={(value) => updateFormParams({ description: value || '' })}
        textAreaMaxLength={FF_MAX_CHARS_IN_DESCRIPTION}
      />

      <h2 className="card__title" style={{ marginTop: 'var(--spacing-l)' }}>
        {__('Tags')}
      </h2>
      <Card
        background
        body={
          <div className="publish-row">
            <TagsSelect
              disableAutoFocus
              hideHeader
              label={__('Selected Tags')}
              empty={__('No tags added')}
              limitSelect={TAGS_LIMIT}
              help={__(
                "Add tags that are relevant to your content so those who're looking for it can find it more easily."
              )}
              excludedControlTags={[TAGS.AGE_RESTRICED_CHANNEL_IMAGES_TAG]}
              placeholder={__('gaming, crypto')}
              onSelect={(newTags) => {
                const validatedTags = [];
                newTags.forEach((newTag) => {
                  if (!tags.some((tag) => tag.name === newTag.name)) {
                    validatedTags.push(newTag);
                  }
                });
                updateFormParams({ tags: [...tags, ...validatedTags] });
              }}
              onRemove={(clickedTag) => {
                const newTags = tags.slice().filter((tag) => tag.name !== clickedTag.name);
                updateFormParams({ tags: newTags });
              }}
              tagsChosen={tags}
            />
          </div>
        }
      />

      {publishing && (
        <fieldset-section>
          <CollectionPublishAdditionalOptions />
        </fieldset-section>
      )}
    </div>
  );
}

export default CollectionGeneralTab;
