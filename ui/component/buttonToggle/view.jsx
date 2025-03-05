// @flow
import React, { forwardRef, useRef } from 'react';
import './style.scss';

type Props = {
  status: boolean,
};

function ButtonToggle(props: Props) {
  const { status } = props;

  const [currentStatus, setCurrentStatus] = React.useState(status);

  return (
    <div
      className={!currentStatus ? `toggle-wrapper` : `toggle-wrapper toggle-wrapper--active`}
      onClick={() => setCurrentStatus(!currentStatus)}
    >
      <div className="toggle-status" />
    </div>
  );
}

export default ButtonToggle;
