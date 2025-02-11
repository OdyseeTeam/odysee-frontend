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

function SendUsdc(props: Props) {
  const { arWalletStatus, handleArConnectDisconnect, balance } = props;

  const isSelected = true;

  return (
    <Card
      className={!arWalletStatus ? `card--sendusdc card--disabled` : `card--sendusdc`}
      title={
        <>
          <Symbol token="usdc" amount={balance} precision={2} isTitle />
        </>
      }
      background
      actions={
        <>
          <div className="sendusdc-row">
            <div className="sendusdc-row__amount">
              Amount
              <input type="text" />
            </div>
            <div className="sendusdc-row__network">
              Network
              <div className="network-selector">
                <Menu>
                  <MenuButton className="menu__link">
                    <Symbol token="eth" />Ethereum
                    <Icon icon={ICONS.DOWN} />
                  </MenuButton>
                  <MenuList className="menu__list channel-selector">
                    <MenuItem>
                      <div className={classnames('channel-selector__item', { 'channel-selector__item--selected': isSelected })}>
                        <Symbol token="eth" />Ethereum
                      </div>
                    </MenuItem>
                    <MenuItem>
                      <div className={classnames('channel-selector__item', { 'channel-selector__item--selected': isSelected })}>
                        <Symbol token="bnb" />BNB
                      </div>
                    </MenuItem>
                    <MenuItem>
                      <div className={classnames('channel-selector__item', { 'channel-selector__item--selected': isSelected })}>
                        <Symbol token="base" />Base
                      </div>
                    </MenuItem>
                  </MenuList>
                </Menu>
              </div>
            </div>
            <div className="sendusdc-row__receiver">
              Receiver
              <input type="text" />
            </div>
            <div className="sendusdc-row__send">
              <Button 
                button="primary" 
                title={__('Send')}
                label={__('Send')}
              />
            </div>
          </div>
        </>
      }
    />
  )
}

export default SendUsdc;

