import React, { useState } from 'react';
import classnames from 'classnames';
// import usePersistedState from 'effects/use-persisted-state';
import { FormField } from 'component/common/form';
import Button from 'component/button';
import PublishReleaseDate from '../publishReleaseDate';
import LicenseType from './license-type';
import Card from 'component/common/card';
import SUPPORTED_LANGUAGES from 'constants/supported_languages';
import { sortLanguageMap } from 'util/default-languages';
import PublishBid from '../publishBid';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectPublishFormValues, selectIsStillEditing } from 'redux/selectors/publish';
import { doUpdatePublishForm } from 'redux/actions/publish';
import { selectUser } from 'redux/selectors/user';
type Props = {
  disabled: boolean;
  showSchedulingOptions?: boolean;
  isLivestream?: boolean;
  defaultExpand?: boolean;
};

function PublishAdditionalOptions(props: Props) {
  const { showSchedulingOptions, disabled, defaultExpand = true } = props;
  const dispatch = useAppDispatch();
  const formValues = useAppSelector((state) => selectPublishFormValues(state));
  const { language, licenseType, otherLicenseDescription, licenseUrl, visibility } = formValues;
  const user = useAppSelector((state) => selectUser(state));
  const isStillEditing = useAppSelector(selectIsStillEditing);
  const updatePublishForm = (value: UpdatePublishState) => dispatch(doUpdatePublishForm(value));
  const showReleaseDate = isStillEditing && !showSchedulingOptions && visibility === 'public';

  return (
    <div className="publish-additional">
      {showReleaseDate && <PublishReleaseDate />}
      <div style={{ marginTop: 'var(--spacing-m)' }}>
        <FormField
          label={__('Language')}
          type="select"
          name="content_language"
          value={language}
          onChange={(event) =>
            updatePublishForm({
              languages: [event.target.value],
            })
          }
        >
          {sortLanguageMap(SUPPORTED_LANGUAGES).map(([langKey, langName]: [string, unknown]) => (
            <option key={langKey} value={langKey}>
              {langName as string}
            </option>
          ))}
        </FormField>
      </div>

      <div style={{ marginTop: 'var(--spacing-m)', marginBottom: 'var(--spacing-m)' }}>
        <LicenseType
          licenseType={licenseType}
          otherLicenseDescription={otherLicenseDescription}
          licenseUrl={licenseUrl}
          handleLicenseChange={(newLicenseType, newLicenseUrl) =>
            updatePublishForm({
              licenseType: newLicenseType,
              licenseUrl: newLicenseUrl,
            })
          }
          handleLicenseDescriptionChange={(event: any) =>
            updatePublishForm({
              otherLicenseDescription: event.target.value,
            })
          }
          handleLicenseUrlChange={(event: any) =>
            updatePublishForm({
              licenseUrl: event.target.value,
            })
          }
        />
      </div>

      <PublishBid />
    </div>
  );
}

export default PublishAdditionalOptions;
