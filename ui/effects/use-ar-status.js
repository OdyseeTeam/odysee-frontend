import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { LocalStorage } from 'util/storage';
import { selectArweaveWanderAuth, selectArweaveStatus } from 'redux/selectors/arwallet';
import { useIsMobile } from 'effects/use-screensize';
import { doArConnect } from 'redux/actions/arwallet';

export const useArStatus = () => {
  const wanderAuth = useSelector(selectArweaveWanderAuth);
  const arStatus = useSelector(selectArweaveStatus);
  const isMobile = useIsMobile();
  const dispatch = useDispatch();

  const [walletType, setWalletType] = useState(
    LocalStorage.getItem('WALLET_TYPE') === 'NATIVE_WALLET' ? 'extension' : 'embedded'
  );

  const hasArweaveExtension = Boolean(
    window.arweaveWallet && window.arweaveWallet.walletName === 'ArConnect' && !isMobile
  );

  const hasArSignin =
    wanderAuth?.authStatus === 'authenticated' ||
    (walletType === 'extension' && window.arweaveWallet?.walletName === 'ArConnect');

  const hasArConnection = Boolean(arStatus.address) && hasArSignin;
  const hasArAddress = Boolean(arStatus.address);

  const isSigningIn =
    (wanderAuth?.authStatus === undefined ||
      wanderAuth?.authStatus === 'loading' ||
      wanderAuth?.authStatus === 'onboarding') &&
    walletType === 'embedded';

  const hasConnection =
    ((!wanderAuth?.authStatus || (wanderAuth?.authStatus !== 'not-authenticated' && !isSigningIn)) &&
      walletType === 'embedded') ||
    (walletType === 'extension' && window.arweaveWallet?.walletName === 'ArConnect');

  const activeArStatus = hasArConnection
    ? 'connected'
    : isSigningIn
      ? 'authenticating'
      : hasConnection
        ? 'authenticated'
        : 'not-authenticated'

  useEffect(() => {
    const type = LocalStorage.getItem('WALLET_TYPE');
    setWalletType(type === 'NATIVE_WALLET' ? 'extension' : 'embedded');
    if (
      window.wanderInstance &&
      !window.wanderInstance?.authInfo.authType &&
      window.wanderInstance?.authInfo.authType !== 'null' &&
      window.wanderInstance?.authInfo.authType !== type
    ) {
      window.wanderInstance.authInfo.authType = type;
    }
    if (
      !arStatus.connecting &&
      (window.wanderInstance?.authInfo.authType === 'NATIVE_WALLET' || window.wanderInstance?.authInfo.authType === 'null') &&
      walletType === 'extension' && !hasArConnection
    ) {
      const intentionalDisconnect = LocalStorage.getItem('WANDER_DISCONNECT') === 'true' ? true : false;
      // console.log('connect pls');
      if(!intentionalDisconnect) dispatch(doArConnect());
    }
    if (arStatus.connecting) {
      // console.log('connecting');
    }
    // console.log('connected pls?', wanderAuth, walletType, arStatus.connecting);
  }, [wanderAuth, walletType, arStatus.connecting]);

  return {
    walletType,
    hasArweaveExtension,
    hasArSignin,
    hasArConnection,
    isSigningIn,
    hasConnection,
    hasArAddress,
    activeArStatus
  };
};
