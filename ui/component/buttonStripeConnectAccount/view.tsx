import React from 'react';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import Button from 'component/button';

type Props = {
  [key: string]: any;
};

const ButtonStripeConnectAccount = (_props: Props) => {
  return (
    <Button button="secondary" label={__('Fiat payouts retired')} icon={ICONS.AR} navigate={`/$/${PAGES.ARACCOUNT}`} />
  );
};

export default ButtonStripeConnectAccount;
