// @flow
import React from 'react';
import classnames from 'classnames';
import './style.scss';

// prettier-ignore
const AD_CONFIG = Object.freeze({
  url: 'https://assets.revcontent.com/master/delivery.js',
  sticky: 'https://x.revcontent.com/rc_sticky_all.js',
  id: '274420',
});

type Props = {
  // --- redux ---
  isContentClaim: boolean,
  isChannelClaim: boolean,
  authenticated: ?boolean,
  shouldShowAds: boolean,
  homepageData: any,
  nagsShown: boolean,
  adBlockerFound: ?boolean,
};

export default function AdSticky(props: Props) {
  const { isContentClaim, isChannelClaim, authenticated, shouldShowAds, homepageData, nagsShown, adBlockerFound } =
    props;

  // $FlowIgnore
  const inAllowedPath = shouldShowAdsForPath(location.pathname, isContentClaim, isChannelClaim, authenticated);
  const [isActive, setIsActive] = React.useState(false);
  const [isHidden, setIsHidden] = React.useState(false);
  const [loads, setLoads] = React.useState(1);
  const stickyContainer = React.useRef<?HTMLDivElement>(null);

  const observer = new MutationObserver(callback);

  function callback(mutationList) {
    mutationList.forEach(function (mutation) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        // $FlowIgnore
        if (mutation.target && mutation.target.classList && mutation.target.classList.contains('hidden-rc-sticky')) {
          setIsHidden(true);
        }
      }
    });
  }

  function shouldShowAdsForPath(pathname, isContentClaim, isChannelClaim, authenticated) {
    const pathIsCategory = Object.values(homepageData.categories || {}).some((x) =>
      // $FlowIgnore
      pathname.startsWith(`/$/${x?.name}`)
    );
    return pathIsCategory || isChannelClaim || isContentClaim || pathname === '/';
  }

  React.useEffect(() => {
    if (isHidden) setLoads(loads + 1);
    if (loads >= 2) {
      setIsHidden(false);
      setLoads(0);
    }
    // $FlowIgnore
  }, [location.href]); // eslint-disable-line react-hooks/exhaustive-deps -- no idea

  React.useEffect(() => {
    if (stickyContainer && stickyContainer.current) {
      observer.observe(stickyContainer.current, { attributes: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- on mount only
  }, []);

  React.useEffect(() => {
    let script, scriptId, scriptSticky;

    if (shouldShowAds && !isActive && inAllowedPath && !nagsShown) {
      try {
        const stickyIdCheck = Array.from(document.getElementsByTagName('script')).findIndex((e) => {
          return Boolean(e.innerHTML.indexOf('rcStickyWidgetId'));
        });
        if (!stickyIdCheck) {
          scriptId = document.createElement('script');
          scriptId.innerHTML = 'let rcStickyWidgetId = ' + AD_CONFIG.id + ';';
          try {
            // $FlowIgnore
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
  }, [shouldShowAds, nagsShown, inAllowedPath, isActive]);

  return (
    <div
      id="sticky-d-rc"
      ref={stickyContainer}
      className={classnames({
        'show-rc-sticky': isActive && !adBlockerFound && !isHidden,
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
