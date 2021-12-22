// restore flow
/* eslint-disable no-undef */
/* eslint-disable react/prop-types */
import React from 'react';
import Page from 'component/page';
import Card from 'component/common/card';
import { Lbryio } from 'lbryinc';
import Plastic from 'react-plastic';
import Button from 'component/button';
import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';
import * as PAGES from 'constants/pages';
import { STRIPE_PUBLIC_KEY } from 'config';
import { getStripeEnvironment } from 'util/stripe';
let stripeEnvironment = getStripeEnvironment();

const APIS_DOWN_ERROR_RESPONSE = __('There was an error from the server, please try again later');
const CARD_SETUP_ERROR_RESPONSE = __('There was an error getting your card setup, please try again later');

type Props = {
  history: { action: string, push: (string) => void, replace: (string) => void },
  location: { search: string, pathname: string },
  totalBalance: ?number,
};

const OdyseeMembershipPage = (props: Props) => {

  const [cardSaved, setCardSaved] = React.useState();

  React.useEffect(function(){

    Lbryio.call('customer', 'status', {
      environment: stripeEnvironment,
    }, 'post').then(function(response){
      setCardSaved(response && response.PaymentMethods && response.PaymentMethods[0]);
    });

  }, []);

  React.useEffect(function(){
    console.log('running here!');
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
        {cardSaved && (
          <div>
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
        {cardSaved === undefined && (
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
