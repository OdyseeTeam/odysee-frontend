// @flow
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

// @if TARGET='app'
// import ErrorText from 'component/common/error-text';
// import { LbryFirst } from 'lbry-redux';
// import { ipcRenderer } from 'electron';
// @endif

type Props = {
  user: ?User,
  language: ?string,
  name: ?string,
  licenseType: ?string,
  otherLicenseDescription: ?string,
  licenseUrl: ?string,
  disabled: boolean,
  updatePublishForm: ({}) => void,
  useLBRYUploader: boolean,
  needsYTAuth: boolean,
  showSchedulingOptions: boolean,
  isLivestream?: Boolean,
};

function PublishAdditionalOptions(props: Props) {
  const {
    language,
    name,
    licenseType,
    otherLicenseDescription,
    licenseUrl,
    updatePublishForm,
    showSchedulingOptions,
    disabled,
  } = props;
  const [hideSection, setHideSection] = useState(disabled);

  function toggleHideSection() {
    setHideSection(!hideSection);
  }

  React.useEffect(() => {
    if (licenseType === 'copyright') {
      updatePublishForm({
        otherLicenseDescription: 'All rights reserved',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- @see TODO_NEED_VERIFICATION
  }, [licenseType]);

  return (
    <>
      <Card
        background
        className="card--enable-overflow"
        title={__('Additional Options')}
        body={
          <React.Fragment>
            {!hideSection && !disabled && (
              <div className="settings-row">
                <div className={classnames({ 'card--disabled': !name })}>
                  <div className="section">
                    {!showSchedulingOptions && <PublishReleaseDate />}
                    <FormField
                      className={showSchedulingOptions && 'publish-row--no-margin-select'}
                      label={__('Language')}
                      type="select"
                      name="content_language"
                      value={language}
                      onChange={(event) => updatePublishForm({ languages: [event.target.value] })}
                    >
                      {sortLanguageMap(SUPPORTED_LANGUAGES).map(([langKey, langName]) => (
                        <option key={langKey} value={langKey}>
                          {langName}
                        </option>
                      ))}
                    </FormField>

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
                      handleLicenseDescriptionChange={(event) =>
                        updatePublishForm({
                          otherLicenseDescription: event.target.value,
                        })
                      }
                      handleLicenseUrlChange={(event) => updatePublishForm({ licenseUrl: event.target.value })}
                    />
                  </div>
                </div>
                <PublishBid />
              </div>
            )}

            <div className="publish-row publish-row--more">
              <Button label={hideSection ? __('Show') : __('Hide')} button="link" onClick={toggleHideSection} />
            </div>
          </React.Fragment>
        }
      />
    </>
  );
}

export default PublishAdditionalOptions;
