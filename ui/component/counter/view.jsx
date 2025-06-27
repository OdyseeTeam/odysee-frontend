// @flow
import React from 'react';
import './style.scss';

type Props = {
  value: number,
  precision: number,
};
const DIGITS = Array.from({ length: 10 }, (_, i) => i);

export default function Counter(props: Props) {
  const { value, precision = 2 } = props;

  const [chars, setChars] = React.useState([]);
  const [displayValue, setDisplayValue] = React.useState(value);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayValue(value);
    }, 200);

    return () => clearTimeout(timer);
  }, [value]);

  React.useEffect(() => {
    const str = Number(displayValue).toFixed(precision);
    setChars(str.split(''));
  }, [displayValue, precision]);

  return (
    <div className="counter-inline">
      <div className="counter-wrapper" style={{ lineHeight: 1 }}>
        {chars.map((c, i) =>
          /\d/.test(c) ? (
            <div className="number-wrapper" key={i}>
              <div className="digit-stack" style={{ transform: `translateY(-${+c * 10}%)` }}>
                {DIGITS.map((d) => (
                  <div className="digit" key={d}>
                    {d}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <span key={i} className="number-placeholder">
              {c}
            </span>
          )
        )}
      </div>
    </div>
  );
}
