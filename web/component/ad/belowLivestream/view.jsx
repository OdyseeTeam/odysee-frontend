// @flow
import React from 'react';
import './style.scss';

type Props = {
  provider: string,
  shouldShowAds: boolean,
};

function AdBelowLivestream(props: Props) {
  const { provider, shouldShowAds } = props;

  if (shouldShowAds && provider === 'rumble') {
    return (
      <div className="rmbl_belowLivestream">
        <div style={{ width: '300px', height: '250px' }}>
          <script id="nrp-158" type="text/javascript">
            {(function (node) {
              var nrp = document.createElement('script');
              nrp.type = 'text/javascript';
              nrp.async = true;
              nrp.src = '//a.ads.rmbl.ws/warp/158?r=' + Math.floor(Math.random() * 99999) + '';
              if (node) node.appendChild(nrp);
            })(document.getElementsByTagName('script')[document.getElementsByTagName('script').length - 1].parentNode)}
          </script>
        </div>
      </div>
    );
  }
}

export default AdBelowLivestream;
