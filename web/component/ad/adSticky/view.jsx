// @flow
import React from 'react';
import classnames from 'classnames';

// prettier-ignore
const AD_CONFIG = Object.freeze({
  url: 'https://assets.revcontent.com/master/delivery.js',
  sticky: 'https://x.revcontent.com/rc_sticky_all.js',
  id: '274420',
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

export default function AdSticky(props: Props) {
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

  function closeRmbl() {
    // setIsActive(false);
    setIsHidden(true);
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
      console.log('tick');
      if (!isActive && !isHidden) setIsActive(true);
    }
  }, [provider, isHidden, shouldShowAds, nagsShown, inAllowedPath, isActive]);

  if (provider === 'revcontent') {
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

  if (provider === 'rumble' && isActive && !isHidden) {
    return (
      <div
        id="rmbl-sticky"
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
    );
  }

  return null;
}
