// @flow
/* eslint-disable react/prop-types */
import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import Player from './player';
import KeyboardShortcutsOverlay from './components/KeyboardShortcutsOverlay';
import SeekIndicator from './components/SeekIndicator';
import {
  BufferingIndicator,
  CaptionsButton,
  Controls,
  MuteButton,
  PlayButton,
  Popover,
  Slider,
  Time,
  TimeSlider,
  Tooltip,
  VolumeSlider,
} from '@videojs/react';
import { icons } from 'component/common/icon-custom';
import * as ICONS from 'constants/icons';
import { VIDEO_PLAYBACK_RATES } from 'constants/player';
import { platform } from 'util/platform';
import { useIsMobile } from 'effects/use-screensize';
import {
  fullscreenElement as getFullscreenElement,
  requestFullscreen,
  exitFullscreen,
  onFullscreenChange,
} from 'util/full-screen';
import parseChapters from 'util/parse-chapters';
import Logo from 'component/logo';
import { URL } from 'config';
import { formatLbryUrlForWeb } from 'util/url';

const OdyseeCast = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={14}
    height={14}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
    {...props}
  >
    <path d="M2 8v-3a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" />
    <path d="M2 16a5 5 0 0 1 5 5M2 12a9 9 0 0 1 9 9" />
    <circle cx={2} cy={20} r={1.5} fill="currentColor" stroke="none" />
  </svg>
);

function formatCastTime(seconds) {
  if (!seconds || seconds < 0) return '0:00';
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${m < 10 ? '0' : ''}${m}:${sec < 10 ? '0' : ''}${sec}`;
  return `${m}:${sec < 10 ? '0' : ''}${sec}`;
}

function CastProgressBar({ castState, castActions }: { castState: any, castActions: any }) {
  const trackRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [hoverFrac, setHoverFrac] = useState(null);

  const fraction = castState.duration > 0 ? castState.currentTime / castState.duration : 0;

  const getFracFromEvent = (e) => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  };

  const handlePointerDown = useCallback(
    (e) => {
      setDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
      const f = getFracFromEvent(e);
      castActions.seek(f * castState.duration);
    },
    [castActions, castState.duration]
  );

  const handlePointerMove = useCallback(
    (e) => {
      const f = getFracFromEvent(e);
      setHoverFrac(f);
      if (dragging) {
        castActions.seek(f * castState.duration);
      }
    },
    [dragging, castActions, castState.duration]
  );

  const handlePointerUp = useCallback(() => setDragging(false), []);
  const handlePointerLeave = useCallback(() => setHoverFrac(null), []);

  const displayFrac = dragging && hoverFrac !== null ? hoverFrac : fraction;

  return (
    <div
      ref={trackRef}
      className="media-slider media-slider--time odysee-time-slider odysee-cast-slider"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      style={{ cursor: 'pointer' }}
    >
      <div className="media-slider__track odysee-slider__track">
        <div className="media-slider__fill odysee-slider__fill" style={{ width: `${displayFrac * 100}%` }} />
        {hoverFrac !== null && (
          <div className="odysee-cast-slider__hover-fill" style={{ width: `${hoverFrac * 100}%` }} />
        )}
      </div>
      <div
        className="media-slider__thumb odysee-slider__thumb"
        style={{ left: `${displayFrac * 100}%`, display: 'block' }}
      />
      {hoverFrac !== null && (
        <div
          className="odysee-slider-preview"
          style={{ position: 'absolute', left: `${hoverFrac * 100}%`, transform: 'translateX(-50%)' }}
        >
          <span className="odysee-slider-preview__time">{formatCastTime(hoverFrac * castState.duration)}</span>
        </div>
      )}
    </div>
  );
}

function CastVolumeSlider({ castState, castActions }: { castState: any, castActions: any }) {
  const trackRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const getFracFromEvent = (e) => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  };

  const handlePointerDown = useCallback(
    (e) => {
      setDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
      castActions.setVolume(getFracFromEvent(e));
    },
    [castActions]
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (dragging) castActions.setVolume(getFracFromEvent(e));
    },
    [dragging, castActions]
  );

  const handlePointerUp = useCallback(() => setDragging(false), []);

  return (
    <div
      ref={trackRef}
      className="media-slider media-volume-slider"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{ cursor: 'pointer' }}
    >
      <div className="media-slider__track">
        <div className="media-slider__fill" style={{ width: `${castState.volume * 100}%` }} />
      </div>
      <div className="media-slider__thumb" style={{ left: `${castState.volume * 100}%`, display: 'block' }} />
    </div>
  );
}

const OdyseePlay = icons[ICONS.PLAY];
const OdyseeReplay = icons[ICONS.REPLAY];
const OdyseePlayPrevious = icons[ICONS.PLAY_PREVIOUS];
const OdyseeVolumeMuted = icons[ICONS.VOLUME_MUTED];
const OdyseeInfo = icons[ICONS.INFO];
const OdyseeCommentsList = icons[ICONS.COMMENTS_LIST];
const OdyseeChat = icons[ICONS.CHAT];
const OdyseeDiscover = icons[ICONS.DISCOVER];
const OdyseeAutoplayNext = icons[ICONS.AUTOPLAY_NEXT];
const OdyseeSettings = icons[ICONS.SETTINGS];
const OdyseeRepeat = icons[ICONS.REPEAT];
const OdyseeCamera = icons[ICONS.CAMERA];

const Btn = forwardRef(function Btn({ className, ...props }, ref) {
  return <button ref={ref} type="button" className={`media-button ${className || ''}`} {...props} />;
});

function PlayLabel() {
  const paused = Player.usePlayer((s) => Boolean(s.paused));
  const ended = Player.usePlayer((s) => Boolean(s.ended));
  if (ended) return 'Replay';
  return paused ? __('Play (space)') : __('Pause (space)');
}

function CaptionsLabel() {
  return Player.usePlayer((s) => Boolean(s.subtitlesShowing)) ? __('Disable captions') : __('Enable captions');
}

function handleSnapshotFn(media, title) {
  if (!media) return;
  const video = media.closest ? media : document.querySelector('video');
  if (!video) return;
  const width = video.videoWidth;
  const height = video.videoHeight;
  const canvas = Object.assign(document.createElement('canvas'), { width, height });
  canvas.getContext('2d').drawImage(video, 0, 0, width, height);
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/jpeg');
  link.download =
    (title || 'snapshot')
      .replace(/[^\p{L}\p{N}\p{P}\p{Z}^$\n]/gu, '')
      .replace(/\s+$/, '')
      .replace(/\.$/, '') + '.jpg';
  link.click();
  link.remove();
  canvas.remove();
}

const COMMON_HEIGHTS = [144, 240, 360, 480, 720, 1080, 1440, 2160, 4320];
function snapHeight(h) {
  for (const c of COMMON_HEIGHTS) {
    if (h <= c) return c;
  }
  return h;
}

function useQualityLevels() {
  const media = Player.useMedia();
  const [levels, setLevels] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(-1);
  const [activeHeight, setActiveHeight] = useState(0);

  useEffect(() => {
    if (!media) return;

    let hls = media.engine || media._hls;
    if (hls) setup(hls);

    const interval = setInterval(() => {
      const h = media.engine || media._hls;
      if (h && h !== hls) {
        hls = h;
        setup(h);
      }
    }, 500);

    let onParsed, onSwitched, onFragChanged;

    function setup(h) {
      clearInterval(interval);
      const updateLevels = () => {
        if (h.levels) {
          setLevels(h.levels.map((l, i) => ({ height: l.height, index: i })));
          setCurrentLevel(h.currentLevel);
          const playing = h.currentLevel >= 0 ? h.currentLevel : h.loadLevel >= 0 ? h.loadLevel : -1;
          setActiveHeight(playing >= 0 && h.levels[playing] ? h.levels[playing].height : 0);
        }
      };
      updateLevels();
      onParsed = updateLevels;
      onSwitched = () => {
        setCurrentLevel(h.currentLevel);
        const playing = h.currentLevel >= 0 ? h.currentLevel : h.loadLevel >= 0 ? h.loadLevel : -1;
        setActiveHeight(playing >= 0 && h.levels[playing] ? h.levels[playing].height : 0);
      };
      const onFragChanged = (_, data) => {
        if (data && data.frag && data.frag.level >= 0 && h.levels[data.frag.level]) {
          setActiveHeight(h.levels[data.frag.level].height);
        }
      };
      if (h.on) {
        h.on('hlsManifestParsed', onParsed);
        h.on('hlsLevelSwitched', onSwitched);
        h.on('hlsFragChanged', onFragChanged);
      }
    }

    return () => {
      clearInterval(interval);
      if (hls && hls.off) {
        if (onParsed) hls.off('hlsManifestParsed', onParsed);
        if (onSwitched) hls.off('hlsLevelSwitched', onSwitched);
        if (onFragChanged) hls.off('hlsFragChanged', onFragChanged);
      }
    };
  }, [media]);

  const selectQuality = useCallback(
    (levelIndex) => {
      const hls = media?.engine || media?._hls;
      if (!hls) return;
      hls.currentLevel = levelIndex;
      setCurrentLevel(levelIndex);
    },
    [media]
  );

  const currentLabel =
    currentLevel === -1
      ? __('Auto')
      : levels[currentLevel]
      ? `${snapHeight(levels[currentLevel].height)}p`
      : __('Auto');

  const isHD = activeHeight >= 720;

  return { levels, currentLevel, currentLabel, selectQuality, isHD };
}

function SettingsMenuContent({
  isMarkdownOrComment,
  isLivestream,
  onToggleAutoplayNext,
  autoplayNext,
  floatingPlayer,
  onToggleFloatingPlayer,
  autoplayMedia,
  onToggleAutoplayMedia,
  title,
  onShowShortcuts,
  onCloseMenu,
  quality,
  isFloating,
  embedded,
  isCasting,
}) {
  const isMobileDevice = platform.isMobile();
  const { levels, currentLevel, currentLabel, selectQuality } = quality;
  const [view, setView] = useState('main');
  const media = Player.useMedia();
  const rate = Player.usePlayer((s) => s.playbackRate) || 1;
  const rateLabel = `${rate}x`;

  const handleSelectRate = useCallback(
    (r) => {
      if (media) media.playbackRate = r;
      setView('main');
    },
    [media]
  );

  const isShorts =
    !!document.querySelector('.shorts-page__container') ||
    !!document.querySelector('.content__viewer--shorts-floating');
  const [looped, setLooped] = useState(false);
  const handleToggleLoop = useCallback(() => {
    if (media) {
      media.loop = !media.loop;
      setLooped(media.loop);
    }
  }, [media]);

  const handleSnapshot = useCallback(() => {
    handleSnapshotFn(media, title);
    if (onCloseMenu) onCloseMenu();
  }, [media, title, onCloseMenu]);

  const handleShowShortcuts = useCallback(() => {
    if (onShowShortcuts) onShowShortcuts();
    if (onCloseMenu) onCloseMenu();
  }, [onShowShortcuts, onCloseMenu]);

  if (view === 'quality') {
    return (
      <div key="quality" className="media-settings-menu">
        <button type="button" className="media-settings-menu__back" onClick={() => setView('main')}>
          <svg
            className="media-settings-menu__back-icon"
            width={12}
            height={12}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {__('Quality')}
        </button>
        {levels
          .slice()
          .sort((a, b) => b.height - a.height)
          .map((level) => (
            <button
              key={level.index}
              type="button"
              className={`media-settings-menu__option ${
                currentLevel === level.index ? 'media-settings-menu__option--selected' : ''
              }`}
              onClick={() => {
                selectQuality(level.index);
                setView('main');
              }}
            >
              {snapHeight(level.height)}p
            </button>
          ))}
        {!isLivestream && (
          <button
            type="button"
            className={`media-settings-menu__option ${
              currentLevel === -2 ? 'media-settings-menu__option--selected' : ''
            }`}
            onClick={() => {
              selectQuality(-2);
              setView('main');
            }}
          >
            {__('Original')}
          </button>
        )}
        <button
          type="button"
          className={`media-settings-menu__option ${
            currentLevel === -1 ? 'media-settings-menu__option--selected' : ''
          }`}
          onClick={() => {
            selectQuality(-1);
            setView('main');
          }}
        >
          {__('Auto')}
        </button>
      </div>
    );
  }

  if (view === 'speed') {
    return (
      <div key="speed" className="media-settings-menu">
        <button type="button" className="media-settings-menu__back" onClick={() => setView('main')}>
          <svg
            className="media-settings-menu__back-icon"
            width={12}
            height={12}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {__('Playback Speed')}
        </button>
        {VIDEO_PLAYBACK_RATES.map((r) => (
          <button
            key={r}
            type="button"
            className={`media-settings-menu__option ${r === rate ? 'media-settings-menu__option--selected' : ''}`}
            onClick={() => handleSelectRate(r)}
          >
            {`${r}x`}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div key="main" className="media-settings-menu">
      {!isMobileDevice && !embedded && !isShorts && (
        <button type="button" className="media-settings-menu__item" onClick={handleShowShortcuts}>
          <svg
            className="media-settings-menu__icon"
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x={2} y={4} width={20} height={16} rx={2} />
            <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M8 16h8" />
          </svg>
          <span className="media-settings-menu__label">{__('Keyboard shortcuts')}</span>
        </button>
      )}
      {!isMobileDevice && (
        <button type="button" className="media-settings-menu__item" onClick={handleSnapshot}>
          <OdyseeCamera className="media-settings-menu__icon" size={16} color="currentColor" />
          <span className="media-settings-menu__label">{__('Take snapshot')}</span>
        </button>
      )}
      {!embedded && (
        <button
          type="button"
          className={`media-settings-menu__item ${isFloating ? 'media-settings-menu__item--disabled' : ''}`}
          onClick={isFloating ? undefined : onToggleFloatingPlayer}
        >
          <svg
            className="media-settings-menu__icon"
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <rect x="7.5" y="6.5" width="9" height="7" rx="1" fill="currentColor" stroke="none" />
          </svg>
          <span className="media-settings-menu__label">{__('Floating Player')}</span>
          <span className={`media-settings-toggle ${floatingPlayer ? 'media-settings-toggle--on' : ''}`}>
            <span className="media-settings-toggle__knob" />
          </span>
        </button>
      )}
      {!embedded && (
        <button type="button" className="media-settings-menu__item" onClick={onToggleAutoplayMedia}>
          <svg
            className="media-settings-menu__icon"
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
          </svg>
          <span className="media-settings-menu__label">{__('Autoplay')}</span>
          <span className={`media-settings-toggle ${autoplayMedia ? 'media-settings-toggle--on' : ''}`}>
            <span className="media-settings-toggle__knob" />
          </span>
        </button>
      )}
      {!embedded && !isMarkdownOrComment && onToggleAutoplayNext && !isShorts && (
        <button type="button" className="media-settings-menu__item" onClick={onToggleAutoplayNext}>
          <OdyseeAutoplayNext className="media-settings-menu__icon" size={16} />
          <span className="media-settings-menu__label">{__('Autoplay Next')}</span>
          <span className={`media-settings-toggle ${autoplayNext ? 'media-settings-toggle--on' : ''}`}>
            <span className="media-settings-toggle__knob" />
          </span>
        </button>
      )}
      {!embedded && !isShorts && (
        <button type="button" className="media-settings-menu__item" onClick={handleToggleLoop}>
          <OdyseeRepeat className="media-settings-menu__icon" size={16} color="currentColor" />
          <span className="media-settings-menu__label">{__('Loop')}</span>
          <span className={`media-settings-toggle ${looped ? 'media-settings-toggle--on' : ''}`}>
            <span className="media-settings-toggle__knob" />
          </span>
        </button>
      )}
      <button type="button" className="media-settings-menu__item" onClick={() => setView('speed')}>
        <svg
          className="media-settings-menu__icon"
          width={16}
          height={16}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
          <path d="M12 12l4-4" />
          <circle cx={12} cy={12} r={1.5} fill="currentColor" stroke="none" />
        </svg>
        <span className="media-settings-menu__label">{__('Playback Speed')}</span>
        <span className="media-settings-menu__value">{rateLabel}</span>
      </button>
      {levels.length > 0 && !isCasting && (
        <button type="button" className="media-settings-menu__item" onClick={() => setView('quality')}>
          <svg
            className="media-settings-menu__icon"
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1={4} y1={21} x2={4} y2={14} />
            <line x1={4} y1={10} x2={4} y2={3} />
            <line x1={12} y1={21} x2={12} y2={12} />
            <line x1={12} y1={8} x2={12} y2={3} />
            <line x1={20} y1={21} x2={20} y2={16} />
            <line x1={20} y1={12} x2={20} y2={3} />
            <line x1={1} y1={14} x2={7} y2={14} />
            <line x1={9} y1={8} x2={15} y2={8} />
            <line x1={17} y1={16} x2={23} y2={16} />
          </svg>
          <span className="media-settings-menu__label">{__('Quality')}</span>
          <span className="media-settings-menu__value">{currentLabel}</span>
        </button>
      )}
    </div>
  );
}

function ClickToPlay({ onTogglePlay }) {
  const media = Player.useMedia();
  const settingsWasOpenRef = useRef(false);
  const clickTimerRef = useRef(null);

  useEffect(() => {
    const onPointerDown = () => {
      settingsWasOpenRef.current = Boolean(document.querySelector('.media-button--settings-open'));
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, []);

  useEffect(() => {
    return () => {
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    };
  }, []);

  const handleClick = useCallback(() => {
    if (settingsWasOpenRef.current) {
      settingsWasOpenRef.current = false;
      return;
    }
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => {
      clickTimerRef.current = null;
      if (onTogglePlay) {
        onTogglePlay();
      } else if (media) {
        if (media.paused) {
          media.play();
        } else {
          media.pause();
        }
      }
    }, 200);
  }, [media, onTogglePlay]);

  const handleDblClick = useCallback(() => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
  }, []);

  return <div className="odysee-click-to-play" onClick={handleClick} onDoubleClick={handleDblClick} />;
}

function useLiveTimeFormat() {
  const duration = Player.usePlayer((s) => s.duration) || 0;
  return useCallback(
    (value) => {
      const diff = Math.round(value - duration);
      if (diff >= 0) return '0:00';
      const abs = Math.abs(diff);
      const m = Math.floor(abs / 60);
      const s = abs % 60;
      return `-${m}:${s < 10 ? '0' : ''}${s}`;
    },
    [duration]
  );
}

function chapterFormatFn(chapters) {
  return (seconds) => {
    for (let i = chapters.length - 1; i >= 0; i--) {
      if (seconds >= chapters[i].time) return chapters[i].label;
    }
    return '';
  };
}

function ChapterMarkers({ chapters }: { chapters: Array<any> }) {
  const duration = Player.usePlayer((s) => s.duration) || 0;

  if (!chapters || chapters.length < 2 || !duration) return null;

  return (
    <div className="odysee-chapter-markers">
      {chapters.slice(1).map((ch, i) => (
        <div key={i} className="odysee-chapter-marker" style={{ left: `${(ch.time / duration) * 100}%` }} />
      ))}
    </div>
  );
}

function ChapterPill({ chapters }: { chapters: Array<any> }) {
  const currentTime = Player.usePlayer((s) => s.currentTime) || 0;

  if (!chapters || chapters.length === 0) return null;

  let activeChapter = null;
  for (let i = chapters.length - 1; i >= 0; i--) {
    if (currentTime >= chapters[i].time) {
      activeChapter = chapters[i];
      break;
    }
  }

  if (!activeChapter) return null;

  return (
    <div className="media-surface odysee-controls odysee-chapter-pill">
      <Btn
        className="media-button--icon odysee-chapter-pill__btn"
        onClick={() => window.dispatchEvent(new CustomEvent('toggleChaptersCard'))}
      >
        <span className="odysee-chapter-pill__label">{activeChapter.label}</span>
      </Btn>
    </div>
  );
}

function LiveButton() {
  const media = Player.useMedia();
  const currentTime = Player.usePlayer((s) => s.currentTime) || 0;
  const [atEdge, setAtEdge] = useState(true);
  const atEdgeRef = useRef(true);

  const getLiveSyncPosition = useCallback(() => {
    if (!media) return null;
    const hls = media._hls;
    if (hls && hls.liveSyncPosition != null) return hls.liveSyncPosition;
    if (media.seekable && media.seekable.length > 0) {
      return media.seekable.end(media.seekable.length - 1) - 4;
    }
    return null;
  }, [media]);

  useEffect(() => {
    if (!media) return;
    const check = () => {
      const syncPos = getLiveSyncPosition();
      if (syncPos != null) {
        const behind = syncPos - media.currentTime;
        const next = atEdgeRef.current ? behind < 10 : behind < 5;
        if (next !== atEdgeRef.current) {
          atEdgeRef.current = next;
          setAtEdge(next);
        }
      }
    };
    check();
    media.addEventListener('timeupdate', check);
    return () => media.removeEventListener('timeupdate', check);
  }, [media, currentTime, getLiveSyncPosition]);

  const seekToLive = useCallback(() => {
    const syncPos = getLiveSyncPosition();
    if (syncPos != null && media) {
      media.currentTime = syncPos;
    }
  }, [media, getLiveSyncPosition]);

  return (
    <button
      type="button"
      className={`odysee-live-button ${atEdge ? 'odysee-live-button--at-edge' : ''}`}
      onClick={seekToLive}
    >
      <span className="odysee-live-button__dot" />
      {__('LIVE')}
    </button>
  );
}

type Props = {
  children?: any,
  className?: string,
  isLivestream?: boolean,
  isMarkdownOrComment?: boolean,
  onToggleTheaterMode?: () => void,
  videoTheaterMode?: boolean,
  onToggleAutoplayNext?: () => void,
  autoplayNext?: boolean,
  floatingPlayer?: boolean,
  onToggleFloatingPlayer?: () => void,
  autoplayMedia?: boolean,
  onToggleAutoplayMedia?: () => void,
  onPlayNext?: (options?: { manual?: boolean }) => void,
  onPlayPrevious?: () => void,
  canPlayNext?: boolean,
  canPlayPrevious?: boolean,
  defaultQuality?: ?string,
  originalVideoWidth?: ?number,
  originalVideoHeight?: ?number,
  title?: ?string,
  description?: ?string,
  isFloating?: boolean,
  embedded?: boolean,
  uri?: string,
  castAvailable?: boolean,
  isCasting?: boolean,
  onCastToggle?: () => void,
  castState?: any,
  castActions?: any,
};

export default function OdyseeSkin(props: Props) {
  const {
    children,
    className,
    isLivestream,
    isMarkdownOrComment,
    onToggleTheaterMode,
    videoTheaterMode,
    onToggleAutoplayNext,
    autoplayNext,
    floatingPlayer,
    onToggleFloatingPlayer,
    autoplayMedia,
    onToggleAutoplayMedia,
    onPlayNext,
    onPlayPrevious,
    canPlayNext,
    canPlayPrevious,
    defaultQuality,
    originalVideoWidth,
    originalVideoHeight,
    title,
    description,
    isFloating,
    embedded,
    uri,
    castAvailable,
    isCasting,
    onCastToggle,
    castState,
    castActions,
    ...rest
  } = props;

  const isMobileDevice = platform.isMobile();
  const isMobileSize = useIsMobile();
  const isShorts =
    !!document.querySelector('.shorts-page__container') ||
    !!document.querySelector('.content__viewer--shorts-floating');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showRemaining, setShowRemaining] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fsEnterIconRef = React.useRef<?any>(null);
  const fsExitIconRef = React.useRef<?any>(null);
  const quality = useQualityLevels();
  const chapters = React.useMemo(() => parseChapters(description), [description]);
  const liveTimeFormat = useLiveTimeFormat();
  const isVerticalVideo = originalVideoWidth && originalVideoHeight && originalVideoHeight > originalVideoWidth;
  const castIsPaused = castState ? castState.isPaused : true;
  const castTogglePlay = React.useCallback(() => {
    if (!castActions) return;
    if (castIsPaused) {
      castActions.play();
    } else {
      castActions.pause();
    }
  }, [castIsPaused, castActions]);

  const [activePanel, setActivePanel] = useState(null);

  React.useEffect(() => {
    const handler = (e) => setActivePanel(e.detail.mode);
    window.addEventListener('fullscreen-panel-change', handler);
    return () => window.removeEventListener('fullscreen-panel-change', handler);
  }, []);

  React.useEffect(() => {
    const handler = () => setShowShortcuts((v) => !v);
    window.addEventListener('toggleShortcuts', handler);
    return () => window.removeEventListener('toggleShortcuts', handler);
  }, []);

  React.useLayoutEffect(() => {
    if (!settingsOpen) return;
    const isSafari = platform.isSafari();
    if (!isFloating && !isSafari) return;
    const fix = () => {
      const popup = document.querySelector('.media-popover--settings[popover]');
      const trigger = isFloating
        ? document.querySelector('.content__viewer--floating .media-button--settings')
        : document.querySelector('.media-button--settings');
      if (!popup || !trigger) return;
      const tr = trigger.getBoundingClientRect();
      const ph = popup.offsetHeight;
      const pw = popup.offsetWidth;
      const fitsAbove = tr.top - ph - 4 >= 0;
      const topPos = fitsAbove ? tr.top - ph - 4 : tr.bottom + 4;
      popup.style.setProperty('bottom', 'auto', 'important');
      popup.style.setProperty('top', `${topPos}px`, 'important');
      popup.style.setProperty('left', `${tr.right - pw + 12}px`, 'important');
      popup.style.setProperty('place-self', 'normal', 'important');
      popup.style.setProperty('margin-inline-start', '0', 'important');
    };
    requestAnimationFrame(fix);
  }, [settingsOpen, isFloating]);

  React.useEffect(() => {
    const syncFsIcons = () => {
      const shortsContainer = document.querySelector('.shorts-page__container');
      const fsTarget = document.querySelector('.player-fullscreen-target');
      const fsEl = getFullscreenElement();
      const isFs = (!!fsTarget && fsEl === fsTarget) || (!!shortsContainer && fsEl === shortsContainer);
      setIsFullscreen(isFs);
      if (fsEnterIconRef.current) fsEnterIconRef.current.style.display = isFs ? 'none' : '';
      if (fsExitIconRef.current) fsExitIconRef.current.style.display = isFs ? '' : 'none';
    };
    syncFsIcons();
    onFullscreenChange(document, 'add', syncFsIcons);
    return () => onFullscreenChange(document, 'remove', syncFsIcons);
  }, [isFullscreen]);

  return (
    <Player.Container
      className={`media-default-skin media-default-skin--video odysee-skin ${isCasting ? 'odysee-skin--casting' : ''} ${
        className || ''
      }`}
      {...rest}
    >
      {children}

      <ClickToPlay onTogglePlay={isCasting ? castTogglePlay : undefined} />

      {isCasting &&
        castState &&
        castState.deviceName &&
        (isMobileDevice ? (
          <div className="odysee-cast-indicator odysee-cast-indicator--mobile">
            <OdyseeCast />
            <span>{castState.deviceName}</span>
          </div>
        ) : (
          <div className="odysee-cast-indicator">
            <span className="odysee-cast-indicator__label">
              <OdyseeCast />
              <span>{__('Casting to')}</span>
            </span>
            <span className="odysee-cast-indicator__device">{castState.deviceName}</span>
            <button type="button" className="odysee-cast-indicator__stop" onClick={onCastToggle}>
              {__('End Casting')}
            </button>
          </div>
        ))}

      <BufferingIndicator
        render={(p) => (
          <div {...p} className="media-buffering-indicator">
            <div className="media-spinner" />
          </div>
        )}
      />

      {/* Progress Bar — above the control bar */}
      <div className="odysee-progress-bar">
        {isCasting && castState ? (
          <CastProgressBar castState={castState} castActions={castActions} />
        ) : (
          <TimeSlider.Root className="media-slider media-slider--time odysee-time-slider">
            <Slider.Track className="media-slider__track odysee-slider__track">
              <Slider.Fill className="media-slider__fill odysee-slider__fill" />
              <Slider.Buffer className="media-slider__buffer odysee-slider__buffer" />
              {chapters.length > 0 && <ChapterMarkers chapters={chapters} />}
            </Slider.Track>
            <Slider.Thumb className="media-slider__thumb odysee-slider__thumb" />
            <Slider.Preview className="odysee-slider-preview">
              {!isVerticalVideo ? (
                <div className="odysee-slider-preview__thumbnail-frame">
                  <Slider.Thumbnail className="odysee-slider-preview__thumbnail" />
                </div>
              ) : (
                <Slider.Thumbnail className="odysee-slider-preview__thumbnail" />
              )}
              {chapters.length > 0 && (
                <Slider.Value
                  type="pointer"
                  format={chapterFormatFn(chapters)}
                  className="odysee-slider-preview__chapter"
                />
              )}
              <Slider.Value
                type="pointer"
                className="odysee-slider-preview__time"
                format={isLivestream ? liveTimeFormat : undefined}
              />
            </Slider.Preview>
          </TimeSlider.Root>
        )}
      </div>

      <Controls.Root
        className={`media-controls ${
          isMobileDevice || (isMobileSize && isFullscreen) ? 'odysee-mobile-controls' : 'odysee-controls-row'
        }`}
      >
        {isMobileDevice || (isMobileSize && isFullscreen) ? (
          <>
            <div className="media-surface odysee-mobile-controls__top">
              <CaptionsButton
                render={(p) => (
                  <Btn {...p} className="media-button--icon media-button--captions">
                    <svg
                      className="media-icon media-icon--captions-off"
                      xmlns="http://www.w3.org/2000/svg"
                      width={18}
                      height={18}
                      fill="none"
                      aria-hidden="true"
                      viewBox="0 0 18 18"
                    >
                      <rect
                        width={16.5}
                        height={12.5}
                        x={0.75}
                        y={2.75}
                        stroke="currentColor"
                        strokeWidth={1.5}
                        rx={3}
                      />
                      <rect width={3} height={1.5} x={3} y={8.5} fill="currentColor" rx={0.75} />
                      <rect width={2} height={1.5} x={13} y={8.5} fill="currentColor" rx={0.75} />
                      <rect width={4} height={1.5} x={11} y={11.5} fill="currentColor" rx={0.75} />
                      <rect width={5} height={1.5} x={7} y={8.5} fill="currentColor" rx={0.75} />
                      <rect width={7} height={1.5} x={3} y={11.5} fill="currentColor" rx={0.75} />
                    </svg>
                    <svg
                      className="media-icon media-icon--captions-on"
                      xmlns="http://www.w3.org/2000/svg"
                      width={18}
                      height={18}
                      fill="none"
                      aria-hidden="true"
                      viewBox="0 0 18 18"
                    >
                      <path
                        fill="currentColor"
                        d="M15 2a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3zM3.75 11.5a.75.75 0 0 0 0 1.5h5.5a.75.75 0 0 0 0-1.5zm8 0a.75.75 0 0 0 0 1.5h2.5a.75.75 0 0 0 0-1.5zm-8-3a.75.75 0 0 0 0 1.5h1.5a.75.75 0 0 0 0-1.5zm4 0a.75.75 0 0 0 0 1.5h3.5a.75.75 0 0 0 0-1.5zm6 0a.75.75 0 0 0 0 1.5h.5a.75.75 0 0 0 0-1.5z"
                      />
                    </svg>
                  </Btn>
                )}
              />

              {isFullscreen && (
                <>
                  <button
                    type="button"
                    className={`media-button media-button--icon ${
                      activePanel === 'info' ? 'media-button--active' : ''
                    }`}
                    onClick={() =>
                      window.dispatchEvent(new CustomEvent('fullscreen-panel', { detail: { mode: 'info' } }))
                    }
                  >
                    <OdyseeInfo size={18} color="currentColor" />
                  </button>
                  {chapters.length > 0 && (
                    <button
                      type="button"
                      className={`media-button media-button--icon ${
                        activePanel === 'chapters' ? 'media-button--active' : ''
                      }`}
                      onClick={() =>
                        window.dispatchEvent(new CustomEvent('fullscreen-panel', { detail: { mode: 'chapters' } }))
                      }
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width={18}
                        height={18}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="8" y1="6" x2="21" y2="6" />
                        <line x1="8" y1="12" x2="21" y2="12" />
                        <line x1="8" y1="18" x2="21" y2="18" />
                        <line x1="3" y1="6" x2="3.01" y2="6" />
                        <line x1="3" y1="12" x2="3.01" y2="12" />
                        <line x1="3" y1="18" x2="3.01" y2="18" />
                      </svg>
                    </button>
                  )}
                  <button
                    type="button"
                    className={`media-button media-button--icon ${
                      activePanel === 'comments' || activePanel === 'chat' ? 'media-button--active' : ''
                    }`}
                    onClick={() =>
                      window.dispatchEvent(new CustomEvent('fullscreen-panel', { detail: { mode: 'comments' } }))
                    }
                  >
                    {isLivestream ? (
                      <OdyseeChat size={18} color="currentColor" />
                    ) : (
                      <OdyseeCommentsList size={18} color="currentColor" />
                    )}
                  </button>
                  <button
                    type="button"
                    className={`media-button media-button--icon ${
                      activePanel === 'related' ? 'media-button--active' : ''
                    }`}
                    onClick={() =>
                      window.dispatchEvent(new CustomEvent('fullscreen-panel', { detail: { mode: 'related' } }))
                    }
                  >
                    <OdyseeDiscover size={18} color="currentColor" />
                  </button>
                </>
              )}

              <Popover.Root side="bottom" open={settingsOpen} onOpenChange={(open) => setSettingsOpen(open)}>
                <Popover.Trigger
                  render={
                    <button
                      type="button"
                      className={`media-button media-button--icon media-button--settings ${
                        settingsOpen ? 'media-button--settings-open' : ''
                      }`}
                      aria-label={__('Settings')}
                    >
                      <OdyseeSettings className="media-icon media-icon--settings" size={18} color="currentColor" />
                      {(quality.isHD || (quality.levels.length === 0 && (originalVideoHeight || 0) >= 720)) && (
                        <span className="media-hd-badge">HD</span>
                      )}
                    </button>
                  }
                />
                <Popover.Popup className="media-popover media-popover--settings">
                  <SettingsMenuContent
                    isMarkdownOrComment={isMarkdownOrComment}
                    isLivestream={Boolean(isLivestream)}
                    onToggleAutoplayNext={onToggleAutoplayNext}
                    autoplayNext={autoplayNext}
                    floatingPlayer={floatingPlayer}
                    onToggleFloatingPlayer={onToggleFloatingPlayer}
                    autoplayMedia={autoplayMedia}
                    onToggleAutoplayMedia={onToggleAutoplayMedia}
                    title={title}
                    onShowShortcuts={() => setShowShortcuts(true)}
                    onCloseMenu={() => setSettingsOpen(false)}
                    quality={quality}
                    isFloating={isFloating}
                    embedded={embedded}
                    isCasting={isCasting}
                  />
                </Popover.Popup>
              </Popover.Root>
            </div>

            <div className="odysee-mobile-controls__bottom">
              <div className="media-surface odysee-mobile-controls__time">
                {isCasting && castState ? (
                  <Btn
                    className="media-button--icon media-button--mute"
                    onClick={() => castActions && castActions.toggleMute()}
                  >
                    {castState.isMuted ? (
                      <OdyseeVolumeMuted className="media-icon" size={18} color="currentColor" />
                    ) : (
                      <svg
                        className="media-icon"
                        xmlns="http://www.w3.org/2000/svg"
                        width={18}
                        height={18}
                        fill="none"
                        aria-hidden="true"
                        viewBox="0 0 18 18"
                      >
                        <path
                          fill="currentColor"
                          d="M15.6 3.3c-.4-.4-1-.4-1.4 0s-.4 1 0 1.4C15.4 5.9 16 7.4 16 9s-.6 3.1-1.8 4.3c-.4.4-.4 1 0 1.4.2.2.5.3.7.3.3 0 .5-.1.7-.3C17.1 13.2 18 11.2 18 9s-.9-4.2-2.4-5.7"
                        />
                        <path
                          fill="currentColor"
                          d="M.714 6.008h3.072l4.071-3.857c.5-.376 1.143 0 1.143.601V15.28c0 .602-.643.903-1.143.602l-4.071-3.858H.714c-.428 0-.714-.3-.714-.752V6.76c0-.451.286-.752.714-.752m10.568.59a.91.91 0 0 1 0-1.316.91.91 0 0 1 1.316 0c1.203 1.203 1.47 2.216 1.522 3.208q.012.255.011.51c0 1.16-.358 2.733-1.533 3.803a.7.7 0 0 1-.298.156c-.382.106-.873-.011-1.018-.156a.91.91 0 0 1 0-1.316c.57-.57.995-1.551.995-2.487 0-.944-.26-1.667-.995-2.402"
                        />
                      </svg>
                    )}
                  </Btn>
                ) : (
                  <MuteButton
                    render={(p) => (
                      <Btn {...p} className="media-button--icon media-button--mute">
                        <OdyseeVolumeMuted
                          className="media-icon media-icon--volume-off"
                          size={18}
                          color="currentColor"
                        />
                        <svg
                          className="media-icon media-icon--volume-high"
                          xmlns="http://www.w3.org/2000/svg"
                          width={18}
                          height={18}
                          fill="none"
                          aria-hidden="true"
                          viewBox="0 0 18 18"
                        >
                          <path
                            fill="currentColor"
                            d="M15.6 3.3c-.4-.4-1-.4-1.4 0s-.4 1 0 1.4C15.4 5.9 16 7.4 16 9s-.6 3.1-1.8 4.3c-.4.4-.4 1 0 1.4.2.2.5.3.7.3.3 0 .5-.1.7-.3C17.1 13.2 18 11.2 18 9s-.9-4.2-2.4-5.7"
                          />
                          <path
                            fill="currentColor"
                            d="M.714 6.008h3.072l4.071-3.857c.5-.376 1.143 0 1.143.601V15.28c0 .602-.643.903-1.143.602l-4.071-3.858H.714c-.428 0-.714-.3-.714-.752V6.76c0-.451.286-.752.714-.752m10.568.59a.91.91 0 0 1 0-1.316.91.91 0 0 1 1.316 0c1.203 1.203 1.47 2.216 1.522 3.208q.012.255.011.51c0 1.16-.358 2.733-1.533 3.803a.7.7 0 0 1-.298.156c-.382.106-.873-.011-1.018-.156a.91.91 0 0 1 0-1.316c.57-.57.995-1.551.995-2.487 0-.944-.26-1.667-.995-2.402"
                          />
                        </svg>
                      </Btn>
                    )}
                  />
                )}
                {isCasting && castState ? (
                  <span className="media-time">
                    <span className="media-time__value">{formatCastTime(castState.currentTime)}</span>
                    <span className="media-time__separator">/</span>
                    <span className="media-time__value">{formatCastTime(castState.duration)}</span>
                  </span>
                ) : isLivestream ? (
                  <LiveButton />
                ) : (
                  <Time.Group className="media-time" onClick={() => setShowRemaining((v) => !v)}>
                    <Time.Value type={showRemaining ? 'remaining' : 'current'} className="media-time__value" />
                    <Time.Separator className="media-time__separator" />
                    <Time.Value type="duration" className="media-time__value" />
                  </Time.Group>
                )}
              </div>

              <div className="media-surface odysee-mobile-controls__fs">
                {castAvailable && onCastToggle && (
                  <Btn
                    className={`media-button--icon media-button--cast ${isCasting ? 'media-button--cast-active' : ''}`}
                    aria-label={isCasting ? 'Stop casting' : 'Cast'}
                    onClick={(e) => {
                      e.stopPropagation();
                      onCastToggle();
                    }}
                  >
                    <svg
                      className="media-icon"
                      xmlns="http://www.w3.org/2000/svg"
                      width={19}
                      height={19}
                      fill="none"
                      stroke="#fff"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M2 8v-3a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" />
                      <path d="M2 16a5 5 0 0 1 5 5M2 12a9 9 0 0 1 9 9" />
                      <circle cx={2} cy={20} r={1.5} fill="#fff" stroke="none" />
                    </svg>
                  </Btn>
                )}
                <Btn
                  type="button"
                  className="media-button--icon media-button--fullscreen"
                  aria-label="Fullscreen"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (getFullscreenElement()) {
                      exitFullscreen();
                    } else {
                      const target = embedded
                        ? e.currentTarget.closest('.video-js-parent')
                        : e.currentTarget.closest('.player-fullscreen-target');
                      if (target) requestFullscreen(target);
                    }
                  }}
                >
                  <svg
                    ref={fsEnterIconRef}
                    className="media-icon"
                    xmlns="http://www.w3.org/2000/svg"
                    width={18}
                    height={18}
                    fill="none"
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                  </svg>
                  <svg
                    ref={fsExitIconRef}
                    className="media-icon"
                    style={{ display: 'none' }}
                    xmlns="http://www.w3.org/2000/svg"
                    width={18}
                    height={18}
                    fill="none"
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 14h6v6m10-10h-6V4M14 10l7-7M3 21l7-7" />
                  </svg>
                </Btn>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="odysee-controls-group--left">
              <div className="media-surface odysee-controls odysee-controls--left">
                {!isMarkdownOrComment && canPlayPrevious && onPlayPrevious && (
                  <Tooltip.Root side="top">
                    <Tooltip.Trigger
                      render={
                        <button type="button" className="media-button media-button--icon" onClick={onPlayPrevious}>
                          <OdyseePlayPrevious className="media-icon" size={18} color="currentColor" />
                        </button>
                      }
                    />
                    <Tooltip.Popup className="media-tooltip">{__('Play Previous (SHIFT+P)')}</Tooltip.Popup>
                  </Tooltip.Root>
                )}

                {isCasting && castState ? (
                  castState.playerState !== 'PLAYING' && castState.playerState !== 'PAUSED' ? (
                    <Btn className="media-button--icon media-button--play">
                      <div className="odysee-cast-spinner" />
                    </Btn>
                  ) : (
                    <Tooltip.Root side="top">
                      <Tooltip.Trigger
                        render={
                          <Btn className="media-button--icon media-button--play" onClick={castTogglePlay}>
                            {castState.isPaused ? (
                              <OdyseePlay className="media-icon" size={18} color="currentColor" />
                            ) : (
                              <svg
                                className="media-icon"
                                xmlns="http://www.w3.org/2000/svg"
                                width={18}
                                height={18}
                                fill="none"
                                aria-hidden="true"
                                viewBox="0 0 18 18"
                              >
                                <rect width={4} height={12} x={3} y={3} fill="currentColor" rx={1.75} />
                                <rect width={4} height={12} x={11} y={3} fill="currentColor" rx={1.75} />
                              </svg>
                            )}
                          </Btn>
                        }
                      />
                      <Tooltip.Popup className="media-tooltip">
                        {castState.isPaused ? __('Play (space)') : __('Pause (space)')}
                      </Tooltip.Popup>
                    </Tooltip.Root>
                  )
                ) : (
                  <Tooltip.Root side="top">
                    <Tooltip.Trigger
                      render={
                        <PlayButton
                          render={(p) => (
                            <Btn {...p} className="media-button--icon media-button--play">
                              <OdyseeReplay className="media-icon media-icon--restart" size={18} color="currentColor" />
                              <OdyseePlay className="media-icon media-icon--play" size={18} color="currentColor" />
                              <svg
                                className="media-icon media-icon--pause"
                                xmlns="http://www.w3.org/2000/svg"
                                width={18}
                                height={18}
                                fill="none"
                                aria-hidden="true"
                                viewBox="0 0 18 18"
                              >
                                <rect width={4} height={12} x={3} y={3} fill="currentColor" rx={1.75} />
                                <rect width={4} height={12} x={11} y={3} fill="currentColor" rx={1.75} />
                              </svg>
                            </Btn>
                          )}
                        />
                      }
                    />
                    <Tooltip.Popup className="media-tooltip">
                      <PlayLabel />
                    </Tooltip.Popup>
                  </Tooltip.Root>
                )}

                {!isMarkdownOrComment && canPlayNext && onPlayNext && (
                  <Tooltip.Root side="top">
                    <Tooltip.Trigger
                      render={
                        <button
                          type="button"
                          className="media-button media-button--icon"
                          onClick={() => onPlayNext({ manual: true })}
                        >
                          <OdyseePlayPrevious
                            className="media-icon"
                            size={18}
                            color="currentColor"
                            style={{ transform: 'scaleX(-1)' }}
                          />
                        </button>
                      }
                    />
                    <Tooltip.Popup className="media-tooltip">{__('Play Next (SHIFT+N)')}</Tooltip.Popup>
                  </Tooltip.Root>
                )}

                <div className="media-volume-group">
                  {isCasting && castState ? (
                    <Btn
                      className="media-button--icon media-button--mute"
                      onClick={() => castActions && castActions.toggleMute()}
                    >
                      {castState.isMuted ? (
                        <OdyseeVolumeMuted className="media-icon" size={18} color="currentColor" />
                      ) : (
                        <svg
                          className="media-icon"
                          xmlns="http://www.w3.org/2000/svg"
                          width={18}
                          height={18}
                          fill="none"
                          aria-hidden="true"
                          viewBox="0 0 18 18"
                        >
                          <path
                            fill="currentColor"
                            d="M15.6 3.3c-.4-.4-1-.4-1.4 0s-.4 1 0 1.4C15.4 5.9 16 7.4 16 9s-.6 3.1-1.8 4.3c-.4.4-.4 1 0 1.4.2.2.5.3.7.3.3 0 .5-.1.7-.3C17.1 13.2 18 11.2 18 9s-.9-4.2-2.4-5.7"
                          />
                          <path
                            fill="currentColor"
                            d="M.714 6.008h3.072l4.071-3.857c.5-.376 1.143 0 1.143.601V15.28c0 .602-.643.903-1.143.602l-4.071-3.858H.714c-.428 0-.714-.3-.714-.752V6.76c0-.451.286-.752.714-.752m10.568.59a.91.91 0 0 1 0-1.316.91.91 0 0 1 1.316 0c1.203 1.203 1.47 2.216 1.522 3.208q.012.255.011.51c0 1.16-.358 2.733-1.533 3.803a.7.7 0 0 1-.298.156c-.382.106-.873-.011-1.018-.156a.91.91 0 0 1 0-1.316c.57-.57.995-1.551.995-2.487 0-.944-.26-1.667-.995-2.402"
                          />
                        </svg>
                      )}
                    </Btn>
                  ) : (
                    <MuteButton
                      render={(p) => (
                        <Btn {...p} className="media-button--icon media-button--mute">
                          <OdyseeVolumeMuted
                            className="media-icon media-icon--volume-off"
                            size={18}
                            color="currentColor"
                          />
                          <svg
                            className="media-icon media-icon--volume-low"
                            xmlns="http://www.w3.org/2000/svg"
                            width={18}
                            height={18}
                            fill="none"
                            aria-hidden="true"
                            viewBox="0 0 18 18"
                          >
                            <path
                              fill="currentColor"
                              d="M.714 6.008h3.072l4.071-3.857c.5-.376 1.143 0 1.143.601V15.28c0 .602-.643.903-1.143.602l-4.071-3.858H.714c-.428 0-.714-.3-.714-.752V6.76c0-.451.286-.752.714-.752m10.568.59a.91.91 0 0 1 0-1.316.91.91 0 0 1 1.316 0c1.203 1.203 1.47 2.216 1.522 3.208q.012.255.011.51c0 1.16-.358 2.733-1.533 3.803a.7.7 0 0 1-.298.156c-.382.106-.873-.011-1.018-.156a.91.91 0 0 1 0-1.316c.57-.57.995-1.551.995-2.487 0-.944-.26-1.667-.995-2.402"
                            />
                          </svg>
                          <svg
                            className="media-icon media-icon--volume-high"
                            xmlns="http://www.w3.org/2000/svg"
                            width={18}
                            height={18}
                            fill="none"
                            aria-hidden="true"
                            viewBox="0 0 18 18"
                          >
                            <path
                              fill="currentColor"
                              d="M15.6 3.3c-.4-.4-1-.4-1.4 0s-.4 1 0 1.4C15.4 5.9 16 7.4 16 9s-.6 3.1-1.8 4.3c-.4.4-.4 1 0 1.4.2.2.5.3.7.3.3 0 .5-.1.7-.3C17.1 13.2 18 11.2 18 9s-.9-4.2-2.4-5.7"
                            />
                            <path
                              fill="currentColor"
                              d="M.714 6.008h3.072l4.071-3.857c.5-.376 1.143 0 1.143.601V15.28c0 .602-.643.903-1.143.602l-4.071-3.858H.714c-.428 0-.714-.3-.714-.752V6.76c0-.451.286-.752.714-.752m10.568.59a.91.91 0 0 1 0-1.316.91.91 0 0 1 1.316 0c1.203 1.203 1.47 2.216 1.522 3.208q.012.255.011.51c0 1.16-.358 2.733-1.533 3.803a.7.7 0 0 1-.298.156c-.382.106-.873-.011-1.018-.156a.91.91 0 0 1 0-1.316c.57-.57.995-1.551.995-2.487 0-.944-.26-1.667-.995-2.402"
                            />
                          </svg>
                        </Btn>
                      )}
                    />
                  )}
                  {!isShorts &&
                    (isCasting && castState ? (
                      <CastVolumeSlider castState={castState} castActions={castActions} />
                    ) : (
                      <VolumeSlider.Root
                        className="media-slider media-volume-slider"
                        orientation="horizontal"
                        thumbAlignment="edge"
                      >
                        <Slider.Track className="media-slider__track">
                          <Slider.Fill className="media-slider__fill" />
                        </Slider.Track>
                        <Slider.Thumb className="media-slider__thumb" />
                      </VolumeSlider.Root>
                    ))}
                </div>

                {isCasting && castState ? (
                  <span className="media-time">
                    <span className="media-time__value">{formatCastTime(castState.currentTime)}</span>
                    <span className="media-time__separator">/</span>
                    <span className="media-time__value">{formatCastTime(castState.duration)}</span>
                  </span>
                ) : isLivestream ? (
                  <LiveButton />
                ) : (
                  <Time.Group className="media-time" onClick={() => setShowRemaining((v) => !v)}>
                    <Time.Value type={showRemaining ? 'remaining' : 'current'} className="media-time__value" />
                    <Time.Separator className="media-time__separator" />
                    <Time.Value type="duration" className="media-time__value" />
                  </Time.Group>
                )}
              </div>

              {chapters.length > 0 && !isFloating && <ChapterPill chapters={chapters} />}
            </div>

            <div className="media-surface odysee-controls odysee-controls--right">
              <Tooltip.Root side="top">
                <Tooltip.Trigger
                  render={
                    <CaptionsButton
                      render={(p) => (
                        <Btn {...p} className="media-button--icon media-button--captions">
                          <svg
                            className="media-icon media-icon--captions-off"
                            xmlns="http://www.w3.org/2000/svg"
                            width={18}
                            height={18}
                            fill="none"
                            aria-hidden="true"
                            viewBox="0 0 18 18"
                          >
                            <rect
                              width={16.5}
                              height={12.5}
                              x={0.75}
                              y={2.75}
                              stroke="currentColor"
                              strokeWidth={1.5}
                              rx={3}
                            />
                            <rect width={3} height={1.5} x={3} y={8.5} fill="currentColor" rx={0.75} />
                            <rect width={2} height={1.5} x={13} y={8.5} fill="currentColor" rx={0.75} />
                            <rect width={4} height={1.5} x={11} y={11.5} fill="currentColor" rx={0.75} />
                            <rect width={5} height={1.5} x={7} y={8.5} fill="currentColor" rx={0.75} />
                            <rect width={7} height={1.5} x={3} y={11.5} fill="currentColor" rx={0.75} />
                          </svg>
                          <svg
                            className="media-icon media-icon--captions-on"
                            xmlns="http://www.w3.org/2000/svg"
                            width={18}
                            height={18}
                            fill="none"
                            aria-hidden="true"
                            viewBox="0 0 18 18"
                          >
                            <path
                              fill="currentColor"
                              d="M15 2a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3zM3.75 11.5a.75.75 0 0 0 0 1.5h5.5a.75.75 0 0 0 0-1.5zm8 0a.75.75 0 0 0 0 1.5h2.5a.75.75 0 0 0 0-1.5zm-8-3a.75.75 0 0 0 0 1.5h1.5a.75.75 0 0 0 0-1.5zm4 0a.75.75 0 0 0 0 1.5h3.5a.75.75 0 0 0 0-1.5zm6 0a.75.75 0 0 0 0 1.5h.5a.75.75 0 0 0 0-1.5z"
                            />
                          </svg>
                        </Btn>
                      )}
                    />
                  }
                />
                <Tooltip.Popup className="media-tooltip">
                  <CaptionsLabel />
                </Tooltip.Popup>
              </Tooltip.Root>

              <Popover.Root side="top" open={settingsOpen} onOpenChange={(open) => setSettingsOpen(open)}>
                <Popover.Trigger
                  render={
                    <button
                      type="button"
                      className={`media-button media-button--icon media-button--settings ${
                        settingsOpen ? 'media-button--settings-open' : ''
                      }`}
                      aria-label={__('Settings')}
                    >
                      <OdyseeSettings className="media-icon media-icon--settings" size={18} color="currentColor" />
                      {(quality.isHD || (quality.levels.length === 0 && (originalVideoHeight || 0) >= 720)) && (
                        <span className="media-hd-badge">HD</span>
                      )}
                    </button>
                  }
                />
                <Popover.Popup className="media-popover media-popover--settings">
                  <SettingsMenuContent
                    isMarkdownOrComment={isMarkdownOrComment}
                    isLivestream={Boolean(isLivestream)}
                    onToggleAutoplayNext={onToggleAutoplayNext}
                    autoplayNext={autoplayNext}
                    floatingPlayer={floatingPlayer}
                    onToggleFloatingPlayer={onToggleFloatingPlayer}
                    autoplayMedia={autoplayMedia}
                    onToggleAutoplayMedia={onToggleAutoplayMedia}
                    title={title}
                    onShowShortcuts={() => setShowShortcuts(true)}
                    onCloseMenu={() => setSettingsOpen(false)}
                    quality={quality}
                    isFloating={isFloating}
                    embedded={embedded}
                    isCasting={isCasting}
                  />
                </Popover.Popup>
              </Popover.Root>

              {castAvailable && onCastToggle && (
                <Tooltip.Root side="top">
                  <Tooltip.Trigger
                    render={
                      <Btn
                        className={`media-button--icon media-button--cast ${
                          isCasting ? 'media-button--cast-active' : ''
                        }`}
                        aria-label={isCasting ? 'Stop casting' : 'Cast'}
                        onClick={onCastToggle}
                      >
                        <svg
                          className="media-icon"
                          xmlns="http://www.w3.org/2000/svg"
                          width={19}
                          height={19}
                          fill="none"
                          stroke="#fff"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path d="M2 8v-3a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" />
                          <path d="M2 16a5 5 0 0 1 5 5M2 12a9 9 0 0 1 9 9" />
                          <circle cx={2} cy={20} r={1.5} fill="#fff" stroke="none" />
                        </svg>
                      </Btn>
                    }
                  />
                  <Tooltip.Popup className="media-tooltip">{isCasting ? __('Stop Casting') : __('Cast')}</Tooltip.Popup>
                </Tooltip.Root>
              )}

              {!isMarkdownOrComment && !embedded && !isFloating && onToggleTheaterMode && (
                <Tooltip.Root side="top">
                  <Tooltip.Trigger
                    render={
                      <button
                        type="button"
                        className="media-button media-button--icon media-button--theater"
                        onClick={onToggleTheaterMode}
                      >
                        <span
                          className={`media-icon media-icon--theater ${
                            videoTheaterMode ? 'media-icon--theater-active' : ''
                          }`}
                        />
                      </button>
                    }
                  />
                  <Tooltip.Popup className="media-tooltip">
                    {videoTheaterMode ? __('Default Mode (t)') : __('Theater Mode (t)')}
                  </Tooltip.Popup>
                </Tooltip.Root>
              )}

              <Tooltip.Root side="top">
                <Tooltip.Trigger
                  render={
                    <Btn
                      type="button"
                      className="media-button--icon media-button--fullscreen"
                      aria-label="Fullscreen"
                      onClick={(e) => {
                        if (getFullscreenElement()) {
                          exitFullscreen();
                        } else {
                          const target = e.currentTarget.closest(
                            embedded ? '.video-js-parent' : '.player-fullscreen-target'
                          );
                          if (target) requestFullscreen(target);
                        }
                      }}
                    >
                      <svg
                        ref={fsEnterIconRef}
                        className="media-icon"
                        xmlns="http://www.w3.org/2000/svg"
                        width={18}
                        height={18}
                        fill="none"
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                      </svg>
                      <svg
                        ref={fsExitIconRef}
                        className="media-icon"
                        style={{ display: 'none' }}
                        xmlns="http://www.w3.org/2000/svg"
                        width={18}
                        height={18}
                        fill="none"
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M4 14h6v6m10-10h-6V4M14 10l7-7M3 21l7-7" />
                      </svg>
                    </Btn>
                  }
                />
                <Tooltip.Popup className="media-tooltip">{__('Fullscreen (f)')}</Tooltip.Popup>
              </Tooltip.Root>
            </div>
          </>
        )}
      </Controls.Root>

      {!embedded && <div className="media-overlay" />}

      {embedded && (
        <div className="odysee-embed-header">
          <a
            className="odysee-embed-header__title"
            href={uri ? URL + formatLbryUrlForWeb(uri) : URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            {title}
          </a>
          <a className="odysee-embed-header__logo" href={URL} target="_blank" rel="noopener noreferrer">
            <Logo type="embed" />
          </a>
        </div>
      )}

      <SeekIndicator />

      {showShortcuts && <KeyboardShortcutsOverlay onClose={() => setShowShortcuts(false)} />}
    </Player.Container>
  );
}
