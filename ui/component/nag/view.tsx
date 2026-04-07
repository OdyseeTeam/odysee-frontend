import { v4 as uuid } from 'uuid';
import * as ICONS from 'constants/icons';
import classnames from 'classnames';
import React from 'react';
import Button from 'component/button';
import { useAppDispatch } from 'redux/hooks';
import { doUpdateVisibleNagIds } from 'redux/actions/notifications';

type Props = {
  message: string | React.ReactNode;
  action?: React.ReactNode;
  closeTitle?: string;
  actionText?: string;
  href?: string;
  type?: string;
  inline?: boolean;
  relative?: boolean;
  onClick?: () => void;
  onClose?: () => void;
};
export default function Nag(props: Props) {
  const {
    message,
    action: customAction,
    closeTitle,
    actionText,
    href,
    onClick,
    onClose,
    type,
    inline,
    relative,
  } = props;
  const dispatch = useAppDispatch();
  const buttonProps = onClick
    ? {
        onClick,
      }
    : href
      ? {
          href,
        }
      : null;
  React.useEffect(() => {
    const id = uuid();
    dispatch(doUpdateVisibleNagIds(id, true));
    return () => {
      dispatch(doUpdateVisibleNagIds(id, false));
    }; // eslint-disable-next-line react-hooks/exhaustive-deps -- on mount only
  }, []);
  return (
    <div
      className={classnames('nag', {
        'nag--helpful': type === 'helpful',
        'nag--error': type === 'error',
        'nag--inline': inline,
        'nag--relative': relative,
      })}
    >
      <div className="nag__message">{message}</div>

      {customAction}

      {buttonProps && (
        <Button
          className={classnames('nag__button', {
            'nag__button--helpful': type === 'helpful',
            'nag__button--error': type === 'error',
          })}
          {...buttonProps}
        >
          {actionText}
        </Button>
      )}

      {onClose && (
        <Button
          className={classnames('nag__button nag__close', {
            'nag__button--helpful': type === 'helpful',
            'nag__button--error': type === 'error',
          })}
          title={closeTitle}
          icon={ICONS.REMOVE}
          onClick={onClose}
        />
      )}
    </div>
  );
}
