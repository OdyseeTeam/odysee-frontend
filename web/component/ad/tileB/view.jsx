// @flow
import React from 'react';
import classnames from 'classnames';

// prettier-ignore
const AD_CONFIG = Object.freeze({
  revcontent: {
    url: 'https://assets.revcontent.com/master/delivery.js',
  },
  rumble: {
    url: `https://a.ads.rmbl.ws/warp/59?r=${Math.floor(Math.random() * 99999)}`,
  },
});

type Props = {
  provider: string,
  shouldShowAds: boolean,
};

function AdTileB(props: Props) {
  const { provider, shouldShowAds } = props;
  const [isActive, setIsActive] = React.useState(false);

  React.useEffect(() => {
    if (shouldShowAds) {
      let script;
      if (provider === 'revcontent') {
        try {
          script = document.createElement('script');
          script.src = AD_CONFIG[provider].url;
          script.type = 'text/javascript';
          script.defer = true;
          // $FlowIgnore
          document.body.appendChild(script);

          setInterval(() => {
            setIsActive(true);
          }, 1000);
        } catch (e) {}

        return () => {
          // $FlowIgnore
          if (script) document.body.removeChild(script);
        };
      }
    }
  }, [shouldShowAds, provider]);

  if (provider === 'revcontent') {
    return (
      <div
        className={classnames('rc_tileB', {
          'show-rc_tile': isActive,
        })}
        id="rc-widget-952c79"
        data-rc-widget
        data-widget-host="habitat"
        data-endpoint="//trends.revcontent.com"
        data-widget-id="274791"
      />
    );
  }

  if (shouldShowAds && provider === 'rumble') {
    return (
      <html>
        <div
          className={classnames('rc_tileB rc_tileB--rmbl', {
            'show-rc_tile': isActive,
          })}
        >
          <script id="nrp-59" type="text/javascript" className="">
            {(function (node) {
              var nrp = document.createElement('script');
              nrp.type = 'text/javascript';
              nrp.async = true;
              nrp.src = AD_CONFIG.rumble.url;
              node.appendChild(nrp);
            })(document.getElementsByTagName('script')[document.getElementsByTagName('script').length - 1].parentNode)}
          </script>
        </div>
      </html>
    );
  }
}

export default AdTileB;
