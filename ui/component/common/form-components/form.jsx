// @flow
import * as React from 'react';
import * as KEYCODES from 'constants/keycodes';

type Props = {
  children: React.Node,
  errors?: ?{},
  disableSubmitOnEnter?: boolean,
  onSubmit: (any) => any,
};

export const FormContext = React.createContext<any>();

export const Form = (props: Props) => {
  const { children, errors, disableSubmitOnEnter, onSubmit, ...otherProps } = props;

  const pressedEnter = React.useRef(false);

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
      onMouseDown={() => (pressedEnter.current = false)}
      onKeyDown={(event) => (pressedEnter.current = event.keyCode === KEYCODES.ENTER)}
      onSubmit={(event) => {
        event.preventDefault();

        if (!disableSubmitOnEnter || !pressedEnter.current) {
          onSubmit(event);
        }
      }}
      {...otherProps}
    >
      <FormContext.Provider value={{ formErrors, hasFormErrors, updateFormErrors }}>{children}</FormContext.Provider>
    </form>
  );
};

export default Form;
