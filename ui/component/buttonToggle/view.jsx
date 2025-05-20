// @flow
import React from 'react';
import './style.scss';

type Props = {
  busy: ?boolean,
  status: boolean,
  setStatus: () => void,
};

function ButtonToggle(props: Props) {
  const { busy, status, setStatus } = props;

  return (
    <div
      className={`toggle-wrapper${status ? ' toggle-wrapper--active' : ''}${busy ? ' toggle-wrapper--busy' : ''}`}
      onClick={() => setStatus()}
    >
      <div className="toggle-status" />
    </div>
  );
}

export default ButtonToggle;
