import React, { useEffect, useRef, useReducer } from 'react';

const FADE_DELAY_MS = 800;

function reducer(state, action) {
  switch (action.type) {
    case 'seek': {
      const { side, amount } = action;
      const other = side === 'left' ? 'right' : 'left';
      return {
        ...state,
        [side]: {
          total: state[side].visible ? state[side].total + amount : amount,
          key: state[side].key + 1,
          visible: true,
        },
        [other]: state[other],
      };
    }
    case 'fade':
      return {
        ...state,
        [action.side]: { total: 0, key: state[action.side].key, visible: false },
      };
    default:
      return state;
  }
}

const initialState = {
  left: { total: 0, key: 0, visible: false },
  right: { total: 0, key: 0, visible: false },
};

const RewindIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="white">
    <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" />
  </svg>
);

const FastForwardIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="white">
    <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" />
  </svg>
);

export default function SeekIndicator() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const timersRef = useRef({ left: null, right: null });

  useEffect(() => {
    function handleSeek(e) {
      const { amount } = e.detail;
      if (!amount) return;
      const side = amount < 0 ? 'left' : 'right';
      const abs = Math.abs(amount);

      if (timersRef.current[side]) clearTimeout(timersRef.current[side]);
      dispatch({ type: 'seek', side, amount: abs });
      timersRef.current[side] = setTimeout(() => {
        dispatch({ type: 'fade', side });
        timersRef.current[side] = null;
      }, FADE_DELAY_MS);
    }

    window.addEventListener('odysee-seek', handleSeek);
    const timers = timersRef.current;
    return () => {
      window.removeEventListener('odysee-seek', handleSeek);
      if (timers.left) clearTimeout(timers.left);
      if (timers.right) clearTimeout(timers.right);
    };
  }, []);

  if (!state.left.visible && !state.right.visible) return null;

  return (
    <div className="odysee-seek-indicator">
      <div className="odysee-seek-indicator__side">
        {state.left.visible && (
          <div className="odysee-seek-indicator__bubble" key={state.left.key}>
            <RewindIcon />
            <span className="odysee-seek-indicator__label">-{state.left.total}s</span>
          </div>
        )}
      </div>
      <div className="odysee-seek-indicator__side">
        {state.right.visible && (
          <div className="odysee-seek-indicator__bubble" key={state.right.key}>
            <FastForwardIcon />
            <span className="odysee-seek-indicator__label">{state.right.total}s</span>
          </div>
        )}
      </div>
    </div>
  );
}
