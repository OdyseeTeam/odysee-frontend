// @flow
import * as React from 'react';
import Button from 'component/button';
import { FormContext } from 'component/common/form-components/form';

type Props = {
  label: any,
  disabled: boolean,
};

export const Submit = (props: Props) => {
  const { label = 'Submit', disabled, ...otherProps } = props;

  const { hasFormErrors } = React.useContext(FormContext);

  return (
    <Button
      button="primary"
      type={disabled ? 'button' : 'submit'}
      label={label}
      disabled={disabled || hasFormErrors}
      {...otherProps}
    />
  );
};

export default Submit;
