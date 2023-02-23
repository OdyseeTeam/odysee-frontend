// @flow
import React from 'react';

import * as THUMBNAIL_STATUSES from 'constants/thumbnail_upload_statuses';

import { useHistory } from 'react-router-dom';
import { COLLECTION_PAGE } from 'constants/urlParams';
import { FormField, FormUrlName } from 'component/common/form';
import { FF_MAX_CHARS_IN_DESCRIPTION } from 'constants/form-field';
import { FormContext } from 'component/common/form-components/form';

import ChannelSelector from 'component/channelSelector';
import SelectThumbnail from 'component/selectThumbnail';
import CollectionPublishAdditionalOptions from './internal/additionalOptions';

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
    <>
      {publishing && (
        <>
          <ChannelSelector
            autoSet
            channelToSet={collectionChannelId}
            onChannelSelect={(id) => updateFormParams({ channel_id: id })}
          />

          <FormUrlName
            channelName={collectionChannelName}
            name={name}
            autoFocus={!hasClaim}
            disabled={hasClaim}
            onChange={(e) => updateFormParams({ name: e.target.value || '' })}
          />

          <span className="form-field__help">
            {!hasClaim ? __("This won't be able to be changed in the future.") : __('This field cannot be changed.')}
          </span>
        </>
      )}

      <FormField
        type="text"
        name="collection_title"
        label={__('Title')}
        placeholder={__('My Awesome Playlist')}
        value={title || ''}
        onChange={(e) => updateFormParams({ title: e.target.value || '' })}
      />

      <fieldset-section>
        <SelectThumbnail
          thumbnailParam={thumbnailUrl}
          thumbnailParamError={thumbError}
          thumbnailParamStatus={thumbStatus}
          updateThumbnailParams={handleUpdateThumbnail}
          optional
        />
      </fieldset-section>

      <FormField
        type="markdown"
        name="collection_description"
        label={__('Description')}
        value={(typeof description === 'string' && description) || ''}
        onChange={(value) => updateFormParams({ description: value || '' })}
        textAreaMaxLength={FF_MAX_CHARS_IN_DESCRIPTION}
      />

      {publishing && (
        <fieldset-section>
          <CollectionPublishAdditionalOptions />
        </fieldset-section>
      )}
    </>
  );
}

export default CollectionGeneralTab;
