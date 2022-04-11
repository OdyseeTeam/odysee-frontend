/* eslint-disable no-console */
// @flow
import React from 'react';
import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';
import Button from 'component/button';
import { useHistory } from 'react-router';
import { FormField } from 'component/common/form';
import moment from 'moment';
import { URL } from '../../../../config';
import ChannelSelector from 'component/channelSelector';
import { formatLbryUrlForWeb } from 'util/url';
import CopyableText from 'component/copyableText';
import { Lbryio } from 'lbryinc';
import { getStripeEnvironment } from 'util/stripe';


let stripeEnvironment = getStripeEnvironment();

type Props = {
  openModal: (string, {}) => void,
  activeChannelClaim: ?ChannelClaim,
};

function CreatorMembershipsTab(props: Props) {
  const {
    openModal,
    activeChannelClaim,
    doToast,
    claim,
    doResolveClaimIds,
    claimsById,
  } = props;

  const {
    location: { search },
    push,
  } = useHistory();

  React.useEffect(() => {
    (async function() {
      const response = await Lbryio.call(
        'account',
        'status',
        {
          environment: stripeEnvironment,
        },
        'post'
      );

      if (response.charges_enabled) {
        setHaveAlreadyConfirmedBankAccount(true);
      }
    })();
  }, []);

  const [haveAlreadyConfirmedBankAccount, setHaveAlreadyConfirmedBankAccount] = React.useState(false);

  let localMembershipPageUrl;
  let remoteMembershipPageUrl;
  if (activeChannelClaim) {
    remoteMembershipPageUrl = `${URL}${formatLbryUrlForWeb(activeChannelClaim.canonical_url)}?view=membership`;
    localMembershipPageUrl = `${formatLbryUrlForWeb(activeChannelClaim.canonical_url)}?view=membership`;
  }

  return (
    <div className="my-membership__div">
      <h1 style={{ fontSize: '20px', marginTop: '25px', marginBottom: '14px' }}>Membership Page</h1>

      <ChannelSelector hideAnon style={{ marginBottom: '17px' }} />

      <Button
        button="primary"
        className="membership_button"
        label={__('View your membership page')}
        icon={ICONS.UPGRADE}
        navigate={`${localMembershipPageUrl}`}
      />

      <h1 style={{ marginTop: '10px' }}>You can also click the button below to copy your membership page url</h1>

      <CopyableText className="membership-page__copy-button" primaryButton copyable={remoteMembershipPageUrl} snackMessage={__('Page location copied')} style={{ maxWidth: '535px', marginTop: '5px' }} />

      <h1 style={{ fontSize: '20px', marginTop: '25px' }}>Received Funds</h1>

      <h1 style={{ marginTop: '10px' }}> You currently have 0 supporters </h1>

      <h1 style={{ marginTop: '10px' }}> Your estimated monthly income is currently $0 </h1>

      <h1 style={{ marginTop: '10px' }}> You have received $0 total from your supporters</h1>

      <h1 style={{ marginTop: '10px' }}> You do not any withdrawable funds </h1>

      <div className="bank-account-information__div" style={{ marginTop: '33px' }}>
        <h1 style={{ fontSize: '20px' }}>Bank Account Status</h1>
        <div className="bank-account-status__div" style={{ marginTop: '15px' }}>
          {!haveAlreadyConfirmedBankAccount && (
            <>
              <h1>
                To be able to begin receiving payments you must connect a Bank Account first
              </h1>
              <Button
                button="primary"
                className="membership_button"
                label={__('Connect a bank account')}
                icon={ICONS.FINANCE}
                navigate={'$/settings/tip_account'}
                style={{ maxWidth: '254px' }}
              />
            </>
          )}
          {haveAlreadyConfirmedBankAccount && (
            <><h1>
              Congratulations, you have successfully linked your bank account and can receive tips and memberships
            </h1></>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatorMembershipsTab;
