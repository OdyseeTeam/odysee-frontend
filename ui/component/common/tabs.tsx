import React, { Fragment, useLayoutEffect, useRef, useState } from 'react';
import classnames from 'classnames';
import { useOnResize } from 'effects/use-on-resize';

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

  const clonedChildren = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) {
      return child;
    }

    if (child.type === TabList) {
      return React.cloneElement(child, {
        selectedIndex,
        onSelectTab: handleSelectTab,
      });
    }

    if (child.type === TabPanels) {
      return React.cloneElement(child, {
        selectedIndex,
      });
    }

    return child;
  });

  return (
    <div className={classnames('tabs', className)} data-reach-tabs="" ref={tabsRef}>
      {clonedChildren}

      <div
        className="tab__divider"
        style={{
          left: selectedRect && tabsRect ? selectedRect.left - tabsRect.left : undefined,
          width: selectedRect ? selectedRect.width : undefined,
        }}
      />
    </div>
  );
}

type TabListProps = {
  children?: React.ReactNode;
  className?: string;
  onSelectTab?: (index: number) => void;
  selectedIndex?: number;
};

function TabList(props: TabListProps) {
  const { children, className, onSelectTab, selectedIndex } = props;
  const tabs = React.Children.map(children, (child, index) => {
    if (!React.isValidElement(child)) {
      return child;
    }

    return React.cloneElement(child, {
      index,
      isSelected: selectedIndex === index,
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
  selectedIndex?: number;
};

function TabPanels(props: TabPanelsProps) {
  const { children, header, selectedIndex } = props;
  const panels = React.Children.map(children, (child, index) => {
    if (!React.isValidElement(child)) {
      return child;
    }

    return React.cloneElement(child, {
      index,
      isSelected: selectedIndex === index,
    });
  });

  return (
    <Fragment>
      {header}
      <div data-reach-tab-panels="">{panels}</div>
    </Fragment>
  );
}

type TabPanelProps = {
  children?: React.ReactNode;
  className?: string;
  index?: number;
  isSelected?: boolean;
};

function TabPanel(props: TabPanelProps) {
  const { children, className, index = 0, isSelected, ...rest } = props;

  return (
    <div
      {...rest}
      role="tabpanel"
      hidden={!isSelected}
      data-reach-tab-panel=""
      data-tab-panel-index={index}
      className={classnames('tab__panel', className)}
    >
      {children}
    </div>
  );
}

export { Tabs, TabList, Tab, TabPanels, TabPanel };
