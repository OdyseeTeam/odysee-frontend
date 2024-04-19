// @flow
import React, { memo, useRef, useState, useEffect } from 'react';
import classnames from 'classnames';

// prettier-ignore
const AD_CONFIG = Object.freeze({
  url: 'https://assets.revcontent.com/master/delivery.js',
  sticky: 'https://x.revcontent.com/rc_sticky_all.js',
  id: '277801',
});

type Props = {
  provider?: string,
  // --- redux ---
  isContentClaim: boolean,
  isChannelClaim: boolean,
  authenticated: ?boolean,
  shouldShowAds: boolean,
  homepageData: any,
  nagsShown: boolean,
  adBlockerFound: ?boolean,
};

// $FlowIgnore
const AdSticky = memo(function AdSticky(props: Props) {
  // export default function AdSticky(props: Props) {
  const {
    provider,
    isContentClaim,
    isChannelClaim,
    authenticated,
    shouldShowAds,
    homepageData,
    nagsShown,
    adBlockerFound,
  } = props;

  // $FlowIgnore
  const inAllowedPath = shouldShowAdsForPath(location.pathname, isContentClaim, isChannelClaim, authenticated);
  const [isActive, setIsActive] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [loads, setLoads] = useState(1);
  const stickyContainer = useRef<?HTMLDivElement>(null);
  const random = Math.floor(Math.random() * 2);

  const observer = new MutationObserver(callback);

  function callback(mutationList) {
    if (provider === 'revcontent') {
      mutationList.forEach(function (mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          // $FlowIgnore
          if (mutation.target && mutation.target.classList && mutation.target.classList.contains('hidden-rc-sticky')) {
            setIsHidden(true);
          }
        }
      });
    } else if (provider === 'rumble') {
      // $FlowIgnore
      stickyContainer.current?.firstElementChild
        ?.querySelectorAll('iframe:not(:first-child)')
        .forEach((iframe) => iframe.remove());
    }
  }

  function shouldShowAdsForPath(pathname, isContentClaim, isChannelClaim, authenticated) {
    const pathIsCategory = Object.values(homepageData.categories || {}).some((x) =>
      // $FlowIgnore
      pathname.startsWith(`/$/${x?.name}`)
    );
    return pathIsCategory || isChannelClaim || isContentClaim || pathname === '/';
  }

  function closeRmbl() {
    // $FlowIgnore
    document.body.querySelectorAll('script[src*="warp/"]')?.forEach((script, index) => index > 0 && script.remove());
    // $FlowIgnore
    const iframes = stickyContainer.current?.firstElementChild?.querySelectorAll('iframe');
    if (iframes) iframes.forEach((iframe) => iframe.remove());
    setIsHidden(true);
  }

  React.useEffect(() => {
    const reset = 6;
    if (isHidden) setLoads(loads + 1);
    if (loads >= reset) {
      setIsHidden(false);
      setLoads(0);
    }
    // $FlowIgnore
  }, [location.href]); // eslint-disable-line react-hooks/exhaustive-deps -- no idea

  useEffect(() => {
    if (stickyContainer && stickyContainer.current) {
      observer.observe(stickyContainer.current, { attributes: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- on mount only
  }, []);

  useEffect(() => {
    let script, scriptId, scriptSticky;

    if (provider === 'revcontent' && shouldShowAds && !isActive && inAllowedPath && !nagsShown) {
      try {
        let stickyIdCheck = false;
        Array.from(document.getElementsByTagName('script')).findIndex((e) => {
          if (e.innerHTML.indexOf('rcStickyWidgetId') !== -1) {
            stickyIdCheck = true;
          }
        });
        if (!stickyIdCheck) {
          scriptId = document.createElement('script');
          scriptId.innerHTML = 'let rcStickyWidgetId = ' + AD_CONFIG.id + ';';
          try {
            // $FlowIgnore
            document.body.appendChild(scriptId);
          } catch (e) {}
        }

        let stickyAllCheck = false;
        Array.from(document.getElementsByTagName('script')).findIndex((e) => {
          if (e.src.indexOf('delivery') !== -1) {
            stickyAllCheck = true;
          }
        });
        if (!stickyAllCheck) {
          script = document.createElement('script');
          script.src = AD_CONFIG.url;
          // $FlowIgnore
          document.body.appendChild(script);
        }

        let stickyWidgetCheck = false;
        Array.from(document.getElementsByTagName('script')).findIndex((e) => {
          if (e.src.indexOf('rc_sticky_all') !== -1) {
            stickyWidgetCheck = true;
          }
        });
        if (!stickyWidgetCheck) {
          scriptSticky = document.createElement('script');
          scriptSticky.src = 'https://x.revcontent.com/rc_sticky_all.js';
          scriptSticky.onload = () => setIsActive(true);
          // $FlowIgnore
          document.body.appendChild(scriptSticky);
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
    } else if (provider === 'rumble') {
      const adScript = document.getElementById('nrp-61') || document.getElementById('nrp-157');
      const iframeCheck =
        (adScript && adScript.parentElement && adScript.parentElement.querySelector('iframe')) || null;
      if (adScript && iframeCheck) adScript.id = 'static';
      if (shouldShowAds && !isActive && !isHidden) setIsActive(true);
    }
  }, [provider, isHidden, shouldShowAds, nagsShown, inAllowedPath, isActive]);

  if (shouldShowAds && provider === 'revcontent') {
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

  if (shouldShowAds && provider === 'rumble' && !isHidden) {
    return random === 0 ? (
      <div
        id="rmbl-sticky"
        ref={stickyContainer}
        className={classnames({
          'show-rmbl-sticky': isActive && !adBlockerFound && !isHidden,
          FILE: isContentClaim,
        })}
      >
        <div className="rmbl-sticky">
          <script id="nrp-61" type="text/javascript" className="">
            {(function (node) {
              var nrp = document.createElement('script');
              nrp.type = 'text/javascript';
              nrp.async = true;
              nrp.src = `https://a.ads.rmbl.ws/warp/61?r=${Math.floor(Math.random() * 99999)}`;
              if (node) node.appendChild(nrp);
            })(document.getElementsByTagName('script')[document.getElementsByTagName('script').length - 1].parentNode)}
          </script>
        </div>
        <div className="rmbl-sticky-close">
          <button onClick={() => closeRmbl()}>X</button>
        </div>
      </div>
    ) : (
      <div
        id="rmbl-sticky"
        ref={stickyContainer}
        className={classnames('rmbl-sticky--157', {
          'show-rmbl-sticky': isActive && !adBlockerFound && !isHidden,
          FILE: isContentClaim,
        })}
      >
        <div className="rmbl-sticky">
          <script id="nrp-157" type="text/javascript">
            {(function (node) {
              var nrp = document.createElement('script');
              nrp.type = 'text/javascript';
              nrp.async = true;
              nrp.src = `//a.ads.rmbl.ws/warp/157?r=${Math.floor(Math.random() * 99999)}`;
              if (node) node.appendChild(nrp);
            })(document.getElementsByTagName('script')[document.getElementsByTagName('script').length - 1].parentNode)}
          </script>
        </div>
        <div className="rmbl-sticky-close">
          <button onClick={() => closeRmbl()}>X</button>
        </div>
      </div>
    );
  }

  return null;
});

export default AdSticky;
