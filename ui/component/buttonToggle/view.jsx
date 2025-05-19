// @flow
import React from 'react';
import './style.scss';

type Props = {
  status: boolean,
  setStatus: () => void,
};

function ButtonToggle(props: Props) {
  const { status, setStatus } = props;

  return (
    <div
      className={!status ? `toggle-wrapper` : `toggle-wrapper toggle-wrapper--active`}
      onClick={() => setStatus()}
    >
      <div className="toggle-status" />
    </div>
  );
}

export default ButtonToggle;
