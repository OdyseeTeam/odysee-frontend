// @flow
import React from 'react';
import classnames from 'classnames';
import { useIsMobile } from 'effects/use-screensize';
import './style.scss';

// ****************************************************************************
// AdsSticky
// ****************************************************************************

// const OUTBRAIN_CONTAINER_KEY = 'outbrainSizeDiv';

// prettier-ignore
const AD_CONFIG = Object.freeze({
  url: 'https://assets.revcontent.com/master/delivery.js',
  sticky: 'https://x.revcontent.com/rc_sticky_all.js',
  id: '274420',
});

type Props = {
  uri: ?string,
  // --- redux ---
  isContentClaim: boolean,
  isChannelClaim: boolean,
  authenticated: ?boolean,
  shouldShowAds: boolean,
  homepageData: any,
  locale: ?LocaleInfo,
  nagsShown: boolean,
  adBlockerFound: ?boolean,
};

export default function AdsSticky(props: Props) {
  const {
    isContentClaim,
    isChannelClaim,
    authenticated,
    shouldShowAds, // Global condition on whether ads should be activated
    homepageData,
    locale,
    nagsShown,
    adBlockerFound,
  } = props;

  const isMobile = useIsMobile();

  // $FlowIgnore
  const inAllowedPath = shouldShowAdsForPath(location.pathname, isContentClaim, isChannelClaim, authenticated);
  const [isActive, setIsActive] = React.useState(false);

  function shouldShowAdsForPath(pathname, isContentClaim, isChannelClaim, authenticated) {
    // $FlowIgnore
    const pathIsCategory = Object.values(homepageData.categories || {}).some((x) =>
      // $FlowIgnore
      pathname.startsWith(`/$/${x?.name}`)
    );
    return pathIsCategory || isChannelClaim || isContentClaim || pathname === '/';
  }

  React.useEffect(() => {
    let script, scriptId, scriptSticky;
    if (!isActive && inAllowedPath && locale && !locale.gdpr_required && !nagsShown) {
      try {
        const stickyIdCheck = Array.from(document.getElementsByTagName('script')).findIndex((e) => {
          return Boolean(e.innerHTML.indexOf('rcStickyWidgetId'));
        });
        if (!stickyIdCheck) {
          scriptId = document.createElement('script');
          scriptId.innerHTML = 'let rcStickyWidgetId = ' + AD_CONFIG.id + ';';
          // $FlowIgnore
          try {
            document.body.appendChild(scriptId);
          } catch (e) {}
        }

        const stickyAllCheck = Array.from(document.getElementsByTagName('script')).findIndex((e) => {
          return Boolean(e.src.indexOf('rc_sticky_all'));
        });
        if (!stickyAllCheck) {
          script = document.createElement('script');
          script.src = AD_CONFIG.url;
          // $FlowIgnore
          document.body.appendChild(script);
        }

        const stickyWidgetCheck = Array.from(document.getElementsByTagName('script')).findIndex((e) => {
          return Boolean(e.src.indexOf('delivery'));
        });
        if (!stickyWidgetCheck) {
          scriptSticky = document.createElement('script');
          scriptSticky.src = 'https://x.revcontent.com/rc_sticky_all.js';
          // $FlowIgnore
          document.body.appendChild(scriptSticky);
          setIsActive(true);
        }

        return () => {
          // $FlowIgnore
          if (script) document.body.removeChild(script);
          // $FlowIgnore
          if (scriptId) document.body.removeChild(scriptId);
          // $FlowIgnore
          if (scriptSticky) document.body.removeChild(scriptSticky);
        };
      } catch (e) {}
    }
  }, [shouldShowAds, inAllowedPath, AD_CONFIG, isActive, location]);

  console.log('isActive: ', isActive);
  return (
    <div
      id="sticky-d-rc"
      className={classnames({
        'hidden-rc-sticky': (!isActive || adBlockerFound) && !isMobile,
        FILE: isContentClaim,
      })}
    >
      <div className="sticky-d-rc">
        <div className="sticky-d-rc-close">
          Sponsored<button id="rcStickyClose">X</button>
        </div>
        <div className="sticky-d-rc-content">
          <div id="rc-widget-sticky-d" />
        </div>
      </div>
    </div>
  );
}
