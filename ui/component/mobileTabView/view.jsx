// @flow
import * as React from 'react';
import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';
import { fullscreenElement as getFullscreenElement, onFullscreenChange } from 'util/full-screen';

type TabDef = { icon: string, label: string };

type Props = {
  infoContent: React.Node,
  chaptersContent?: React.Node,
  playlistContent?: React.Node,
  commentsContent: React.Node,
  relatedContent: React.Node,
  initialTab?: number,
  useDrawer?: boolean,
  drawerOpenRef?: { current: (index: number, instant?: boolean) => void },
  tabDefs?: Array<TabDef>,
  onTabChange?: (index: number) => void,
  onDrawerClose?: () => void,
};

const DRAWER_TRANSITION = 'transform 0.2s ease';
const SWIPE_THRESHOLD = 50;

let sharedActiveTab = 0;

export default function MobileTabView(props: Props) {
  const {
    infoContent,
    chaptersContent,
    playlistContent,
    commentsContent,
    relatedContent,
    initialTab = 0,
    useDrawer = false,
    drawerOpenRef,
    tabDefs: tabDefsProp,
    onTabChange,
    onDrawerClose,
  } = props;

  const trackRef = React.useRef<?HTMLDivElement>(null);
  const containerRef = React.useRef<?HTMLDivElement>(null);
  const sheetRef = React.useRef<?HTMLDivElement>(null);
  const [activeTab, setActiveTab] = React.useState(initialTab);
  const [panelHeight, setPanelHeight] = React.useState(0);
  const [drawerOpen, setDrawerOpen] = React.useState(useDrawer && initialTab !== 0);
  const didInitialScroll = React.useRef(false);
  const touchStartY = React.useRef(0);
  const isDragging = React.useRef(false);

  const preFsHeight = React.useRef(0);
  const preFsWidth = React.useRef(0);
  const skipMeasure = React.useRef(false);
  const swipeStartX = React.useRef(0);
  const swipeStartY = React.useRef(0);
  const swipeDeltaX = React.useRef(0);
  const swipeDirection = React.useRef<'none' | 'horizontal' | 'vertical'>('none');
  const activeTabRef = React.useRef(activeTab);

  React.useEffect(() => {
    sharedActiveTab = activeTab;
    activeTabRef.current = activeTab;
  }, [activeTab]);

  function getPanelWidth() {
    const track = trackRef.current;
    if (!track || !track.parentElement) return 0;
    // $FlowFixMe
    return track.parentElement.offsetWidth;
  }

  const goToTab = React.useCallback((index: number, animate: boolean = true) => {
    const track = trackRef.current;
    if (!track) return;
    const w = getPanelWidth();
    if (w === 0) return;
    track.style.transition = animate ? 'transform 0.25s ease-out' : 'none';
    track.style.transform = `translateX(${-index * w}px)`;
    setActiveTab(index);
  }, []);

  React.useEffect(() => {
    const onFsChange = () => {
      if (getFullscreenElement()) {
        if (useDrawer) setDrawerOpen(false);
        else {
          preFsHeight.current = panelHeight;
          preFsWidth.current = getPanelWidth();
        }
      } else if (!useDrawer) {
        if (preFsHeight.current > 0) {
          setPanelHeight(preFsHeight.current);
          skipMeasure.current = true;
          setTimeout(() => {
            skipMeasure.current = false;
          }, 500);
        }
        const track = trackRef.current;
        if (track && preFsWidth.current > 0) {
          track.style.transition = 'none';
          track.style.transform = `translateX(${-sharedActiveTab * preFsWidth.current}px)`;
          setActiveTab(sharedActiveTab);
        } else {
          goToTab(sharedActiveTab, false);
        }
      }
    };

    onFullscreenChange(document, 'add', onFsChange);
    return () => onFullscreenChange(document, 'remove', onFsChange);
  }, [useDrawer, goToTab, panelHeight]);

  React.useEffect(() => {
    if (useDrawer) return;

    function measure() {
      if (skipMeasure.current) return;
      const el = containerRef.current;
      if (el) {
        const top = el.getBoundingClientRect().top;
        setPanelHeight(window.innerHeight - top);
      }
      const track = trackRef.current;
      if (track) {
        const w = getPanelWidth();
        if (w > 0) {
          track.style.transition = 'none';
          track.style.transform = `translateX(${-activeTabRef.current * w}px)`;
        }
      }
    }

    measure();
    const t = setTimeout(measure, 500);
    window.addEventListener('resize', measure);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', measure);
    };
  }, [useDrawer]);

  const panels = React.useMemo(() => {
    const p = [infoContent];
    if (chaptersContent) p.push(chaptersContent);
    if (playlistContent) p.push(playlistContent);
    p.push(commentsContent, relatedContent);
    return p;
  }, [infoContent, chaptersContent, playlistContent, commentsContent, relatedContent]);

  const tabDefs = React.useMemo(() => {
    if (tabDefsProp) return tabDefsProp;
    const t = [{ icon: ICONS.INFO, label: 'Info' }];
    if (chaptersContent) t.push({ icon: ICONS.VIEW_LIST, label: 'Chapters' });
    if (playlistContent) t.push({ icon: ICONS.PLAYLIST, label: 'Playlist' });
    t.push({ icon: ICONS.COMMENTS_LIST, label: 'Comments' }, { icon: ICONS.DISCOVER, label: 'Related' });
    return t;
  }, [tabDefsProp, chaptersContent, playlistContent]);

  React.useEffect(() => {
    if (initialTab !== 0 && !didInitialScroll.current) {
      didInitialScroll.current = true;
      const delay = useDrawer ? 220 : 0;
      setTimeout(() => goToTab(initialTab, false), delay);
    }
  }, [initialTab, useDrawer, goToTab]);

  React.useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const onTouchStart = (e: TouchEvent) => {
      swipeStartX.current = e.touches[0].clientX;
      swipeStartY.current = e.touches[0].clientY;
      swipeDeltaX.current = 0;
      swipeDirection.current = 'none';
      track.style.transition = 'none';
    };

    const onTouchMove = (e: TouchEvent) => {
      const dx = e.touches[0].clientX - swipeStartX.current;
      const dy = e.touches[0].clientY - swipeStartY.current;

      if (swipeDirection.current === 'none') {
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
          swipeDirection.current = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
        }
      }

      if (swipeDirection.current === 'horizontal') {
        e.preventDefault();
        swipeDeltaX.current = dx;
        const w = getPanelWidth();
        const base = -activeTabRef.current * w;
        track.style.transform = `translateX(${base + dx}px)`;
      }
    };

    const onTouchEnd = () => {
      if (swipeDirection.current !== 'horizontal') return;

      const maxTab = tabDefs.length - 1;
      let newTab = activeTabRef.current;
      if (swipeDeltaX.current < -SWIPE_THRESHOLD && newTab < maxTab) {
        newTab++;
      } else if (swipeDeltaX.current > SWIPE_THRESHOLD && newTab > 0) {
        newTab--;
      }
      goToTab(newTab, true);
      if (onTabChange && newTab !== activeTabRef.current) onTabChange(newTab);
    };

    track.addEventListener('touchstart', onTouchStart, { passive: true });
    track.addEventListener('touchmove', onTouchMove, { passive: false });
    track.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      track.removeEventListener('touchstart', onTouchStart);
      track.removeEventListener('touchmove', onTouchMove);
      track.removeEventListener('touchend', onTouchEnd);
    };
  }, [useDrawer, tabDefs.length, goToTab, onTabChange]);

  function openToTab(index: number, instant?: boolean) {
    if (!instant && drawerOpen && index === activeTab) {
      setDrawerOpen(false);
      if (onDrawerClose) onDrawerClose();
      return;
    }

    setActiveTab(index);
    if (onTabChange) onTabChange(index);

    if (instant) {
      const sheet = sheetRef.current;
      if (sheet) {
        sheet.style.transition = 'none';
        sheet.classList.add('mobile-tab-view__sheet--open');
        void sheet.offsetHeight;
      }
      setDrawerOpen(true);
      goToTab(index, false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (sheet) sheet.style.transition = '';
        });
      });
    } else if (!drawerOpen) {
      setDrawerOpen(true);
      setTimeout(() => goToTab(index, false), 220);
    } else {
      goToTab(index, true);
    }
  }

  React.useEffect(() => {
    if (drawerOpenRef) {
      drawerOpenRef.current = openToTab;
    }
  });

  function handleTabClick(index: number) {
    if (useDrawer) {
      openToTab(index);
    } else {
      goToTab(index, true);
      if (onTabChange) onTabChange(index);
    }
  }

  const handleDrawerTouchStart = React.useCallback((e: TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = true;
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'none';
    }
  }, []);

  const handleDrawerTouchMove = React.useCallback((e: TouchEvent) => {
    if (!isDragging.current || !sheetRef.current) return;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    if (deltaY > 0) {
      sheetRef.current.style.transform = `translateY(${deltaY}px)`;
    }
  }, []);

  const handleDrawerTouchEnd = React.useCallback(
    (e: TouchEvent) => {
      if (!isDragging.current || !sheetRef.current) return;
      isDragging.current = false;
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;
      // $FlowFixMe
      const panelH = sheetRef.current.offsetHeight;
      // $FlowFixMe
      sheetRef.current.style.transition = DRAWER_TRANSITION;
      // $FlowFixMe
      sheetRef.current.style.transform = '';
      if (deltaY > panelH * 0.3) {
        setDrawerOpen(false);
        if (onDrawerClose) onDrawerClose();
      }
    },
    [onDrawerClose]
  );

  const containerStyle = !useDrawer && panelHeight > 0 ? { height: panelHeight } : undefined;

  const scrollContainer = (
    <div className="mobile-tab-view__scroll-container" style={containerStyle}>
      <div className="mobile-tab-view__track" ref={trackRef}>
        {panels.map((content, i) => (
          <div className="mobile-tab-view__panel" key={i}>
            {content}
          </div>
        ))}
      </div>
    </div>
  );

  const tabBar = (
    <nav className="mobile-tab-view__bar">
      {tabDefs.map((tab, i) => (
        <button
          key={tab.label}
          className={`mobile-tab-view__tab ${i === activeTab ? 'mobile-tab-view__tab--active' : ''}`}
          onClick={() => handleTabClick(i)}
          type="button"
        >
          <Icon icon={tab.icon} size={20} />
          <span className="mobile-tab-view__tab-label">{__(tab.label)}</span>
        </button>
      ))}
    </nav>
  );

  if (useDrawer) {
    return (
      <div className="mobile-tab-view mobile-tab-view--drawer">
        <div ref={sheetRef} className={`mobile-tab-view__sheet ${drawerOpen ? 'mobile-tab-view__sheet--open' : ''}`}>
          <div
            className="mobile-tab-view__sheet-header"
            onTouchStart={handleDrawerTouchStart}
            onTouchMove={handleDrawerTouchMove}
            onTouchEnd={handleDrawerTouchEnd}
          >
            <span className="mobile-tab-view__puller" />
          </div>

          {scrollContainer}
          {tabBar}
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-tab-view" ref={containerRef}>
      {scrollContainer}
      {tabBar}
    </div>
  );
}
