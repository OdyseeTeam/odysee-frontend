/*
const select = (state) => ({
  connecting: state.arwallet.connecting,
  error: state.arwallet.error,
  activeApiAddress: selectAPIArweaveActiveAddress(state),
});

const perform = {
  doHideModal,
  doArConnect,
  doRegisterArweaveAddress,
};
 */

import React from 'react';

interface IProps {}

function View(props: IProps) {
  const [currentAddress, setCurrentAddress] = React.useState('');
  useEffect(() => {
    return () => {
      effect;
    };
  }, [input]);

  const { walletAddress, doRegisterArweaveAddress } = props;
  return (
    <div className={'container'}>
      <Button button="primary" label={'Register'} onClick={() => doRegisterArweaveAddress(walletAddress, true)} />
    </div>
  );
}

export default View;
