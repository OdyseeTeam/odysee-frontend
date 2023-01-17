// @flow
import React from 'react';
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
  } = props;

  // $FlowIgnore
  const inAllowedPath = shouldShowAdsForPath(location.pathname, isContentClaim, isChannelClaim, authenticated);
  const [isActive, setIsActive] = React.useState(false);

  function shouldShowAdsForPath(pathname, isContentClaim, isChannelClaim, authenticated) {
    // $FlowIssue: mixed type
    const pathIsCategory = Object.values(homepageData).some((x) => pathname.startsWith(`/$/${x?.name}`));
    return pathIsCategory || isChannelClaim || isContentClaim || pathname === '/';
  }

  React.useEffect(() => {
    let script, scriptId, scriptSticky;
    if (!isActive && inAllowedPath && locale && !locale.gdpr_required && !nagsShown) {
      try {
        const checkExisting = Array.from(document.getElementsByTagName('script')).findIndex((e) => {
          return Boolean(
            e.src.indexOf('rc_sticky_all') && e.src.indexOf('delivery') && e.innerHTML.indexOf('rcStickyWidgetId')
          );
        });

        if (!checkExisting) {
          script = document.createElement('script');
          script.src = AD_CONFIG.url;

          scriptId = document.createElement('script');
          scriptId.innerHTML = 'let rcStickyWidgetId = ' + AD_CONFIG.id + ';';

          scriptSticky = document.createElement('script');
          scriptSticky.src = 'https://x.revcontent.com/rc_sticky_all.js';

          // $FlowIgnore
          document.body.appendChild(script);
          // $FlowIgnore
          document.body.appendChild(scriptId);
          // $FlowIgnore
          document.body.appendChild(scriptSticky);

          setIsActive(true);
        }
      } catch (e) {}
    }
  }, [shouldShowAds, AD_CONFIG, isActive]);

  return (
    <div id="sticky-d-rc" className="hidden-rc-sticky">
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
