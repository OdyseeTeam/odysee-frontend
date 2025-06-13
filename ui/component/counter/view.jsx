// @flow
import React from 'react'
import './style.scss'

const DIGITS = Array.from({ length: 10 }, (_, i) => i)

export default function Counter({ value }) {
  const [chars, setChars] = React.useState(['0','.','0','0'])

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      const str = Number(value).toFixed(2)
      setChars(str.split(''))
    }, 200)

    return () => clearTimeout(timeout)
  }, [value])

  return (
    <div className="counter-wrapper" style={{ lineHeight: 1 }}>
      {chars.map((c, i) =>
        /\d/.test(c) ? (
          <div className="number-wrapper" key={i}>
            <div
              className="digit-stack"
              style={{
                transform: `translateY(-${+c}em)`,
              }}
            >
              {DIGITS.map(d => (
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
  )
}
