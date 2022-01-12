// @flow
import React from 'react';
import Page from 'component/page';
import { Lbryio } from 'lbryinc';
import { getStripeEnvironment } from 'util/stripe';
let stripeEnvironment = getStripeEnvironment();

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
  const [userMembership, setUserMemberships] = React.useState();

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
        <h1 style={{fontSize: '19px'}}>Odysee Memberships</h1>
        {cardSaved && membershipOptions && (
          <div>
            <h1 style={{marginTop: '17px', fontSize: '16px' }}>Available Memberships:</h1>
            { membershipOptions.map((membershipOption) => (
              <>
                <div style={{ 'margin-top': '16px', marginBottom: '10px'}}>
                  <h4 style={{marginBottom: '3px'}}>Name: {membershipOption.name}</h4>
                  <h4 style={{marginBottom: '3px'}}>Description: {membershipOption.description}</h4>
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
                </div>
              </>
            ))}
            <br />
            <h2 className={'membership1'}>Click here to sign up for 99 cents a month membership for one year</h2>
            <br />
            <h2 className={'membership2'}>Click here to sign up for $2.99 a month membership on monthly recurring</h2>
            <br />
            <h2 className={'cancel'}>Click here to cancel your membership</h2>
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
