// @flow
/* eslint-disable react/prop-types */
import React, { useCallback, useEffect } from 'react';

const PRIMARY_SHORTCUTS = [
  { keys: ['Space', 'K'], label: __('Play/Pause (hold to speed up)') },
  { keys: ['J', 'L'], label: __('Seek -10s / +10s') },
  { keys: ['Left', 'Right'], label: __('Seek -5s / +5s') },
  { keys: ['Up', 'Down'], label: __('Volume up/down') },
  { keys: 'M', label: __('Mute/unmute') },
  { keys: 'F', label: __('Fullscreen') },
];

const SECONDARY_SHORTCUTS = [
  { keys: ['Shift', '?'], separator: ' + ', label: __('Show shortcuts') },
  { keys: ['Shift', '.'], separator: ' + ', label: __('Speed up') },
  { keys: ['Shift', ','], separator: ' + ', label: __('Slow down') },
  { keys: '0-9', label: __('Jump to 0-90%') },
  { keys: 'T', label: __('Theater mode') },
  { keys: ['Shift', 'N'], separator: ' + ', label: __('Play next') },
  { keys: ['Shift', 'P'], separator: ' + ', label: __('Play previous') },
  { keys: ',', label: __('Back one frame (paused)') },
  { keys: '.', label: __('Forward one frame (paused)') },
];

function ShortcutItem({ keys, separator, label }) {
  const parts = Array.isArray(keys) ? keys : [keys];
  const joiner = separator || ' / ';

  return (
    <li className="odysee-shortcuts__item">
      <span className="odysee-shortcuts__keys">
        {parts.map((key, i) => (
          <React.Fragment key={key}>
            {i > 0 && <span className="odysee-shortcuts__separator">{joiner}</span>}
            <kbd className="odysee-shortcuts__kbd">{key}</kbd>
          </React.Fragment>
        ))}
      </span>
      <span className="odysee-shortcuts__action">{label}</span>
    </li>
  );
}

type Props = {
  onClose: () => void,
};

export default function KeyboardShortcutsOverlay({ onClose }: Props) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="odysee-shortcuts-overlay" role="dialog" aria-label={__('Keyboard shortcuts')} onClick={onClose}>
      <div className="odysee-shortcuts-overlay__card" onClick={(e) => e.stopPropagation()}>
        <div className="odysee-shortcuts-overlay__header">
          <span className="odysee-shortcuts-overlay__title">{__('Keyboard shortcuts')}</span>
          <button type="button" className="odysee-shortcuts-overlay__close" onClick={onClose}>
            {__('Close')}
          </button>
        </div>
        <div className="odysee-shortcuts-overlay__body">
          <ul className="odysee-shortcuts__list">
            {PRIMARY_SHORTCUTS.map((s) => (
              // $FlowFixMe
              <ShortcutItem key={s.label} {...s} />
            ))}
          </ul>
          <ul className="odysee-shortcuts__list">
            {SECONDARY_SHORTCUTS.map((s) => (
              <ShortcutItem key={s.label} {...s} />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
