// @flow
import * as React from 'react';

type Props = {
  children: React.Node,
  errors?: ?{},
  onSubmit: (any) => any,
};

export const FormContext = React.createContext<any>();

export const Form = (props: Props) => {
  const { children, errors, onSubmit, ...otherProps } = props;

  const [formErrors, setFormErrors] = React.useState(errors);

  const hasFormErrors = formErrors && Object.values(formErrors).length > 0;

  function updateFormErrors(errorKey, newError) {
    setFormErrors((prevErrors) => {
      const newErrors = Object.assign({}, prevErrors);

      if (newError) {
        newErrors[errorKey] = newError;
      } else {
        delete newErrors[errorKey];
      }

      return newErrors;
    });
  }

  return (
    <form
      noValidate
      className="form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(event);
      }}
      {...otherProps}
    >
      <FormContext.Provider value={{ formErrors, hasFormErrors, updateFormErrors }}>{children}</FormContext.Provider>
    </form>
  );
};

export default Form;
