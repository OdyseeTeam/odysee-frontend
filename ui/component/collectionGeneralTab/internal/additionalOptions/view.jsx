// @flow
import React from 'react';
import classnames from 'classnames';

import SUPPORTED_LANGUAGES from 'constants/supported_languages';
import * as PUBLISH from 'constants/publish';

import { FormField } from 'component/common/form';
import { handleBidChange, handleLanguageChange } from 'util/publish';
import { FormContext } from 'component/common/form-components/form';
import { CollectionFormContext } from 'page/collection/internal/collectionPublishForm/context';

import Button from 'component/button';
import Card from 'component/common/card';
import PublishBidTab from 'component/publishBidField';
import TagsSearch from 'component/tagsSearch';

const MAX_TAG_SELECT = 5;

type Props = {
  // -- redux --
  amount: number,
  balance: number,
};

function CollectionPublishAdditionalOptions(props: Props) {
  const {
    // -- redux --
    amount,
    balance,
  } = props;

  const { formParams, updateFormParams } = React.useContext(CollectionFormContext);
  const { formErrors, updateFormErrors } = React.useContext(FormContext);

  const [hideSection, setHideSection] = React.useState(true);
  const [bidError, setBidError] = React.useState('');

  const { languages, tags } = formParams;

  const tagsSet = new Set(tags);
  const languageParam = languages || [];
  const primaryLanguage = Array.isArray(languageParam) && languageParam.length && languageParam[0];
  const secondaryLanguage = Array.isArray(languageParam) && languageParam.length >= 2 && languageParam[1];

  function toggleHideSection() {
    setHideSection(!hideSection);
  }

  return (
    <>
      <h2 className="card__title">{__('Additional Options')}</h2>

      <Card
        className="card--enable-overflow card--publish-section card--additional-options"
        actions={
          <>
            {!hideSection && (
              <div className={classnames({ 'card--disabled': formErrors.name })}>
                <div className="publish-row">
                  <TagsSearch
                    suggestMature
                    disableAutoFocus
                    limitSelect={MAX_TAG_SELECT}
                    tagsPassedIn={tags || []}
                    label={__('Selected Tags')}
                    onRemove={(clickedTag) => {
                      // $FlowFixMe
                      const newTags = tags.slice().filter((tag) => tag.name !== clickedTag.name);
                      updateFormParams({ tags: newTags });
                    }}
                    onSelect={(newTags) =>
                      newTags.forEach((newTag) => {
                        // $FlowFixMe
                        if (!tagsSet.has(newTag.name)) {
                          // $FlowFixMe
                          updateFormParams({ tags: [...tags, newTag] });
                        } else {
                          // If it already exists and the user types it in, remove itit
                          // $FlowFixMe
                          updateFormParams({ tags: Array.from(tagsSet.delete(newTag.name)) });
                        }
                      })
                    }
                  />
                </div>

                <div className="publish-row">
                  <FormField
                    name="language_select"
                    type="select"
                    label={__('Primary Language')}
                    onChange={(event) => handleLanguageChange(0, event.target.value, languageParam, updateFormParams)}
                    value={primaryLanguage}
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
                    onChange={(event) => handleLanguageChange(1, event.target.value, languageParam, updateFormParams)}
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
                </div>

                <div className="publish-row">
                  <PublishBidTab
                    params={formParams}
                    bidError={bidError}
                    onChange={(event) =>
                      handleBidChange(
                        parseFloat(event.target.value),
                        amount,
                        balance,
                        (value) => {
                          updateFormErrors('bid', value);
                          setBidError(value);
                        },
                        updateFormParams
                      )
                    }
                  />
                </div>
              </div>
            )}

            <div className="section__actions">
              <Button label={hideSection ? __('Show') : __('Hide')} button="link" onClick={toggleHideSection} />
            </div>
          </>
        }
      />
    </>
  );
}

export default CollectionPublishAdditionalOptions;
