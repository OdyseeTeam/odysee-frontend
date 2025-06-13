// @flow
import React from 'react'
import './style.scss'

const DIGITS = Array.from({ length: 10 }, (_, i) => i)

export default function Counter({ value }) {
  const [chars, setChars] = React.useState([])
  const [initialized, setInitialized] = React.useState(false)

  React.useEffect(() => {
    const str = Number(value).toFixed(2).split('')

    if (!initialized) {
      setChars(str)
      setInitialized(true)
      return
    }

    const timeout = setTimeout(() => {
      setChars(str)
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
