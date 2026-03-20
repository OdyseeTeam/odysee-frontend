// @flow
import React, { useState, useEffect, useCallback } from 'react';
import Player from '../player';
import * as QUALITY_OPTIONS from 'constants/player';

type Props = {
  defaultQuality: ?string,
  originalVideoHeight: ?number,
  isLivestream: boolean,
  onQualityChanged: ?() => void,
};

export default function QualitySelector({
  defaultQuality,
  originalVideoHeight,
  isLivestream,
  onQualityChanged,
}: Props) {
  const media = Player.useMedia();
  const [levels, setLevels] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!media) return;

    // Access hls.js engine from the media element
    const hls = media.engine || media._hls;
    if (!hls || !hls.levels) return;

    const updateLevels = () => {
      if (hls.levels) {
        setLevels(hls.levels.map((l, i) => ({ height: l.height, index: i })));
        setCurrentLevel(hls.currentLevel);
      }
    };

    updateLevels();

    // hls.js events
    if (hls.on) {
      hls.on('hlsManifestParsed', updateLevels);
      hls.on('hlsLevelSwitched', () => setCurrentLevel(hls.currentLevel));
    }

    return () => {
      if (hls.off) {
        hls.off('hlsManifestParsed', updateLevels);
        hls.off('hlsLevelSwitched');
      }
    };
  }, [media]);

  const selectQuality = useCallback(
    (levelIndex) => {
      const hls = media?.engine || media?._hls;
      if (!hls) return;
      hls.currentLevel = levelIndex;
      setCurrentLevel(levelIndex);
      setIsOpen(false);
      if (onQualityChanged) onQualityChanged();
    },
    [media, onQualityChanged]
  );

  if (levels.length === 0 && !originalVideoHeight) return null;

  const currentLabel =
    currentLevel === -1
      ? QUALITY_OPTIONS.AUTO
      : levels[currentLevel]
      ? `${levels[currentLevel].height}p`
      : QUALITY_OPTIONS.AUTO;

  return (
    <div className="media-quality-selector">
      <button
        type="button"
        className="media-button media-button--icon media-button--quality"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="media-quality-label">{currentLabel}</span>
      </button>

      {isOpen && (
        <div className="media-quality-menu media-surface">
          {levels
            .slice()
            .sort((a, b) => a.height - b.height)
            .map((level) => (
              <button
                key={level.index}
                type="button"
                className={`media-quality-item ${currentLevel === level.index ? 'media-quality-item--selected' : ''}`}
                onClick={() => selectQuality(level.index)}
              >
                {level.height}p
              </button>
            ))}
          {!isLivestream && (
            <button
              type="button"
              className={`media-quality-item ${currentLevel === -2 ? 'media-quality-item--selected' : ''}`}
              onClick={() => {
                selectQuality(-2);
              }}
            >
              {__('Original')}
            </button>
          )}
          <button
            type="button"
            className={`media-quality-item ${currentLevel === -1 ? 'media-quality-item--selected' : ''}`}
            onClick={() => selectQuality(-1)}
          >
            {QUALITY_OPTIONS.AUTO}
          </button>
        </div>
      )}
    </div>
  );
}
