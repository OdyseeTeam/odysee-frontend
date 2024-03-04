// @flow
import React from 'react';
// import classnames from 'classnames';
import './style.scss';

// prettier-ignore
const AD_CONFIG = Object.freeze({
  revcontent: {
    url: 'https://assets.revcontent.com/master/delivery.js',
  },
});

type Props = {
  provider: string,
  shouldShowAds: boolean,
};

function AdAboveComments(props: Props) {
  const { provider, shouldShowAds } = props;
  const adConfig = AD_CONFIG.revcontent;
  const [isActive, setIsActive] = React.useState(false);

  React.useEffect(() => {
    if (provider === 'revcontent') {
      if (shouldShowAds && !isActive) {
        let script;
        try {
          let checkExisting = false;
          Array.from(document.getElementsByTagName('script')).findIndex((e) => {
            if (e.src.indexOf('trends.revcontent.com') !== -1) {
              checkExisting = true;
            }
          });

          if (!checkExisting) {
            script = document.createElement('script');
            script.src = adConfig.url;
            // $FlowIgnore
            document.body.appendChild(script);
          } else {
            setIsActive(true);
          }

          return () => {
            // $FlowIgnore
            if (script) document.body.removeChild(script);
          };
        } catch (e) {}
      }
    }
  }, [shouldShowAds, adConfig, isActive, provider]);

  if (provider === 'revcontent') {
    return (
      <>
        {provider === 'revcontent' && (
          <div
            className="rc_aboveComments"
            id="rc-widget-1d564a"
            data-rc-widget
            data-widget-host="habitat"
            data-endpoint="//trends.revcontent.com"
            data-widget-id="273461"
          />
        )}
      </>
    );
  }
  if (shouldShowAds && provider === 'rumble') {
    return (
      <div className="rmbl_aboveComments">
        <div>
          <script id="nrp-59" type="text/javascript" className="">
            {(function (node) {
              var nrp = document.createElement('script');
              nrp.type = 'text/javascript';
              nrp.async = true;
              nrp.src = `https://a.ads.rmbl.ws/warp/59?r=${Math.floor(Math.random() * 99999)}`;
              if (node) node.appendChild(nrp);
            })(document.getElementsByTagName('script')[document.getElementsByTagName('script').length - 1].parentNode)}
          </script>
          <script id="nrp-60" type="text/javascript" className="">
            {(function (node) {
              var nrp = document.createElement('script');
              nrp.type = 'text/javascript';
              nrp.async = true;
              nrp.src = `https://a.ads.rmbl.ws/warp/60?r=${Math.floor(Math.random() * 99999)}`;
              if (node) node.appendChild(nrp);
            })(document.getElementsByTagName('script')[document.getElementsByTagName('script').length - 1].parentNode)}
          </script>
          <script id="nrp-62" type="text/javascript" className="">
            {(function (node) {
              var nrp = document.createElement('script');
              nrp.type = 'text/javascript';
              nrp.async = true;
              nrp.src = `https://a.ads.rmbl.ws/warp/62?r=${Math.floor(Math.random() * 99999)}`;
              if (node) node.appendChild(nrp);
            })(document.getElementsByTagName('script')[document.getElementsByTagName('script').length - 1].parentNode)}
          </script>
        </div>
      </div>
    );
  }
}

export default AdAboveComments;
