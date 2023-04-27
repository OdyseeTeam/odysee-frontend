// @flow
import React from 'react';
import PremiumPlusTile from 'component/premiumPlusTile';

const DISABLE_VIDEO_AD = false;

// prettier-ignore
const AD_CONFIG = Object.freeze({
  url: 'https://assets.revcontent.com/master/delivery.js',
});

// ****************************************************************************
// Ads
// ****************************************************************************

type Props = {
  tileLayout?: boolean,
  className?: string,
  noFallback?: boolean,
  // --- redux ---
  shouldShowAds: boolean,
  doSetAdBlockerFound: (boolean) => void,
};

function AdTileA(props: Props) {
  const { tileLayout, shouldShowAds, noFallback, doSetAdBlockerFound } = props;
  const ref = React.useRef();

  React.useEffect(() => {
    if (shouldShowAds && !DISABLE_VIDEO_AD) {
      let script;
      try {
        script = document.createElement('script');
        script.src = AD_CONFIG.url;
        // $FlowIgnore
        document.body.appendChild(script);
      } catch (e) {}

      return () => {
        // $FlowIgnore
        if (script) document.body.removeChild(script);
      };
    }
  }, [shouldShowAds]);

  React.useEffect(() => {
    if (ref.current) {
      const mountedStyle = getComputedStyle(ref.current);
      doSetAdBlockerFound(mountedStyle?.display === 'none');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- on mount only
  }, []);

  if (shouldShowAds) {
    return (
      <li className="claim-preview--tile">
        <div
          className="rc_tile"
          id="rc-widget-fceddd"
          ref={ref}
          data-rc-widget
          data-widget-host="habitat"
          data-endpoint="//trends.revcontent.com"
          data-widget-id="273434"
        />
      </li>
    );
  } else if (!noFallback) {
    return <PremiumPlusTile tileLayout={tileLayout} />;
  }

  return null;
}

export default AdTileA;
