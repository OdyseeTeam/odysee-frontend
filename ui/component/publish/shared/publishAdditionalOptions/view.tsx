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
import { selectPublishFormValues } from 'redux/selectors/publish';
import { doUpdatePublishForm } from 'redux/actions/publish';
import { selectUser } from 'redux/selectors/user';
// @if TARGET='app'
// import ErrorText from 'component/common/error-text';
// import { LbryFirst } from 'lbry-redux';
// import { ipcRenderer } from 'electron';
// @endif
type Props = {
  disabled: boolean;
  showSchedulingOptions: boolean;
  isLivestream?: boolean;
};

function PublishAdditionalOptions(props: Props) {
  const { showSchedulingOptions, disabled } = props;
  const dispatch = useAppDispatch();
  const formValues = useAppSelector((state) => selectPublishFormValues(state));
  const { language, name, licenseType, otherLicenseDescription, licenseUrl, visibility } = formValues;
  const user = useAppSelector((state) => selectUser(state));
  const updatePublishForm = (value: UpdatePublishState) => dispatch(doUpdatePublishForm(value));
  const [hideSection, setHideSection] = useState(disabled);
  const showReleaseDate = !showSchedulingOptions && visibility === 'public';

  function toggleHideSection() {
    setHideSection(!hideSection);
  }

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
                <div
                  className={classnames({
                    'card--disabled': !name,
                  })}
                >
                  <div className="section">
                    {showReleaseDate && <PublishReleaseDate />}
                    <FormField
                      className={!showReleaseDate && 'publish-row--no-margin-select'}
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
                      handleLicenseUrlChange={(event) =>
                        updatePublishForm({
                          licenseUrl: event.target.value,
                        })
                      }
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
