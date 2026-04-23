// These should probably just be combined into one modal component
import * as ICONS from 'constants/icons';
import * as React from 'react';
import ReactModal from 'react-modal';
import Button from 'component/button';
import classnames from 'classnames';
import { useIsMobile } from 'effects/use-screensize';
type ModalProps = {
  isOpen?: boolean;
  type?: 'alert' | 'card' | 'custom' | 'confirm';
  width?: 'default' | 'wide' | 'wide-fixed';
  overlay?: boolean;
  confirmButtonLabel?: string;
  abortButtonLabel?: string;
  confirmButtonDisabled?: boolean;
  abortButtonDisabled?: boolean;
  disableOutsideClick?: boolean;
  onConfirmed?: (arg0: any) => any;
  onAborted?: (arg0: any) => any;
  className?: string;
  children?: React.ReactNode;
  extraContent?: React.ReactNode;
  expandButtonLabel?: string;
  hideButtonLabel?: string;
  title?: string | React.ReactNode;
  contentLabel?: string;
  ariaHideApp?: boolean;
};
export function Modal(props: ModalProps) {
  const {
    children,
    type = 'alert',
    width = 'default',
    confirmButtonLabel = __('OK'),
    confirmButtonDisabled = false,
    onConfirmed,
    abortButtonLabel = __('Cancel'),
    abortButtonDisabled = false,
    disableOutsideClick = false,
    onAborted,
    className,
    title,
    ...modalProps
  } = props;
  const isMobile = useIsMobile();
  return (
    <ReactModal
      {...modalProps}
      parentSelector={() => document.fullscreenElement || document.body}
      onRequestClose={!disableOutsideClick ? onAborted || onConfirmed : undefined}
      className={classnames('modal', className, {
        'modal--card-internal': type === 'card',
        'modal--wide': width === 'wide',
        'modal--wide-fixed': width === 'wide-fixed',
      })}
      overlayClassName="modal-overlay"
    >
      {title && <h1 className="card__title card__title--deprecated">{title}</h1>}
      {type === 'card' && (
        <Button
          iconSize={isMobile ? 24 : undefined}
          button="close"
          aria-label={__('Close')}
          icon={ICONS.REMOVE}
          onClick={onAborted}
        />
      )}
      {children}
      {type === 'custom' || type === 'card' ? null : ( // custom modals define their own buttons
        <div className="card__actions">
          <Button button="primary" label={confirmButtonLabel} disabled={confirmButtonDisabled} onClick={onConfirmed} />
          {type === 'confirm' ? (
            <Button button="link" label={abortButtonLabel} disabled={abortButtonDisabled} onClick={onAborted} />
          ) : null}
        </div>
      )}
    </ReactModal>
  );
}
export function ExpandableModal(props: ModalProps) {
  const {
    children,
    extraContent,
    confirmButtonLabel = __('OK'),
    expandButtonLabel = __('Show More...'),
    hideButtonLabel = __('Show Less'),
    onConfirmed,
    ...rest
  } = props;
  const [expanded, setExpanded] = React.useState(false);

  return (
    <Modal type="custom" {...rest} onConfirmed={onConfirmed}>
      {children}
      {expanded ? <div>{extraContent}</div> : null}
      <div className="card__actions">
        <Button button="primary" label={confirmButtonLabel} onClick={onConfirmed} />
        <Button
          button="link"
          label={!expanded ? expandButtonLabel : hideButtonLabel}
          onClick={() => setExpanded(!expanded)}
        />
      </div>
    </Modal>
  );
}
export default Modal;
