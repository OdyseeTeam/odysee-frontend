import React from 'react';
import Button from 'component/button';
import Card from 'component/common/card';
import Spinner from 'component/spinner';
import { Modal } from 'modal/modal';
import BusyIndicator from 'component/common/busy-indicator';
import { FormField } from 'component/common/form';
import { useAppDispatch } from 'redux/hooks';
import { doHideModal } from 'redux/actions/app';
type Props = {
  title: string;
  subtitle?: string | React.ReactNode;
  body?: string | React.ReactNode;
  labelOk?: string;
  labelCancel?: string;
  hideCancel?: boolean;
  busyMsg?: string;
  checkboxLabel?: string;
  onConfirm: (closeModal: () => void, setIsBusy: (arg0: boolean) => void) => void;
  onCancel: (closeModal: () => void, setIsBusy: (arg0: boolean) => void) => void;
};
export default function ModalConfirm(props: Props) {
  const { title, subtitle, body, labelOk, labelCancel, hideCancel, busyMsg, checkboxLabel, onConfirm, onCancel } =
    props;
  const dispatch = useAppDispatch();
  const hideModal = () => dispatch(doHideModal());
  const [isBusy, setIsBusy] = React.useState(false);
  const [isChecked, setIsChecked] = React.useState(!checkboxLabel);

  function handleOnClick() {
    if (onConfirm) {
      onConfirm(hideModal, setIsBusy);
    }
  }

  function handleOnCancel() {
    if (onCancel) {
      onCancel(hideModal, setIsBusy);
    } else {
      hideModal();
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
            {checkboxLabel && (
              <FormField
                type="checkbox"
                name="modal_confirm_checkbox"
                label={checkboxLabel}
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
                <Button button="link" label={labelCancel || __('Cancel')} disabled={isBusy} onClick={handleOnCancel} />
              )}
            </div>
          </>
        }
      />
    </Modal>
  );
}
