/* eslint-disable */
// @flow
import React from 'react';
import * as ICONS from 'constants/icons';
import classnames from 'classnames';
import { Menu, MenuList, MenuButton, MenuItem } from '@reach/menu-button';
import Icon from 'component/common/icon';
import Card from 'component/common/card';
import Button from 'component/button';
import Symbol from 'component/common/symbol';
import './style.scss';

function SendUsdc(props: any) {
  const { cardHeader, arWalletStatus, balance } = props;
  const [canSend, setCanSend] = React.useState(false);
  const inputAmountRef = React.useRef<HTMLInputElement | null>(null);
  const inputReceivingAddressRef = React.useRef();

  const networks = [
    {
      symbol: 'eth',
      label: 'Ethereum',
    },
    {
      symbol: 'bnb',
      label: 'BNB',
    },
    {
      symbol: 'base',
      label: 'Base',
    },
  ];
  const [targetNetwork, setTargetNetwork] = React.useState(networks[0]);

  function handleSetMaxAmount() {
    if (inputAmountRef && inputAmountRef.current) {
      // $FlowIgnore
      inputAmountRef.current.value = String(balance.toFixed(8) || 0);
    }
    handleCheckForm();
  }

  function handleCheckForm() {
    const isValidEthAddress = (address) => typeof address === 'string' && /^0x[a-fA-F0-9]{40}$/.test(address);
    const check =
      inputAmountRef.current?.value &&
      Number(inputAmountRef.current?.value) <= Number(balance) &&
      isValidEthAddress(inputReceivingAddressRef.current?.value);
    setCanSend(check);
  }

  return (
    <Card
      className={!arWalletStatus ? `card--sendusdc card--disabled` : `card--sendusdc`}
      title={cardHeader()}
      background
      actions={
        <>
          <div className="sendusdc-row">
            <div className="sendusdc-row__amount">
              {__('Amount')}
              <input
                ref={inputAmountRef}
                type="number"
                step="0.00000001"
                placeholder={Number(0).toFixed(8)}
                onChange={handleCheckForm}
              />
              <span onClick={handleSetMaxAmount}>
                {__('Totally available: ')}
                {balance.toFixed(8)}
              </span>
            </div>
            <div className="sendusdc-row__network">
              {__('Network')}
              <div className="network-selector">
                <Menu>
                  <MenuButton className="menu__link">
                    <Symbol token={targetNetwork.symbol} />
                    {targetNetwork.label}
                    <Icon icon={ICONS.DOWN} />
                  </MenuButton>
                  <MenuList className="menu__list channel-selector">
                    {networks.map((network, index) => {
                      return (
                        <MenuItem key={index} onSelect={() => setTargetNetwork(network)}>
                          <div
                            className={classnames('channel-selector__item', {
                              'channel-selector__item--selected': targetNetwork.symbol === network.symbol,
                            })}
                          >
                            <Symbol token={network.symbol} />
                            {network.label}
                          </div>
                        </MenuItem>
                      );
                    })}
                  </MenuList>
                </Menu>
              </div>
            </div>
            <div className="sendusdc-row__receiver">
              {__('Receiving address')}
              <input
                ref={inputReceivingAddressRef}
                type="text"
                placeholder={`0x0000000000000000000000000000000000000000`}
                onChange={handleCheckForm}
              />
            </div>
            <div className="sendusdc-row__send">
              <Button button="primary" title={__('Send')} label={__('Send')} disabled={!canSend} />
            </div>
          </div>
        </>
      }
    />
  );
}

export default SendUsdc;
