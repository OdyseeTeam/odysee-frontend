// @flow
import React from 'react';
import { getLanguageName } from 'constants/languages';
import { FormField } from 'component/common/form';
import { getDefaultLanguage } from 'util/default-languages';

type Props = {
  homepage: string,
  homepageKeys: Array<string>,
  setHomepage: (string) => void,
};

function SelectHomepage(props: Props) {
  const { homepage, homepageKeys, setHomepage } = props;

  // Don't know why bc3c56b8 resets the code to null when in English.
  const value = homepage === null ? getDefaultLanguage() : homepage;

  function handleSetHomepage(e) {
    const { value } = e.target;
    setHomepage(value);
  }

  if (homepageKeys.length <= 1) {
    return null;
  }

  return (
    <React.Fragment>
      <FormField name="homepage_select" type="select" onChange={handleSetHomepage} value={value}>
        {homepageKeys.map((hp) => (
          <option key={'hp' + hp} value={hp}>
            {getLanguageName(hp)}
          </option>
        ))}
      </FormField>
    </React.Fragment>
  );
}

export default SelectHomepage;
