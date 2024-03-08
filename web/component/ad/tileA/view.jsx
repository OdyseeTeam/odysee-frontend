// @flow
import React, { memo } from 'react';
import PremiumPlusTile from 'component/premiumPlusTile';

// prettier-ignore
const AD_CONFIG: {| url: string |} = Object.freeze({
  url: 'https://assets.revcontent.com/master/delivery.js',
});

// ****************************************************************************
// ****************************************************************************

export type Props = {|
  provider?: string,
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

const AdTileA = memo(function AdTileA(props: Props & StateProps & DispatchProps) {
  // function AdTileA(props: Props & StateProps & DispatchProps) {
  const { provider, tileLayout, shouldShowAds, noFallback } = props;
  const [iframe, setIframe] = React.useState(false);
  const primaryIframeRef = React.useRef(false);
  const [useFallback, setUseFallback] = React.useState(false);

  React.useEffect(() => {
    if (location.pathname.includes('@') && window.innerWidth > 1600) {
      setUseFallback(true);
    }
    const handleResize = () => {
      if (location.pathname.includes('@') && window.innerWidth > 1600) {
        setUseFallback(true);
      } else {
        setUseFallback(false);
      }
    };

    if (provider === 'revcontent' || useFallback) {
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
    } else if (provider === 'rumble') {
      window.addEventListener('resize', handleResize);
      const adScript = document.getElementById('nrp-60');
      const iframeCheck = adScript.parentElement.querySelector('iframe') || null;
      if (iframeCheck) {
        adScript.id = 'static';
        const iframeHTML = { __html: iframeCheck.outerHTML };
        setIframe(iframeHTML);
      }
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [provider, shouldShowAds, useFallback]);

  if (shouldShowAds && (provider === 'revconent' || useFallback)) {
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
  } else if (shouldShowAds && provider === 'rumble' && !useFallback) {
    if (!iframe) {
      return (
        <li className="claim-preview--tile">
          <div className={'rc_tile rc_tile--rmbl'}>
            <div>
              <script id="nrp-60" type="text/javascript" className="">
                {(function (node) {
                  var nrp = document.createElement('script');
                  nrp.type = 'text/javascript';
                  nrp.async = true;
                  nrp.src = `https://a.ads.rmbl.ws/warp/60?r=${Math.floor(Math.random() * 99999)}`;
                  node.appendChild(nrp);
                  primaryIframeRef.current = true;
                })(
                  document.getElementsByTagName('script')[document.getElementsByTagName('script').length - 1].parentNode
                )}
              </script>
            </div>
          </div>
        </li>
      );
    } else {
      return (
        <li className="claim-preview--tile">
          <div className={'rc_tile rc_tile--rmbl'} dangerouslySetInnerHTML={iframe} />
        </li>
      );
    }
  } else if (!noFallback) {
    return <PremiumPlusTile tileLayout={tileLayout} />;
  }

  return null;
});

export default AdTileA;
