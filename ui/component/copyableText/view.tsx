import * as ICONS from 'constants/icons';
import { FormField } from 'component/common/form';
import Button from 'component/button';
import React, { useRef } from 'react';
import { useAppDispatch } from 'redux/hooks';
import { doToast } from 'redux/actions/notifications';

type Props = {
  copyable: string;
  onlyCopy: boolean;
  snackMessage: string | null | undefined;
  label?: string;
  primaryButton?: boolean;
  name?: string;
  hideValue?: boolean;
  linkTo?: string;
  // url to append copyable to 'https://link.to/<copyable>`
  onCopy?: (arg0: string) => string;
  enableInputMask?: boolean;
};
export default function CopyableText(props: Props) {
  const {
    copyable,
    onlyCopy,
    snackMessage,
    label,
    primaryButton = false,
    name,
    onCopy,
    enableInputMask,
    linkTo,
    hideValue,
  } = props;

  const dispatch = useAppDispatch();
  const [maskInput, setMaskInput] = React.useState(enableInputMask);
  const input = useRef();

  function handleCopyText() {
    if (enableInputMask || onlyCopy) {
      navigator.clipboard
        .writeText(copyable)
        .then(() => {
          dispatch(
            doToast({
              message: snackMessage || __('Text copied'),
            })
          );
        })
        .catch(() => {
          dispatch(
            doToast({
              message: __('Failed to copy.'),
              isError: true,
            })
          );
        });
    } else {
      const topRef = input.current;

      if (topRef && topRef.input && topRef.input.current) {
        topRef.input.current.select();

        if (onCopy) {
          // Allow clients to change the selection before making the copy.
          onCopy(topRef.input.current);
        }
      }

      document.execCommand('copy');
      dispatch(
        doToast({
          message: snackMessage || __('Text copied'),
        })
      );
    }
  }

  function onFocus() {
    // We have to go a layer deep since the input is inside the form component
    const topRef = input.current;

    if (topRef && topRef.input && topRef.input.current) {
      topRef.input.current.select();
    }
  }

  return (
    <FormField
      type={maskInput ? 'password' : 'text'}
      className="form-field--copyable"
      hideValue={hideValue}
      readOnly
      name={name}
      label={label}
      value={copyable || ''}
      ref={input}
      onFocus={onFocus}
      inputButton={
        <>
          <Button
            button={primaryButton ? 'primary' : 'secondary'}
            icon={ICONS.COPY}
            onClick={handleCopyText}
            aria-label={__('Copy %copyable%', {
              copyable: copyable,
            })}
          />
          {linkTo && (
            <Button
              button={primaryButton ? 'primary' : 'secondary'}
              icon={ICONS.EXTERNAL}
              navigate={`${linkTo}${copyable}`}
              description={'Link'}
            />
          )}
        </>
      }
      helper={
        enableInputMask && (
          <Button button="link" onClick={() => setMaskInput(!maskInput)} label={maskInput ? __('Show') : __('Hide')} />
        )
      }
    />
  );
}
