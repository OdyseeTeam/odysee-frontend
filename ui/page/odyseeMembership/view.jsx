// @flow
import React from 'react';
import moment from 'moment';
import Page from 'component/page';
import { Lbryio } from 'lbryinc';
import { getStripeEnvironment } from 'util/stripe';
import * as ICONS from 'constants/icons';
import Button from 'component/button';
let stripeEnvironment = getStripeEnvironment();

const odyseeChannelId = '80d2590ad04e36fb1d077a9b9e3a8bba76defdf8';
const odyseeChannelName = '@odysee';

type Props = {
  history: { action: string, push: (string) => void, replace: (string) => void },
  location: { search: string, pathname: string },
  totalBalance: ?number,
};

const OdyseeMembershipPage = (props: Props) => {
  const [cardSaved, setCardSaved] = React.useState();
  const [membershipOptions, setMembershipOptions] = React.useState();
  const [userMemberships, setUserMemberships] = React.useState();
  const [canceledMemberships, setCanceledMemberships] = React.useState();
  const [activeMemberships, setActiveMemberships] = React.useState();
  const [purchasedMemberships, setPurchasedMemberships] = React.useState([]);

  React.useEffect(function() {
    (async function() {
      try {
        // check if there is a payment method
        const response = await Lbryio.call('customer', 'status', {
          environment: stripeEnvironment,
        }, 'post');
        console.log('status (if there is a payment methods');
        console.log(response);
        // hardcoded to first card
        setCardSaved(response && response.PaymentMethods && response.PaymentMethods[0]);
      } catch (err) {
        console.log(err);
      }

      try {
        // check the available membership for odysee.com
        const response = await Lbryio.call('membership', 'list', {
          environment: stripeEnvironment,
          channel_id: odyseeChannelId,
          channel_name: odyseeChannelName,
        }, 'post');

        console.log('list, see all the available odysee memberships');
        console.log(response);
        setMembershipOptions(response);
      } catch (err) {
        console.log(err);
      }

      try {
        // show the memberships the user is subscribed to
        const response = await Lbryio.call('membership', 'mine', {
          environment: stripeEnvironment,
        }, 'post');

        console.log('mine, my subscriptions');
        console.log(response);

        let activeMemberships = [];
        let canceledMemberships = [];
        let purchasedMemberships = [];

        for (const membership of response) {
          const isActive = membership.Membership.auto_renew;
          if (isActive) {
            activeMemberships.push(membership);
          } else {
            canceledMemberships.push(membership);
          }
          purchasedMemberships.push(membership.Membership.membership_id);
        }

        setActiveMemberships(activeMemberships);
        setCanceledMemberships(canceledMemberships);
        setPurchasedMemberships(purchasedMemberships);

        setUserMemberships(response);
      } catch (err) {
        console.log(err);
      }
    })();
  }, []);

  const cancelMembership = async function(e) {
    const membershipId = e.target.getAttribute('membership-id');

    try {
      // show the memberships the user is subscribed to
      const response = await Lbryio.call('membership', 'cancel', {
        environment: stripeEnvironment,
        membership_id: membershipId,
      }, 'post');

      console.log('cancel, cancel membership response');
      console.log(response);
    } catch (err) {
      console.log(err);
    }
  };

  const purchaseMembership = async function(e) {
    const membershipId = e.currentTarget.getAttribute('membership-id');
    let subscriptionPeriod = e.currentTarget.getAttribute('membership-subscription-period');

    if (subscriptionPeriod === 'both') {
      subscriptionPeriod = false;
    } else if (subscriptionPeriod === 'yearly') {
      subscriptionPeriod = true;
    } else {
      return;
    }

    try {
      // show the memberships the user is subscribed to
      const response = await Lbryio.call('membership', 'buy', {
        environment: stripeEnvironment,
        membership_id: membershipId,
        yearly: subscriptionPeriod,
        channel_id: odyseeChannelId,
        channel_name: odyseeChannelName,
      }, 'post');

      console.log('purchase, purchase membership response');
      console.log(response);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <>
      <Page>
        {/* list available memberships offered by odysee */}
        <h1 style={{fontSize: '23px'}}>Odysee Memberships</h1>
        {cardSaved && membershipOptions && (
          <div>
            <h1 style={{marginTop: '17px', fontSize: '19px' }}>Available Memberships:</h1>
            { membershipOptions.map((membershipOption) => (
              <>
                <div style={{ 'margin-top': '16px', marginBottom: '10px'}}>
                  <h4 style={{marginBottom: '3px', fontWeight: '900', fontSize: '17px'}}>Name: {membershipOption.name}</h4>
                  <h4 style={{marginBottom: '3px'}}>Perks: {membershipOption.description}</h4>
                  { membershipOption.type === 'yearly' && (
                    <>
                      <h4 style={{marginBottom: '4px'}}>Subscription Period Options: Yearly</h4>
                      <h4 style={{marginBottom: '4px'}}>${(membershipOption.cost_usd * 12) / 100 } USD For A One Year Subscription (${membershipOption.cost_usd / 100} Per Month)</h4>
                    </>
                  )}
                  { membershipOption.type === 'both' && (
                    <>
                      <h4 style={{marginBottom: '4px'}}>Subscription Period Options: Yearly And Monthly</h4>
                      <h4 style={{marginBottom: '4px'}}>${(membershipOption.cost_usd * 12) / 100 } USD For A One Year Subscription (${membershipOption.cost_usd / 100} Per Month)</h4>
                      <h4 style={{marginBottom: '4px'}}>${(membershipOption.cost_usd) / 100 } USD Per Month For A Monthly Renewing Subscription)</h4>
                    </>
                  )}
                  { membershipOption.type === 'both' && userMemberships && !purchasedMemberships.includes(membershipOption.id) && (
                    <>
                      <Button button="secondary" onClick={purchaseMembership} membership-id={membershipOption.id} membership-subscription-period={membershipOption.type} style={{display: 'block', marginBottom: '10px', marginTop: '10px'}} label={__('Purchase a one year membership')} icon={ICONS.FINANCE} />
                      {'\n'}
                      <Button button="secondary" onClick={purchaseMembership} membership-id={membershipOption.id} membership-subscription-period={membershipOption.type} label={__('Purchase a one month membership')} icon={ICONS.FINANCE} />
                    </>
                  )}
                  { membershipOption.type === 'yearly' && userMemberships && !purchasedMemberships.includes(membershipOption.id) && (
                    <>
                      <Button button="secondary" onClick={purchaseMembership} membership-id={membershipOption.id} membership-subscription-period={membershipOption.type}  label={__('Purchase a one year membership')} icon={ICONS.FINANCE} style={{marginTop: '4px', marginBottom: '5px'}} />
                    </>
                  )}
                </div>
              </>
            ))}

            <h1 style={{fontSize: '23px', marginTop: '36px', marginBottom: '13px'}}>Your Memberships</h1>

            {/* list of active memberships from user */}
            <div style={{marginBottom: '34px'}}>
              <h1 style={{fontSize: '19px'}}>Active Memberships</h1>
              {activeMemberships && activeMemberships.length === 0 && (<>
                <h4>You currently have no active memberships</h4>
              </>)}
              { activeMemberships && activeMemberships.map((membership) => (
                <>
                  <div style={{ 'margin-top': '9px', marginBottom: '10px'}}>
                    <h4 style={{marginBottom: '3px', fontWeight: '900', fontSize: '17px'}}>Name: {membership.MembershipDetails.name}</h4>
                    <h4 style={{marginBottom: '3px'}}>Registered On: {membership.Membership.created_at}</h4>
                    <h4 style={{marginBottom: '3px'}}>Auto-Renews On: {membership.Subscription.current_period_end}</h4>
                    { membership.type === 'yearly' && (
                      <>
                        <h4 style={{marginBottom: '4px'}}>Subscription Period Options: Yearly</h4>
                        <h4 style={{marginBottom: '4px'}}>${(membership.cost_usd * 12) / 100 } USD For A One Year Subscription (${membership.cost_usd / 100} Per Month)</h4>
                      </>
                    )}
                  </div>
                  <Button button="secondary" membership-id={membership.Membership.membership_id} onClick={cancelMembership} style={{display: 'block', marginBottom: '8px'}} label={__('Cancel membership')} icon={ICONS.FINANCE} />
                </>
              ))}
            </div>

            {/* list canceled memberships of user */}
            <h1 style={{fontSize: '19px'}}>Canceled Memberships</h1>
            {canceledMemberships && canceledMemberships.length === 0 && (<>
              <h4>You currently have no active memberships</h4>
            </>)}
            { canceledMemberships && canceledMemberships.map((membership) => (
              <>
                <div style={{ 'margin-top': '9px', marginBottom: '10px'}}>
                  <h4 style={{marginBottom: '3px', fontWeight: '900', fontSize: '17px'}}>Name: {membership.MembershipDetails.name}</h4>
                  <h4 style={{marginBottom: '3px'}}>Registered On: {membership.Membership.created_at}</h4>
                  <h4 style={{marginBottom: '3px'}}>Canceled At: {membership.Subscription.canceled_at}</h4>
                  <h4 style={{marginBottom: '3px'}}>Still Valid Until: {membership.Membership.expires}</h4>
                </div>
              </>
            ))}
          </div>
        )}
        {cardSaved === false && (
          <div>
            <br />
            <h2 className={'getPaymentCard'}>You still need to register a card, please do so here</h2>
          </div>
        )}
        {(cardSaved === undefined || setMembershipOptions === undefined) && (
          <div>
            <br />
            <h2>Loading...</h2>
          </div>
        )}
      </Page>
    </>
  );
};

export default OdyseeMembershipPage;
