// @flow
import React from 'react';
import './style.scss';

type Props = {
  label: string,
  sortKey: string | null,
  ownKey: string,
  order: string | null,
  setKey: (key: ?string) => void,
  setOrder: (order: ?string) => void,
};

export default function (props: Props) {
  const { label, sortKey, ownKey, order, setKey, setOrder } = props;

  const onUpClick = () => {
    if (order !== 'asc' || sortKey !== ownKey) {
      setKey(ownKey);
      setOrder('asc');
    } else {
      setKey(null);
      setOrder(null);
    }
  };

  const onDownClick = () => {
    if (order !== 'desc' || sortKey !== ownKey) {
      setKey(ownKey);
      setOrder('desc');
    } else {
      setKey(null);
      setOrder(null);
    }
  };

  const upActive = order === 'asc' && sortKey === ownKey;
  const downActive = order === 'desc' && sortKey === ownKey;

  return (
    <th>
      <span className="th-label-with-arrows">
        {__(label)}
        <span className="arrows">
          <span
            className={`arrow-up ${upActive ? 'arrow-up--active' : ''}`}
            onClick={() => onUpClick()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onDownClick();
            }}
          >
            &#9650;
          </span>
          <span
            className={`arrow-down ${downActive ? 'arrow-down--active' : ''}`}
            onClick={() => onDownClick()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onDownClick();
            }}
          >
            &#9660;
          </span>
        </span>
      </span>
    </th>
  );
}
