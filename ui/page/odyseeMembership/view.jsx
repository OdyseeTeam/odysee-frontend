// @flow
import React from 'react';
import Page from 'component/page';
import { Lbryio } from 'lbryinc';
import { getStripeEnvironment } from 'util/stripe';
let stripeEnvironment = getStripeEnvironment();
import * as ICONS from 'constants/icons';
import moment from 'moment';
import Button from 'component/button';


console.log(ICONS);
console.log(moment);

const odyseeChannelId = '80d2590ad04e36fb1d077a9b9e3a8bba76defdf8';
const odyseeChannelName = '@odysee';

type Props = {
  history: { action: string, push: (string) => void, replace: (string) => void },
  location: { search: string, pathname: string },
  totalBalance: ?number,
};

const OdyseeMembershipPage = (props: Props) => {
  // console.log(props);

  const [cardSaved, setCardSaved] = React.useState();
  const [membershipOptions, setMembershipOptions] = React.useState();
  const [userMemberships, setUserMemberships] = React.useState();
  const [canceledMemberships, setCanceledMemberships] = React.useState();
  const [activeMemberships, setActiveMemberships] = React.useState();
  // const [userMemberships, setUserMemberships] = React.useState();

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

        for(const membership of response){
          console.log(membership.Membership);
          const isActive = membership.Membership.auto_renew;
          if(isActive){
            activeMemberships.push(membership);
          } else {
            canceledMemberships.push(membership);
          }
          console.log(isActive);
        }

        setActiveMemberships(activeMemberships);
        setCanceledMemberships(canceledMemberships);

        setUserMemberships(response);
      } catch (err) {
        console.log(err);
      }

      // try {
      //   // show the memberships the user is subscribed to
      //   const response = await Lbryio.call('membership', 'cancel', {
      //     environment: stripeEnvironment,
      //     membership_id: 2,
      //   }, 'post');
      //
      //   console.log('cancel, cancel membership response');
      //   console.log(response);
      //
      // } catch (err) {
      //   console.log(err);
      // }
    })();
  }, []);



  React.useEffect(function(){
    const membershipDiv = document.querySelector('.membership');

    const membershipDiv1 = document.querySelector('.membership1');

    const cancelDiv = document.querySelector('.cancelDiv');

    if (membershipDiv) membershipDiv.onclick = function() {
      console.log('hello!');
    };

    if (membershipDiv1) membershipDiv1.onclick = function() {
      console.log('hello!');
    };

    if (cancelDiv) cancelDiv.onclick = function() {
      console.log('hello!');
    };
  }, [cardSaved]);

  return (
    <>
      <Page>
        {/* list available memberships offered by odysee */}
        <h1 style={{fontSize: '19px'}}>Odysee Memberships</h1>
        {cardSaved && membershipOptions && (
          <div>
            <h1 style={{marginTop: '17px', fontSize: '16px' }}>Available Memberships:</h1>
            { membershipOptions.map((membershipOption) => (
              <>
                <div style={{ 'margin-top': '16px', marginBottom: '10px'}}>
                  <h4 style={{marginBottom: '3px'}}>Name: {membershipOption.name}</h4>
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
                  <Button button="secondary" style={{display: 'block', marginBottom: '8px'}} label={__('Purchase a one year membership')} icon={ICONS.FINANCE} />
                  {'\n'}
                  <Button button="secondary" label={__('Purchase a one month membership')} icon={ICONS.FINANCE} />
                </div>
              </>

            ))}

            <h1 style={{fontSize: '23px', marginTop: '20px'}}>Your Memberships</h1>

            {/* list of active memberships from user */}
            <div style={{marginBottom: '20px'}}>
              <h1 style={{fontSize: '19px'}}>Active Memberships</h1>
              {activeMemberships && activeMemberships.length === 0 && (<>
                <h4>You currently have no active memberships</h4>
              </>)}
              { activeMemberships && activeMemberships.map((membership) => (
                <>
                  <div style={{ 'margin-top': '16px', marginBottom: '10px'}}>
                    <h4 style={{marginBottom: '3px'}}>Name: {membership.MembershipDetails.name}</h4>
                    <h4 style={{marginBottom: '3px'}}>Registered On: {membership.Membership.created_at}</h4>
                    <h4 style={{marginBottom: '3px'}}>Auto-Renews On: {membership.Subscription.current_period_end}</h4>
                    { membership.type === 'yearly' && (
                      <>
                        <h4 style={{marginBottom: '4px'}}>Subscription Period Options: Yearly</h4>
                        <h4 style={{marginBottom: '4px'}}>${(membership.cost_usd * 12) / 100 } USD For A One Year Subscription (${membershipOption.cost_usd / 100} Per Month)</h4>
                      </>
                    )}
                  </div>
                </>
              ))}
              <Button button="secondary" style={{display: 'block', marginBottom: '8px'}} label={__('Cancel membership')} icon={ICONS.FINANCE} />
            </div>

            {/* list canceled memberships of user */}
            <h1 style={{fontSize: '19px'}}>Canceled Memberships</h1>
            {canceledMemberships && canceledMemberships.length === 0 && (<>
              <h4>You currently have no active memberships</h4>
            </>)}
            { canceledMemberships && canceledMemberships.map((membership) => (
              <>
                <div style={{ 'margin-top': '16px', marginBottom: '10px'}}>
                  <h4 style={{marginBottom: '3px'}}>Membership Type: {membership.MembershipDetails.name}</h4>
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
