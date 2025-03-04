// @flow
import React from 'react';
import type { Node } from 'react';
import Button from 'component/button';
import Card from 'component/common/card';
import Spinner from 'component/spinner';
import { Modal } from 'modal/modal';
import BusyIndicator from 'component/common/busy-indicator';
import { FormField } from 'component/common/form';

type Props = {
  title: string,
  subtitle?: string | Node,
  body?: string | Node,
  labelOk?: string,
  labelCancel?: string,
  hideCancel?: boolean,
  busyMsg?: string,
  checkboxText?: string,
  onConfirm: (closeModal: () => void, setIsBusy: (boolean) => void) => void,
  // --- perform ---
  doHideModal: () => void,
};

export default function ModalConfirm(props: Props) {
  const { title, subtitle, body, labelOk, labelCancel, hideCancel, busyMsg, checkboxText, onConfirm, doHideModal } =
    props;

  const [isBusy, setIsBusy] = React.useState(false);
  const [isChecked, setIsChecked] = React.useState(!checkboxText);

  function handleOnClick() {
    if (onConfirm) {
      onConfirm(doHideModal, setIsBusy);
    }
  }

  return (
    <Modal isOpen type="custom" width="wide">
      <Card
        title={title}
        subtitle={subtitle}
        body={body}
        className="confirm__wrapper"
        actions={
          <>
            {checkboxText && (
              <FormField
                type="checkbox"
                name="modal_confirm_checkbox"
                label={checkboxText}
                checked={isChecked}
                disabled={isBusy}
                onChange={() => setIsChecked(!isChecked)}
              />
            )}
            <div className="section__actions">
              {isBusy && busyMsg ? (
                <BusyIndicator message={busyMsg} />
              ) : (
                <Button
                  button="primary"
                  label={isBusy ? <Spinner type="small" /> : labelOk || __('OK')}
                  disabled={isBusy || !isChecked}
                  onClick={handleOnClick}
                />
              )}

              {!hideCancel && !(isBusy && busyMsg) && (
                <Button button="link" label={labelCancel || __('Cancel')} disabled={isBusy} onClick={doHideModal} />
              )}
            </div>
          </>
        }
      />
    </Modal>
  );
}
