// @flow
import { lazyImport } from 'util/lazyImport';
import { MAIN_CLASS } from 'constants/classnames';
import { parseURI } from 'util/lbryURI';
import { useHistory } from 'react-router';
import { useIsMobile, useIsSmallScreen } from 'effects/use-screensize';
import classnames from 'classnames';
import Header from 'component/header';
import React from 'react';
import Wallpaper from 'component/wallpaper';
import SettingsSideNavigation from 'component/settingsSideNavigation';
import SideNavigation from 'component/sideNavigation';
import type { Node } from 'react';
import usePersistedState from 'effects/use-persisted-state';

const Footer = lazyImport(() => import('web/component/footer' /* webpackChunkName: "footer" */));

type Props = {
  authPage: boolean,
  authRedirect?: string, // Redirects to '/' by default.
  backout: {
    backLabel?: string,
    backNavDefault?: string,
    title: string,
    simpleTitle: string, // Just use the same value as `title` if `title` is already short (~< 10 chars), unless you have a better idea for title overlfow on mobile
  },
  children: Node | Array<Node>,
  className: ?string,
  filePage: boolean,
  fullWidthPage: boolean,
  isMarkdown?: boolean,
  livestream?: boolean,
  noFooter: boolean,
  noHeader: boolean,
  noSideNavigation: boolean,
  settingsPage?: boolean,
  renderMode: String,
  videoTheaterMode: boolean,
  isPopoutWindow?: boolean,
};

function Page(props: Props) {
  const {
    authPage = false,
    authRedirect,
    backout,
    children,
    className,
    filePage = false,
    fullWidthPage = false,
    isMarkdown = false,
    livestream,
    noFooter = false,
    noHeader = false,
    noSideNavigation = false,
    settingsPage,
    renderMode,
    videoTheaterMode,
    isPopoutWindow,
  } = props;

  const {
    location: { pathname, hash },
  } = useHistory();

  const theaterMode =
    renderMode === 'video' || renderMode === 'audio' || renderMode === 'unsupported' ? videoTheaterMode : false;
  const isSmallScreen = useIsSmallScreen();
  const isMobile = useIsMobile();

  const [sidebarOpen, setSidebarOpen] = usePersistedState('sidebar', false);
  const openSidebar = React.useCallback((open) => setSidebarOpen(open), []); // eslint-disable-line react-hooks/exhaustive-deps

  const urlPath = `lbry://${(pathname + hash).slice(1).replace(/:/g, '#')}`;
  let isOnFilePage = false;
  try {
    const { isChannel } = parseURI(urlPath);

    if (!isChannel) isOnFilePage = true;
  } catch (e) {}

  const isAbsoluteSideNavHidden = (isOnFilePage || isMobile) && !sidebarOpen;

  React.useEffect(() => {
    if (isOnFilePage || isSmallScreen) setSidebarOpen(false);

    // TODO: make sure setState callback for usePersistedState uses useCallback to it doesn't cause effect to re-run
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnFilePage, isSmallScreen]);

  return (
    <>
      <Wallpaper uri={urlPath} />
      {!noHeader && (
        <Header
          authHeader={authPage}
          authRedirect={authRedirect}
          backout={backout}
          sidebarOpen={sidebarOpen}
          isAbsoluteSideNavHidden={isAbsoluteSideNavHidden}
          setSidebarOpen={openSidebar}
          hideSidebarToggle={noSideNavigation}
        />
      )}

      <div
        className={classnames('main-wrapper__inner', {
          'main-wrapper__inner--filepage': isOnFilePage,
          'main-wrapper__inner--theater-mode': isOnFilePage && theaterMode && !isMobile,
          'main-wrapper__inner--auth': authPage,
          'main--popout-chat': isPopoutWindow,
        })}
      >
        {!authPage &&
          (settingsPage ? (
            <SettingsSideNavigation />
          ) : (
            !noSideNavigation && (
              <SideNavigation
                sidebarOpen={sidebarOpen}
                setSidebarOpen={openSidebar}
                isMediumScreen={isSmallScreen}
                isOnFilePage={isOnFilePage}
              />
            )
          ))}

        <div
          className={classnames({
            'sidebar--pusher': fullWidthPage,
            'sidebar--pusher--open': sidebarOpen && fullWidthPage,
            'sidebar--pusher--filepage': !fullWidthPage,
          })}
        >
          <main
            id={'main-content'}
            className={classnames(MAIN_CLASS, className, {
              'main--full-width': fullWidthPage,
              'main--auth-page': authPage,
              'main--file-page': filePage,
              'main--video-page': filePage && !theaterMode && !livestream && !isMarkdown,
              'main--settings-page': settingsPage,
              'main--markdown': isMarkdown,
              'main--theater-mode': isOnFilePage && theaterMode && !livestream && !isMarkdown && !isMobile,
              'main--livestream': livestream && !theaterMode,
              'main--livestream--theater-mode': livestream && theaterMode,
              'main--popout-chat': isPopoutWindow,
            })}
          >
            {children}
          </main>

          {!noFooter && (
            <React.Suspense fallback={null}>
              <Footer />
            </React.Suspense>
          )}
        </div>
      </div>
    </>
  );
}

export default Page;
