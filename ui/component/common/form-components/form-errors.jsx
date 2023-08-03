// @flow
import * as React from 'react';

import ErrorText from 'component/common/error-text';

import { FormContext } from 'component/common/form-components/form';

export const FormErrors = () => {
  const { formErrors } = React.useContext(FormContext);

  if (!formErrors) return null;

  // $FlowFixMe
  return Object.values(formErrors).map((error, i) => <ErrorText key={i}>{error}</ErrorText>);
};

export default FormErrors;
