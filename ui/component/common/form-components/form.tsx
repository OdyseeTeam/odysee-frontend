import * as React from 'react';
import * as KEYCODES from 'constants/keycodes';
type Props = {
  children: React.ReactNode;
  errors?: {} | null | undefined;
  disableSubmitOnEnter?: boolean;
  onSubmit?: (arg0: any) => any;
} & Omit<React.HTMLAttributes<HTMLFormElement>, 'onSubmit'>;
export const FormContext = React.createContext<any>(undefined);
export const Form = (props: Props) => {
  const { children, errors, disableSubmitOnEnter, onSubmit, ...otherProps } = props;
  const pressedEnter = React.useRef(false);
  const [formErrors, setFormErrors] = React.useState(errors);
  const hasFormErrors = formErrors && Object.values(formErrors).length > 0;
  const prevPropErrorKeys = React.useRef(Object.keys(errors || {}));
  // Keep prop-driven errors in sync after mount (they used to be read only as
  // initial state, leaving stale errors on screen), without clobbering errors
  // children set through updateFormErrors.
  const errorsJson = JSON.stringify(errors || {});
  React.useEffect(() => {
    const nextErrors = JSON.parse(errorsJson);
    setFormErrors((prevErrors) => {
      const newErrors = Object.assign({}, prevErrors);
      prevPropErrorKeys.current.forEach((errorKey) => delete newErrors[errorKey]);
      Object.entries(nextErrors).forEach(([errorKey, error]) => {
        if (error) newErrors[errorKey] = error;
      });
      prevPropErrorKeys.current = Object.keys(nextErrors);
      return newErrors;
    });
  }, [errorsJson]);

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
      <FormContext.Provider
        value={{
          formErrors,
          hasFormErrors,
          updateFormErrors,
        }}
      >
        {children}
      </FormContext.Provider>
    </form>
  );
};
export default Form;
