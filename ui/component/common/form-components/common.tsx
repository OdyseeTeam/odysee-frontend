import * as React from 'react';
import Button from 'component/button';
type CountInfoProps = {
  charCount?: number;
  textAreaMaxLength?: number;
};
export const CountInfo = (countInfoProps: CountInfoProps) => {
  const { charCount, textAreaMaxLength } = countInfoProps;
  // Keep this outside the editor status bar so callers can position it
  // consistently across textarea and markdown modes.
  const hasCharCount = charCount !== undefined && charCount >= 0;
  return (
    hasCharCount &&
    textAreaMaxLength !== undefined && (
      <span className="comment__char-count-mde">{`${charCount || '0'}/${textAreaMaxLength}`}</span>
    )
  );
};
type QuickActionProps = {
  label?: string;
  quickActionHandler?: (arg0: any) => any;
};
export const QuickAction = (quickActionProps: QuickActionProps) => {
  const { label, quickActionHandler } = quickActionProps;
  return label && quickActionHandler ? (
    <div className="form-field__quick-action">
      <Button button="link" onClick={quickActionHandler} label={label} />
    </div>
  ) : null;
};
type LabelProps = {
  name: string;
  label?: any;
  errorMessage?: any;
};
export const Label = (labelProps: LabelProps) => {
  const { name, label, errorMessage } = labelProps;
  return <label htmlFor={name}>{errorMessage ? <span className="error__text">{errorMessage}</span> : label}</label>;
};
