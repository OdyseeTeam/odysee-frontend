import React, { useState, useEffect, useCallback } from 'react';
import Button from 'component/button';
import CopyableText from 'component/copyableText';
import QRCode from 'component/common/qr-code';
import Card from 'component/common/card';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectReceiveAddress, selectGettingNewAddress } from 'redux/selectors/wallet';
import { doCheckAddressIsMine, doGetNewAddress } from 'redux/actions/wallet';

const WalletAddress = React.memo(function WalletAddress() {
  const dispatch = useAppDispatch();

  const receiveAddress = useAppSelector((state) => selectReceiveAddress(state));
  const gettingNewAddress = useAppSelector((state) => selectGettingNewAddress(state));

  const [showQR, setShowQR] = useState(false);

  const checkAddressIsMine = useCallback((address: string) => dispatch(doCheckAddressIsMine(address)), [dispatch]);
  const getNewAddress = useCallback(() => dispatch(doGetNewAddress()), [dispatch]);

  useEffect(() => {
    if (!receiveAddress) {
      getNewAddress();
    } else {
      checkAddressIsMine(receiveAddress);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run on mount
  }, []);

  const toggleQR = () => setShowQR((prev) => !prev);

  return (
    <Card
      title={__('Receive Credits')}
      subtitle={__('Use this address to receive LBRY Credits.')}
      actions={
        <React.Fragment>
          <CopyableText
            primaryButton
            label={__('Your Address')}
            copyable={receiveAddress}
            snackMessage={__('Address copied.')}
          />

          <div className="card__actions">
            {!IS_WEB && (
              <Button
                button="secondary"
                label={__('Get New Address')}
                onClick={getNewAddress}
                disabled={gettingNewAddress}
              />
            )}
            <Button button="link" label={showQR ? __('Hide QR code') : __('Show QR code')} onClick={toggleQR} />
          </div>
          <p className="help">
            {!IS_WEB &&
              __('You can generate a new address at any time, and any previous addresses will continue to work.')}
          </p>

          {showQR && <QRCode value={receiveAddress} paddingTop />}
        </React.Fragment>
      }
    />
  );
});

export default WalletAddress;
