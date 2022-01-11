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

  console.log(props);

  const [cardSaved, setCardSaved] = React.useState();
  const [membershipOptions, setMembershipOptions] = React.useState();

  React.useEffect(function(){
    // check if there is a payment method
    Lbryio.call('customer', 'status', {
      environment: stripeEnvironment,
    }, 'post').then(function(response){
      console.log('status');
      console.log(response);
      // hardcoded to first card
      setCardSaved(response && response.PaymentMethods && response.PaymentMethods[0]);
    });

    // check the available payment methods
    Lbryio.call('membership', 'list', {
      environment: stripeEnvironment,
      channel_id: odyseeChannelId,
      channel_name: odyseeChannelName,
    }, 'post').then(function(response){
      console.log('membership');
      console.log(response);
      setMembershipOptions(response);
    });

    Lbryio.call('membership', 'mine', {
      environment: stripeEnvironment,
    }, 'post').then(function(response){
      console.log('mine');
      console.log(response);
    });
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
        <h1>Odysee Memberships</h1>
        {cardSaved && membershipOptions && (
          <div>
            { membershipOptions.map((membershipOption) => (
              <>
                <div style={{ 'margin-top': '5px';}}>
                  {membershipOption.type}
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
