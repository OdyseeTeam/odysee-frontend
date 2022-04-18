// @flow
import React from 'react';
import * as ICONS from 'constants/icons';
import Button from 'component/button';
import { URL } from 'config';
import ChannelSelector from 'component/channelSelector';
import { formatLbryUrlForWeb } from 'util/url';
import CopyableText from 'component/copyableText';

type Props = {
  // -- redux --
  activeChannelClaim: ?ChannelClaim,
  bankAccountConfirmed: ?boolean,
  doTipAccountStatus: (params: any) => void,
};

function CreatorMembershipsTab(props: Props) {
  const { bankAccountConfirmed, activeChannelClaim, doTipAccountStatus } = props;

  React.useEffect(() => {
    if (bankAccountConfirmed === undefined) {
      doTipAccountStatus({ getBank: true });
    }
  }, [bankAccountConfirmed, doTipAccountStatus]);

  let localMembershipPageUrl = '';
  let remoteMembershipPageUrl;
  if (activeChannelClaim) {
    remoteMembershipPageUrl = `${URL}${formatLbryUrlForWeb(activeChannelClaim.canonical_url)}?view=membership`;
    localMembershipPageUrl = `${formatLbryUrlForWeb(activeChannelClaim.canonical_url)}?view=membership`;
  }

  return (
    <div className="my-membership__div">
      <h1 style={{ fontSize: '20px', marginTop: '25px', marginBottom: '14px' }}>{__('Membership Page')}</h1>

      <ChannelSelector hideAnon style={{ marginBottom: '17px' }} />

      {activeChannelClaim && (
        <Button
          button="primary"
          className="membership_button"
          label={__('View your membership page')}
          icon={ICONS.UPGRADE}
          navigate={`${localMembershipPageUrl}`}
        />
      )}

      <h1 style={{ marginTop: '10px' }}>
        {__('You can also click the button below to copy your membership page url')}
      </h1>

      <CopyableText
        className="membership-page__copy-button"
        primaryButton
        copyable={remoteMembershipPageUrl}
        snackMessage={__('Page location copied')}
        style={{ maxWidth: '535px', marginTop: '5px' }}
      />

      <h1 style={{ fontSize: '20px', marginTop: '25px' }}>{__('Received Funds')}</h1>

      <h1 style={{ marginTop: '10px' }}>{__('You currently have 0 supporters')}</h1>

      <h1 style={{ marginTop: '10px' }}>{__('Your estimated monthly income is currently $0')}</h1>

      <h1 style={{ marginTop: '10px' }}>{__('You have received $0 total from your supporters')}</h1>

      <h1 style={{ marginTop: '10px' }}>{__('You do not any withdrawable funds')}</h1>

      <div className="bank-account-information__div" style={{ marginTop: '33px' }}>
        <h1 style={{ fontSize: '20px' }}>{__('Bank Account Status')}</h1>
        <div className="bank-account-status__div" style={{ marginTop: '15px' }}>
          {!bankAccountConfirmed && (
            <>
              <h1>{__('To be able to begin receiving payments you must connect a Bank Account first')}</h1>
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
          {bankAccountConfirmed && (
            <h1>
              {__(
                'Congratulations, you have successfully linked your bank account and can receive tips and memberships'
              )}
            </h1>
          )}
        </div>
      </div>
    </div>
  );
}

export default CreatorMembershipsTab;
