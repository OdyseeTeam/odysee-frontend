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

  const { languages } = formParams;

  const languageParam = languages || [];
  const primaryLanguage = Array.isArray(languageParam) && languageParam.length && languageParam[0];
  const secondaryLanguage = Array.isArray(languageParam) && languageParam.length >= 2 && languageParam[1];

  function toggleHideSection() {
    setHideSection(!hideSection);
  }

  React.useEffect(() => {
    handleBidChange(
      parseFloat(formParams.bid),
      amount,
      balance,
      (value) => {
        setBidError(value);
        updateFormErrors('bid', value);
      },
      updateFormParams
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, balance]);

  return (
    <>
      <Card
        background
        className="card--enable-overflow"
        title={__('Additional Options')}
        body={
          <>
            {!hideSection && (
              <div className={classnames({ 'card--disabled': formErrors.name })}>
                <div className="publish-row publish-row--no-margin-select">
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

            <div className="publish-row">
              <div className="section__actions">
                <Button label={hideSection ? __('Show') : __('Hide')} button="link" onClick={toggleHideSection} />
              </div>
            </div>
          </>
        }
      />
    </>
  );
}

export default CollectionPublishAdditionalOptions;
