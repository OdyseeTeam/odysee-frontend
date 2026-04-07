import React, { useState, useEffect, useRef } from 'react';
import classnames from 'classnames';
import { DARK_THEME, LIGHT_THEME } from 'constants/themes';
import { useAppSelector } from 'redux/hooks';
import { selectTheme } from 'redux/selectors/settings';

type Props = {
  dark?: boolean;
  light?: boolean;
  type?: string | null;
  delayed?: boolean;
  text?: any;
};

const Spinner = React.memo(function Spinner({ dark = false, light = false, type, delayed = false, text }: Props) {
  const theme = useAppSelector((state) => selectTheme(state));

  const [show, setShow] = useState(!delayed);
  const delayedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (delayed) {
      delayedTimeoutRef.current = setTimeout(() => {
        setShow(true);
      }, 750);
    }

    return () => {
      if (delayedTimeoutRef.current) {
        clearTimeout(delayedTimeoutRef.current);
        delayedTimeoutRef.current = null;
      }
    };
  }, [delayed]);

  if (!show) {
    return null;
  }

  return (
    <>
      {text}
      <div
        className={classnames('spinner', {
          'spinner--dark': !light && (dark || theme === LIGHT_THEME),
          'spinner--light': !dark && (light || theme === DARK_THEME),
          'spinner--small': type === 'small',
        })}
      >
        <div className="rect rect1" />
        <div className="rect rect2" />
        <div className="rect rect3" />
        <div className="rect rect4" />
        <div className="rect rect5" />
      </div>
    </>
  );
});

export default Spinner;
