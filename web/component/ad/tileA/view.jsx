// @flow
import React from 'react';
import PremiumPlusTile from 'component/premiumPlusTile';

// prettier-ignore
const AD_CONFIG = Object.freeze({
  url: 'https://assets.revcontent.com/master/delivery.js',
});

// ****************************************************************************
// ****************************************************************************

export type Props = {|
  tileLayout?: boolean,
  noFallback?: boolean,
|};

type StateProps = {|
  shouldShowAds: boolean,
|};

type DispatchProps = {||};

// ****************************************************************************
// Ads
// ****************************************************************************

function AdTileA(props: Props & StateProps & DispatchProps) {
  const { tileLayout, shouldShowAds, noFallback } = props;

  React.useEffect(() => {
    if (shouldShowAds) {
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

  if (shouldShowAds) {
    return (
      <li className="claim-preview--tile">
        <div
          className="rc_tile"
          id="rc-widget-fceddd"
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
