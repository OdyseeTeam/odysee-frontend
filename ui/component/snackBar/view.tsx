import * as ICONS from 'constants/icons';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Button from 'component/button';
import classnames from 'classnames';
import Icon from 'component/common/icon';
import LbcMessage from 'component/common/lbc-message';
import I18nMessage from 'component/i18nMessage';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { doDismissToast } from 'redux/actions/notifications';
import { selectToast, selectToastCount } from 'redux/selectors/notifications';

const SnackBar = React.memo(function SnackBar() {
  const dispatch = useAppDispatch();

  const snack = useAppSelector((state) => selectToast(state));
  const snackCount = useAppSelector((state) => selectToastCount(state));

  const removeSnack = useCallback(() => dispatch(doDismissToast()), [dispatch]);

  const [isHovering, setIsHovering] = useState(false);
  const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleMouseEnter = useCallback(() => setIsHovering(true), []);
  const handleMouseLeave = useCallback(() => setIsHovering(false), []);

  // Manage auto-dismiss interval
  useEffect(() => {
    if (!snack) {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      return;
    }

    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
    }

    if (!isHovering) {
      intervalIdRef.current = setInterval(
        () => {
          removeSnack();
        },
        snack.duration === 'long' ? 10000 : 5000
      );
    }

    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [snack, isHovering, removeSnack]);

  if (!snack) {
    return null;
  }

  const {
    message,
    subMessage,
    linkText,
    linkTarget,
    actionText,
    action,
    secondaryActionText,
    secondaryAction,
    isError,
  } = snack;

  function handleAction(passedAction: (() => void) | undefined) {
    if (passedAction) passedAction();
    removeSnack();
  }

  return (
    <div
      className={classnames('snack-bar', {
        'snack-bar--error': isError,
      })}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {snackCount > 1 && (
        <div className="snack-bar-counter-bubble">
          <span className="notification__count">{snackCount}</span>
        </div>
      )}
      <div className="snack-bar__message">
        <Icon icon={isError ? ICONS.ALERT : ICONS.COMPLETED} size={18} />
        <p className="snack-bar__messageText">
          <LbcMessage>{message}</LbcMessage>
          {subMessage && (
            <p className="snack-bar__messageText snack-bar__messageText--sub">
              <LbcMessage>{subMessage}</LbcMessage>
            </p>
          )}
        </p>
        <Button className="snack-bar__close" icon={ICONS.REMOVE} title={__('Dismiss')} onClick={() => removeSnack()} />
      </div>
      {linkText && linkTarget && ( // This is a little weird because of `linkTarget` code in `lbry-redux`
        // Any navigation code should happen in the app, and that should be removed from lbry-redux
        <Button navigate={`/$${linkTarget}`} className="snack-bar__action" label={linkText} />
      )}
      {actionText && action && (
        <div className="snack-bar__action">
          <I18nMessage
            tokens={{
              firstAction: <Button onClick={() => handleAction(action)} label={actionText} />,
              secondAction: <Button onClick={() => handleAction(secondaryAction)} label={secondaryActionText} />,
            }}
          >
            {secondaryAction ? '%firstAction% / %secondAction%' : '%firstAction%'}
          </I18nMessage>
        </div>
      )}
    </div>
  );
});

export default SnackBar;
