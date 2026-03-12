// @flow
import React from 'react';
import classnames from 'classnames';
import Card from 'component/common/card';
import Button from 'component/button';
import * as ICONS from 'constants/icons';
import parseChapters from 'util/parse-chapters';
import './style.lazy.scss';

type Props = {
  uri: string,
  description: ?string,
  visible: boolean,
  setVisible: (boolean) => void,
};

export default function ChaptersCard(props: Props) {
  const { description, visible, setVisible } = props;

  const chapters = React.useMemo(() => parseChapters(description), [description]);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const activeItemRef = React.useRef(null);
  const listRef = React.useRef<any>(null);

  React.useEffect(() => {
    function handleToggle() {
      setVisible(!visible);
    }
    window.addEventListener('toggleChaptersCard', handleToggle);
    return () => window.removeEventListener('toggleChaptersCard', handleToggle);
  }, [visible, setVisible]);

  React.useEffect(() => {
    if (chapters.length === 0) return;

    let currentPlayer = null;

    function onTimeUpdate() {
      const p = window.player;
      if (!p) return;
      const currentTime = p.currentTime();
      let idx = -1;
      for (let i = chapters.length - 1; i >= 0; i--) {
        if (currentTime >= chapters[i].time) {
          idx = i;
          break;
        }
      }
      setActiveIndex(idx);
    }

    function attach() {
      const p = window.player;
      if (!p) return;
      if (currentPlayer) {
        currentPlayer.off('timeupdate', onTimeUpdate);
        currentPlayer.off('seeked', onTimeUpdate);
      }
      currentPlayer = p;
      p.on('timeupdate', onTimeUpdate);
      p.on('seeked', onTimeUpdate);
      onTimeUpdate();
    }

    attach();
    window.addEventListener('playerReady', attach);

    return () => {
      window.removeEventListener('playerReady', attach);
      if (currentPlayer) {
        currentPlayer.off('timeupdate', onTimeUpdate);
        currentPlayer.off('seeked', onTimeUpdate);
      }
    };
  }, [chapters]);

  React.useEffect(() => {
    if (activeItemRef.current && listRef.current && visible) {
      const list = listRef.current;
      const item = activeItemRef.current;
      const listCenter = list.offsetHeight / 2;
      const topToScroll = item.offsetTop - list.offsetTop - listCenter;
      try {
        list.scrollTo({ top: topToScroll, behavior: 'smooth' });
      } catch (e) {}
    }
  }, [activeIndex, visible]);

  if (chapters.length === 0 || !visible) return null;

  function handleChapterClick(time, index) {
    setActiveIndex(index);
    if (window.player) {
      window.player.currentTime(time);
    } else {
      window.pendingSeekTime = time;
      const playButton = document.querySelector('.button--play');
      if (playButton) playButton.click();
    }
    window.scrollTo(0, 0);
  }

  return (
    <Card
      className="chapters-card"
      smallTitle
      slimHeader
      singlePane
      title={
        <span className="chapters-card__title">
          {__('Chapters')}
          <span className="chapters-card__count">{chapters.length}</span>
        </span>
      }
      titleActions={<Button className="button-toggle" icon={ICONS.REMOVE} onClick={() => setVisible(false)} />}
      body={
        <ul className="chapters-card__list" ref={listRef}>
          {chapters.map((chapter, i) => (
            <li
              key={i}
              ref={i === activeIndex ? activeItemRef : undefined}
              className={classnames('chapters-card__item', {
                'chapters-card__item--active': i === activeIndex,
              })}
            >
              <button className="chapters-card__button" onClick={() => handleChapterClick(chapter.time, i)}>
                <span className="chapters-card__timestamp">
                  <span>{chapter.timestamp}</span>
                </span>
                <span className="chapters-card__label">{chapter.label}</span>
              </button>
            </li>
          ))}
        </ul>
      }
    />
  );
}
