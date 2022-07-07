// @flow
import { DOMAIN } from 'config';
import * as THUMBNAIL_STATUSES from 'constants/thumbnail_upload_statuses';
import React from 'react';
import ChannelSelector from 'component/channelSelector';
import Card from 'component/common/card';
import SelectThumbnail from 'component/selectThumbnail';
import { FormField } from 'component/common/form';
import { FF_MAX_CHARS_IN_DESCRIPTION } from 'constants/form-field';
import Spinner from 'component/spinner';

type Props = {
  uri: string,
  params: CollectionPublishParams,
  nameError: any,
  setThumbnailError: (error: ?string) => void,
  updateParams: (obj: any) => void,
  setLoading: (loading: boolean) => void,
  // -- redux --
  collectionChannel: ?ChannelClaim,
  activeChannelClaim: ?ChannelClaim,
};

function CollectionGeneralTab(props: Props) {
  const {
    uri,
    params,
    nameError,
    setThumbnailError,
    updateParams,
    setLoading,
    // -- redux --
    collectionChannel,
    activeChannelClaim,
  } = props;

  const { name, title, thumbnail_url: thumbnailUrl, description } = params;

  const [thumbStatus, setThumbStatus] = React.useState();
  const [thumbError, setThumbError] = React.useState();

  const { name: activeChannelName, claim_id: activeChannelId } = activeChannelClaim || {};
  const isNewCollection = !uri;

  function handleUpdateThumbnail(update: { [string]: string }) {
    const { thumbnail_url: url, thumbnail_status: status, thumbnail_error: error } = update;

    if (url?.length >= 0) {
      updateParams(url.length === 0 ? { thumbnail_url: undefined } : update);
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
  }, [setThumbnailError, thumbError, thumbStatus]);

  React.useEffect(() => {
    if (setLoading) setLoading(!activeChannelClaim);
  }, [activeChannelClaim, setLoading]);

  if (!activeChannelClaim) {
    return (
      <div className="main--empty">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="card-stack">
      <ChannelSelector
        autoSet
        channelToSet={collectionChannel || activeChannelId}
        onChannelSelect={(id) => updateParams({ channel_id: id })}
      />

      <Card
        body={
          <>
            <fieldset-group class="fieldset-group--smushed fieldset-group--disabled-prefix">
              <fieldset-section>
                <label htmlFor="collection_name">{__('Name')}</label>
                <div className="form-field__prefix">{`${DOMAIN}/${activeChannelName}/`}</div>
              </fieldset-section>

              <FormField
                autoFocus={isNewCollection}
                type="text"
                name="collection_name"
                placeholder={__('MyAwesomeList')}
                value={name || ''}
                error={nameError}
                disabled={!isNewCollection}
                onChange={(e) => updateParams({ name: e.target.value || '' })}
              />
            </fieldset-group>

            <span className="form-field__help">
              {isNewCollection
                ? __("This won't be able to be changed in the future.")
                : __('This field cannot be changed.')}
            </span>

            <FormField
              type="text"
              name="collection_title"
              label={__('Title')}
              placeholder={__('My Awesome Playlist')}
              value={title || ''}
              onChange={(e) => updateParams({ title: e.target.value || '' })}
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
              value={description || ''}
              onChange={(text) => updateParams({ description: text || '' })}
              textAreaMaxLength={FF_MAX_CHARS_IN_DESCRIPTION}
            />
          </>
        }
      />
    </div>
  );
}

export default CollectionGeneralTab;
