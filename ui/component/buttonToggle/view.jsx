// @flow
import React from 'react';
import './style.scss';

type Props = {
  status: boolean,
  onClick: () => void,
  disabled: boolean,
};

function ButtonToggle(props: Props) {
  const { status, onClick, disabled } = props;

  return (
    <div
      className={`toggle-wrapper ${status ? 'toggle-wrapper--active' : ''} ${disabled ? 'slider-wrapper--disabled' : ''} `}
      onClick={!disabled ? onClick : undefined}
    >
      <div className="toggle-status" />
    </div>
  );
}

export default ButtonToggle;
