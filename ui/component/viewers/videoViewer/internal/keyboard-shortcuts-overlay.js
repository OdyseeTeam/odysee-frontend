import videojs from 'video.js';
import { VJS_EVENTS } from 'constants/player';

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

function formatKeys(keys, separator) {
  const parts = Array.isArray(keys) ? keys : [keys];
  const joiner = separator || ' / ';
  return parts.map((key) => `<kbd>${key}</kbd>`).join(joiner);
}

function renderShortcutItems(items) {
  return items
    .map((item) => {
      const label = item.label;
      const isCompact = typeof label === 'string' && (label.length > 30 || label.indexOf('(') !== -1);
      const actionClass = isCompact ? 'vjs-shortcuts-action vjs-shortcuts-action--compact' : 'vjs-shortcuts-action';
      return `
        <li class="vjs-shortcuts-item">
          <div class="vjs-shortcuts-keys">${formatKeys(item.keys, item.separator)}</div>
          <div class="${actionClass}">${label}</div>
        </li>
      `;
    })
    .join('');
}

function buildOverlayMarkup() {
  return `
    <div class="vjs-shortcuts-card">
      <div class="vjs-shortcuts-header">
        <div class="vjs-shortcuts-title">${__('Keyboard shortcuts')}</div>
        <div class="vjs-shortcuts-actions">
          <button type="button" class="vjs-shortcuts-close" aria-label="${__('Close')}">${__('Close')}</button>
        </div>
      </div>
      <div class="vjs-shortcuts-body">
        <ul class="vjs-shortcuts-list vjs-shortcuts-list--primary">
          ${renderShortcutItems(PRIMARY_SHORTCUTS)}
        </ul>
        <ul class="vjs-shortcuts-list vjs-shortcuts-list--secondary">
          ${renderShortcutItems(SECONDARY_SHORTCUTS)}
        </ul>
      </div>
    </div>
  `;
}

export function ensureKeyboardShortcutsOverlay(player) {
  if (!player) return null;
  if (player.keyboardShortcutsOverlay) return player.keyboardShortcutsOverlay;

  const overlayEl = videojs.dom.createEl('div', {
    className: 'vjs-shortcuts-overlay',
  });
  overlayEl.setAttribute('role', 'dialog');
  overlayEl.setAttribute('aria-label', __('Keyboard shortcuts'));
  overlayEl.setAttribute('aria-hidden', 'true');
  overlayEl.innerHTML = buildOverlayMarkup();

  const playerEl = player.el();
  if (!playerEl) return null;
  playerEl.appendChild(overlayEl);

  const closeButton = overlayEl.querySelector('.vjs-shortcuts-close');
  let isOpen = false;

  const open = () => {
    if (isOpen) return;
    isOpen = true;
    overlayEl.classList.add('vjs-shortcuts-overlay--open');
    overlayEl.setAttribute('aria-hidden', 'false');
    player.userActive(true);
  };

  const close = () => {
    if (!isOpen) return;
    isOpen = false;
    overlayEl.classList.remove('vjs-shortcuts-overlay--open');
    overlayEl.setAttribute('aria-hidden', 'true');
  };

  const toggle = (forceState) => {
    if (typeof forceState === 'boolean') {
      forceState ? open() : close();
      return;
    }
    isOpen ? close() : open();
  };

  if (closeButton) {
    closeButton.addEventListener('click', () => close());
  }

  overlayEl.addEventListener('click', (event) => {
    if (event.target === overlayEl) close();
  });

  player.on(VJS_EVENTS.PLAYER_CLOSED, () => close());

  const api = {
    open,
    close,
    toggle,
    isOpen: () => isOpen,
  };

  player.keyboardShortcutsOverlay = api;
  player.toggleKeyboardShortcutsOverlay = toggle;

  return api;
}
