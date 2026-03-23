import React, { useLayoutEffect, useRef, useState } from 'react';
import classnames from 'classnames';
import { useOnResize } from 'effects/use-on-resize';

type TabsContextValue = {
  selectedIndex: number;
  onSelectTab: (index: number) => void;
};

const TabsContext = React.createContext<TabsContextValue>({
  selectedIndex: 0,
  onSelectTab: () => {},
});

type TabsProps = {
  index?: number;
  onChange?: (arg0: number) => void;
  children: React.ReactNode;
  className?: string;
};

function Tabs(props: TabsProps) {
  const [selectedRect, setSelectedRect] = useState(null);
  const [tabsRect, setTabsRect] = React.useState<DOMRect | null>(null);
  const [internalIndex, setInternalIndex] = React.useState(0);
  const tabsRef = useRef<HTMLDivElement | null>(null);
  const { children, className, index, onChange } = props;
  const selectedIndex = index === undefined ? internalIndex : index;

  const handleSelectTab = React.useCallback(
    (nextIndex: number) => {
      if (index === undefined) {
        setInternalIndex(nextIndex);
      }

      onChange?.(nextIndex);
    },
    [index, onChange]
  );

  const measureTabs = React.useCallback(() => {
    if (!tabsRef.current) {
      return;
    }

    const list = tabsRef.current.querySelector('[data-reach-tab-list]');
    const selectedTab = tabsRef.current.querySelector(`[data-tab-index="${selectedIndex}"]`);

    if (list instanceof HTMLElement) {
      setTabsRect(list.getBoundingClientRect());
    }

    if (selectedTab instanceof HTMLElement) {
      setSelectedRect(selectedTab.getBoundingClientRect());
    }
  }, []);

  useOnResize(measureTabs);
  useLayoutEffect(() => {
    measureTabs();
  }, [measureTabs, selectedIndex, children]);

  const contextValue = React.useMemo(
    () => ({ selectedIndex, onSelectTab: handleSelectTab }),
    [selectedIndex, handleSelectTab]
  );

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={classnames('tabs', className)} data-reach-tabs="" ref={tabsRef}>
        {children}

        <div
          className="tab__divider"
          style={{
            left: selectedRect && tabsRect ? selectedRect.left - tabsRect.left : undefined,
            width: selectedRect ? selectedRect.width : undefined,
          }}
        />
      </div>
    </TabsContext.Provider>
  );
}

type TabListProps = {
  children?: React.ReactNode;
  className?: string;
};

function TabList(props: TabListProps) {
  const { children, className } = props;
  const { selectedIndex, onSelectTab } = React.useContext(TabsContext);
  let tabIndex = 0;
  const tabs = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) {
      return child;
    }

    const currentIndex = tabIndex++;
    return React.cloneElement(child, {
      index: currentIndex,
      isSelected: selectedIndex === currentIndex,
      onSelectTab,
    });
  });

  return (
    <div className={classnames('tabs__list', className)} data-reach-tab-list="" role="tablist">
      {tabs}
    </div>
  );
}

type TabProps = {
  children?: React.ReactNode;
  index?: number;
  isSelected?: boolean;
  className?: string;
  onSelectTab?: (index: number) => void;
  [key: string]: any;
};

function Tab(props: TabProps) {
  const { children, className, index = 0, isSelected, onSelectTab, ...rest } = props;
  return (
    <button
      {...rest}
      type="button"
      role="tab"
      aria-selected={Boolean(isSelected)}
      data-reach-tab=""
      data-tab-index={index}
      className={classnames(
        'tab',
        {
          'tab--selected': isSelected,
        },
        className
      )}
      onClick={() => onSelectTab?.(index)}
    >
      {children}
    </button>
  );
}

type TabPanelsProps = {
  children?: React.ReactNode;
  header?: React.ReactNode;
};

function TabPanels(props: TabPanelsProps) {
  const { children, header } = props;
  const { selectedIndex } = React.useContext(TabsContext);
  const panels = React.Children.map(children, (child, index) => {
    if (!React.isValidElement(child)) {
      return child;
    }

    return React.cloneElement(child, {
      isSelected: selectedIndex === index,
    });
  });

  return (
    <div data-reach-tab-panels="">
      {header}
      {panels}
    </div>
  );
}

type TabPanelProps = {
  children?: React.ReactNode;
  isSelected?: boolean;
  className?: string;
};

function TabPanel(props: TabPanelProps) {
  const { children, className, isSelected } = props;

  return (
    <div
      data-reach-tab-panel=""
      role="tabpanel"
      className={className}
      hidden={!isSelected}
    >
      {isSelected ? children : null}
    </div>
  );
}

export { Tabs, TabList, Tab, TabPanels, TabPanel };
