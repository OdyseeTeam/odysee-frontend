import React from 'react';
type Props = {
  message?: string | null;
};

function BusyIndicator({ message = '' }: Props) {
  return (
    <span className="busy-indicator">
      {message} <span className="busy-indicator__loader" />
    </span>
  );
}

export default BusyIndicator;
