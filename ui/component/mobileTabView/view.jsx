// @flow
import * as React from 'react';
import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';

type Props = {
  infoContent: React.Node,
  commentsContent: React.Node,
  relatedContent: React.Node,
  initialTab?: number,
  useDrawer?: boolean,
  drawerOpenRef?: { current: (index: number) => void },
};

const TAB_DEFS = [
  { icon: ICONS.INFO, label: 'Info' },
  { icon: ICONS.COMMENTS_LIST, label: 'Comments' },
  { icon: ICONS.DISCOVER, label: 'Related' },
];

const BAR_HEIGHT = 56;
const DRAWER_TRANSITION = 'transform 0.2s ease';

let sharedActiveTab = 0;

export default function MobileTabView(props: Props) {
  const { infoContent, commentsContent, relatedContent, initialTab = 0, useDrawer = false, drawerOpenRef } = props;

  const scrollRef = React.useRef<?HTMLDivElement>(null);
  const containerRef = React.useRef<?HTMLDivElement>(null);
  const sheetRef = React.useRef<?HTMLDivElement>(null);
  const [activeTab, setActiveTab] = React.useState(initialTab);
  const [panelHeight, setPanelHeight] = React.useState(0);
  const [drawerOpen, setDrawerOpen] = React.useState(useDrawer && initialTab !== 0);
  const didInitialScroll = React.useRef(false);
  const touchStartY = React.useRef(0);
  const isDragging = React.useRef(false);

  React.useEffect(() => {
    sharedActiveTab = activeTab;
  }, [activeTab]);

  React.useEffect(() => {
    const onFsChange = () => {
      // $FlowFixMe
      if (document.fullscreenElement) {
        if (useDrawer) setDrawerOpen(false);
      } else if (!useDrawer) {
        const el = scrollRef.current;
        if (el) {
          // $FlowFixMe
          el.scrollTo({ left: sharedActiveTab * el.offsetWidth, behavior: 'auto' });
        }
      }
    };

    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, [useDrawer]);

  React.useEffect(() => {
    if (useDrawer) return;

    function measure() {
      const el = containerRef.current;
      if (el) {
        const top = el.getBoundingClientRect().top;
        setPanelHeight(window.innerHeight - top - BAR_HEIGHT);
      }
    }

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [useDrawer]);

  React.useEffect(() => {
    if (initialTab !== 0 && !didInitialScroll.current) {
      didInitialScroll.current = true;
      const delay = useDrawer ? 220 : 0;
      setTimeout(() => {
        const el = scrollRef.current;
        if (el) {
          // $FlowFixMe
          el.scrollTo({ left: initialTab * el.offsetWidth, behavior: 'auto' });
        }
      }, delay);
    }
  }, [initialTab, useDrawer]);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          const w = el.offsetWidth;
          if (w > 0) {
            setActiveTab(Math.round(el.scrollLeft / w));
          }
          ticking = false;
        });
      }
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  function openToTab(index: number) {
    if (drawerOpen && index === activeTab) {
      setDrawerOpen(false);
      return;
    }

    setActiveTab(index);

    if (!drawerOpen) {
      setDrawerOpen(true);
      setTimeout(() => {
        const el = scrollRef.current;
        if (el) {
          // $FlowFixMe
          el.scrollTo({ left: index * el.offsetWidth, behavior: 'auto' });
        }
      }, 220);
    } else {
      const el = scrollRef.current;
      if (el) {
        // $FlowFixMe
        el.scrollTo({ left: index * el.offsetWidth, behavior: 'smooth' });
      }
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
      const el = scrollRef.current;
      if (el) {
        // $FlowFixMe
        el.scrollTo({ left: index * el.offsetWidth, behavior: 'smooth' });
      }
    }
  }

  const handleTouchStart = React.useCallback((e: TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = true;
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'none';
    }
  }, []);

  const handleTouchMove = React.useCallback((e: TouchEvent) => {
    if (!isDragging.current || !sheetRef.current) return;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    if (deltaY > 0) {
      sheetRef.current.style.transform = `translateY(${deltaY}px)`;
    }
  }, []);

  const handleTouchEnd = React.useCallback((e: TouchEvent) => {
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
    }
  }, []);

  const panels = [infoContent, commentsContent, relatedContent];
  const panelStyle = !useDrawer && panelHeight > 0 ? { height: panelHeight } : undefined;

  const scrollContainer = (
    <div className="mobile-tab-view__scroll-container" ref={scrollRef}>
      {panels.map((content, i) => (
        <div className="mobile-tab-view__panel" key={i} style={panelStyle}>
          {content}
        </div>
      ))}
    </div>
  );

  const tabBar = (
    <nav className="mobile-tab-view__bar">
      {TAB_DEFS.map((tab, i) => (
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
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
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
