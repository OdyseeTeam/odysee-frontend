// @flow
import * as React from 'react';

import { DOMAIN } from 'config';
import { FormField } from './form-field';
import { INVALID_NAME_ERROR } from 'constants/claim';
import { isNameValid } from 'util/lbryURI';

import { FormContext } from 'component/common/form-components/form';

type Props = {
  channelName?: ?string,
  name: ?string,
};

export const FormUrlName = (props: Props) => {
  const { channelName, name, ...formFieldParams } = props;

  const { updateFormErrors } = React.useContext(FormContext);

  const [nameError, setNameError] = React.useState(undefined);

  React.useEffect(() => {
    let newNameError;

    if (!name && name !== undefined) {
      newNameError = __('A name is required for your url');
    } else if (name && !isNameValid(name)) {
      newNameError = INVALID_NAME_ERROR;
    }

    updateFormErrors('name', newNameError);
    setNameError(newNameError);

    // eslint-disable-next-line react-hooks/exhaustive-deps -- only listen to name
  }, [name]);

  return (
    <fieldset-group class="fieldset-group--smushed fieldset-group--disabled-prefix">
      <fieldset-section>
        <label htmlFor="collection__name">{__('Name')}</label>
        <div className="form-field__prefix">{!channelName ? `${DOMAIN}/` : `${DOMAIN}/${channelName}/`}</div>
      </fieldset-section>

      <FormField
        {...formFieldParams}
        type="text"
        name="collection__name"
        placeholder={__('MyAwesomePlaylist')}
        value={name || ''}
        error={nameError}
      />
    </fieldset-group>
  );
};
