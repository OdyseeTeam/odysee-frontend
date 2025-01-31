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
  arConnectStatus: any,
  theme: string,
  doCheckArConnectStatus: () => void,
};

export default function BuyPage(props: Props) {
  const { arConnectStatus, theme, doCheckArConnectStatus } = props;
  // const { goBack } = useHistory();

  const apiKey = 'pk_test_01JEXX6J49SXFTGBTEXN3S5MEF';
  const network = '0x67b573D3dA11E21Af9993c5a94C7c5cD88638F33';

  React.useEffect(() => {
    doCheckArConnectStatus();
  }, [doCheckArConnectStatus]);

  if (ENABLE_ARCONNECT) {
    return (
      <Page
        noSideNavigation
        className="depositPage-wrapper"
        backout={{ backoutLabel: __('Done'), title: <Symbol token="usdc" size={28} /> }}
      >
        <div className="iframe-wrapper">
          <iframe
            className={arConnectStatus.status === 'connected' ? '' : 'iframe--disabled'}
            src={`https://buy.onramper.dev?apiKey=${apiKey}&enableCountrySelector=true&partnerContext=Odysee&mode=buy&defaultCrypto=usdc_base&onlyCryptos=usdc_bsc,usdc_base&defaultFiat=usd&defaultAmount=30&networkWallets=base:${network},bsc:${network}&onlyCryptoNetworks=base,bsc&themeName=${theme}`}
            title="Onramper Widget"
            height="630px"
            width="420px"
            allow="accelerometer; autoplay; camera; gyroscope; payment; microphone"
          />
          {arConnectStatus.status !== 'connected' && (
            <div className="walletConnect-wrapper">
              <WalletConnect />
            </div>
          )}
        </div>
      </Page>
    );
  }
}
