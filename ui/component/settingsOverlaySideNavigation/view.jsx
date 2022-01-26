// @flow
import * as PAGES from 'constants/pages';
import type { Node } from 'react';
import React from 'react';
import { useHistory } from 'react-router-dom';
import classnames from 'classnames';
import Button from 'component/button';
// @if TARGET='app'
import { IS_MAC } from 'component/app/view';
// @endif
import { useIsMediumScreen } from 'effects/use-screensize';

type SideNavLink = {
  title: string,
  link?: string,
  route?: string,
  section?: string,
  onClick?: () => any,
  icon: string,
  extra?: Node,
};

const SIDE_LINKS: Array<SideNavLink> = [
  {
    title: 'Chat Overlay',
    section: 'Chat Overlay',
  },
  {
    title: 'Stickers Overlay',
    section: 'Stickers Overlay',
  },
  {
    title: 'Viewer Count Overlay',
    section: 'Viewer Count Overlay',
  },
  {
    title: 'Tip Goal Overlay',
    section: 'Tip Goal Overlay',
  },
];

export default function settingsOverlaySideNavigation() {
  const sidebarOpen = true;
  const isMediumScreen = useIsMediumScreen();
  const microNavigation = !sidebarOpen || isMediumScreen;
  const { location, goBack } = useHistory();

  function scrollToSection(section: string) {
    const TOP_MARGIN_PX = 20;
    const element = document.getElementById(section);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - TOP_MARGIN_PX,
        left: 0,
        behavior: 'smooth',
      });
    }
  }

  function getOnClickHandler(section) {
    if (section) {
      if (location.pathname === `/$/${PAGES.LIVESTREAM_OVERLAY_SETTINGS}`) {
        return () => scrollToSection(section);
      } else if (location.pathname.startsWith(`/$/${PAGES.LIVESTREAM_OVERLAY_SETTINGS}/`)) {
        return () => {
          goBack();
          setTimeout(() => scrollToSection(section), 5);
        };
      }
    }

    return undefined;
  }

  if (isMediumScreen) {
    // I think it's ok to hide it for now on medium/small screens given that
    // we are using a scrolling Settings Page that displays everything. If we
    // really need this, most likely we can display it as a Tab at the top
    // of the page.
    return null;
  }

  return (
    <div>
      <nav
        aria-label={'Sidebar'}
        className={classnames('navigation', {
          'navigation--micro': microNavigation,
          // @if TARGET='app'
          'navigation--mac': IS_MAC,
          // @endif
        })}
      >
        <div>
          <ul className={classnames('navigation-links', { 'navigation-links--micro': !sidebarOpen })}>
            {SIDE_LINKS.map((linkProps) => {
              return (
                <li key={linkProps.title}>
                  <Button
                    {...linkProps}
                    label={__(linkProps.title)}
                    title={__(linkProps.title)}
                    icon={linkProps.icon}
                    className={classnames('navigation-link', {})}
                    // $FlowFixMe
                    onClick={getOnClickHandler(linkProps.section)}
                  />
                  {linkProps.extra && linkProps.extra}
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {isMediumScreen && sidebarOpen && (
        <>
          <nav
            className={classnames('navigation--absolute', {
              // @if TARGET='app'
              'navigation--mac': IS_MAC,
              // @endif
            })}
          >
            <div>
              <ul className="navigation-links--absolute">
                {SIDE_LINKS.map((linkProps) => {
                  // $FlowFixMe
                  const { link, route, ...passedProps } = linkProps;
                  return (
                    <li key={linkProps.title}>
                      <Button
                        {...passedProps}
                        label={__(linkProps.title)}
                        title={__(linkProps.title)}
                        icon={linkProps.icon}
                        className={classnames('navigation-link', {})}
                        onClick={getOnClickHandler(linkProps.section)}
                      />
                      {linkProps.extra && linkProps.extra}
                    </li>
                  );
                })}
              </ul>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
