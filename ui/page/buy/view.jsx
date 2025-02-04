// @flow
import React from 'react';
import Page from 'component/page';
// import Card from 'component/common/card';
import WalletConnect from '../../component/walletConnect';
// import { useHistory } from 'react-router';
import Symbol from 'component/common/symbol';

import { ENABLE_ARCONNECT } from 'config';
import './style.scss';

type Props = {
  arWalletStatus: any,
  theme: string,
  experimentalUi: boolean,
};

export default function BuyPage(props: Props) {
  const { arWalletStatus, theme, experimentalUi } = props;
  const [targetWallet, setTargetWallet] = React.useState(undefined);

  const showArweave = ENABLE_ARCONNECT && experimentalUi;

  const apiKey = 'pk_test_01JEXX6J49SXFTGBTEXN3S5MEF';
  const network = '0x67b573D3dA11E21Af9993c5a94C7c5cD88638F33';
  const iframeUri = `https://buy.onramper.dev?apiKey=${apiKey}&enableCountrySelector=true&partnerContext=Odysee&mode=buy&defaultCrypto=usdc_base&onlyCryptos=usdc_bsc,usdc_base&defaultFiat=usd&defaultAmount=30&networkWallets=base:${network},bsc:${network}&onlyCryptoNetworks=base,bsc&themeName=${theme}`;

  const everpayUri = 'https://fast-deposit.everpay.io/depositAddress/OI6lHBmLWMuD8rvWv7jmbESefKxZB3zFge_8FdyTqVs/evm';
  const proxyUrl = 'https://cors-anywhere.herokuapp.com/';

  React.useEffect(() => {
    fetch(proxyUrl + everpayUri)
      // .then(response => response.json())
      .then((data) => console.log(data))
      .catch((error) => console.error('Error fetching data:', error));
  }, []);

  if (showArweave) {
    return (
      <Page
        noSideNavigation
        className="depositPage-wrapper"
        backout={{ backoutLabel: __('Done'), title: <Symbol token="usdc" size={28} /> }}
      >
        <div className={`iframe-wrapper${!arWalletStatus && ' iframe--disabled'}`}>
          <iframe
            src={iframeUri}
            title="Onramper Widget"
            height="630px"
            width="420px"
            allow="accelerometer; autoplay; camera; gyroscope; payment; microphone"
          />

          {!arWalletStatus && (
            <div className="walletConnect-wrapper">
              <WalletConnect />
            </div>
          )}
        </div>
      </Page>
    );
  }
}
