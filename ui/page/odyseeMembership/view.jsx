// @flow
import React from 'react';
import moment from 'moment';
import Page from 'component/page';
import { Lbryio } from 'lbryinc';
import { getStripeEnvironment } from 'util/stripe';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import * as MODALS from 'constants/modal_types';
import MembershipSplash from 'component/membershipSplash';
import Button from 'component/button';
import ChannelSelector from 'component/channelSelector';
let stripeEnvironment = getStripeEnvironment();

// const isDev = process.env.NODE_ENV !== 'production';
const isDev = true;

// odysee channel information since the memberships are only for Odysee
const odyseeChannelId = '80d2590ad04e36fb1d077a9b9e3a8bba76defdf8';
const odyseeChannelName = '@odysee';

type Props = {
  history: { action: string, push: (string) => void, replace: (string) => void },
  location: { search: string, pathname: string },
  totalBalance: ?number,
};

const OdyseeMembershipPage = (props: Props) => {
  const { openModal, odyseeMembership, activeChannelClaim } = props;

  const userChannelName = activeChannelClaim && activeChannelClaim.name;
  const userChannelClaimId = activeChannelClaim && activeChannelClaim.claim_id;

  const [cardSaved, setCardSaved] = React.useState();
  const [membershipOptions, setMembershipOptions] = React.useState();
  const [userMemberships, setUserMemberships] = React.useState();
  const [canceledMemberships, setCanceledMemberships] = React.useState();
  const [activeMemberships, setActiveMemberships] = React.useState();
  const [purchasedMemberships, setPurchasedMemberships] = React.useState([]);

  const hasMembership = activeMemberships && activeMemberships.length > 0;

  React.useEffect(function () {
    (async function () {
      try {
        // check if there is a payment method
        const response = await Lbryio.call(
          'customer',
          'status',
          {
            environment: stripeEnvironment,
          },
          'post'
        );
        console.log('status (if there is a payment methods');
        console.log(response);
        // hardcoded to first card
        const hasAPaymentCard = Boolean(response && response.PaymentMethods && response.PaymentMethods[0]);
        console.log('card');
        console.log(hasAPaymentCard);

        setCardSaved(hasAPaymentCard);
      } catch (err) {
        console.log(err);
      }

      try {
        // check the available membership for odysee.com
        const response = await Lbryio.call(
          'membership',
          'list',
          {
            environment: stripeEnvironment,
            channel_id: odyseeChannelId,
            channel_name: odyseeChannelName,
          },
          'post'
        );

        console.log('list, see all the available odysee memberships');
        console.log(response);
        setMembershipOptions(response);
      } catch (err) {
        console.log(err);
      }

      try {
        // show the memberships the user is subscribed to
        const response = await Lbryio.call(
          'membership',
          'mine',
          {
            environment: stripeEnvironment,
          },
          'post'
        );

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

  const cancelMembership = async function (e) {
    const membershipId = e.currentTarget.getAttribute('membership-id');

    openModal(MODALS.CONFIRM_ODYSEE_MEMBERSHIP, {
      membershipId,
      hasMembership,
    });
  };

  const stillWaitingFromBackend =
    purchasedMemberships === undefined ||
    cardSaved === undefined ||
    membershipOptions === undefined ||
    userMemberships === undefined;

  const formatDate = function (date) {
    return moment(new Date(date)).format('MMMM DD YYYY');
  };

  const deleteData = async function () {
    const response = await Lbryio.call('membership', 'clear', {}, 'post');

    console.log('list, see all the available odysee memberships');
    console.log(response);
    console.log('delete data');
    // $FlowFixMe
    location.reload();
  };

  const purchaseMembership = async function (e) {
    e.preventDefault();
    e.stopPropagation();

    const membershipId = e.currentTarget.getAttribute('membership-id');
    const priceId = e.currentTarget.getAttribute('price-id');

    openModal(MODALS.CONFIRM_ODYSEE_MEMBERSHIP, {
      membershipId,
      odyseeChannelId: userChannelClaimId,
      odyseeChannelName: userChannelName,
      priceId,
    });
  };

  function convertPriceToString(price){
    const interval = price.recurring.interval;

    if(interval === 'year'){
      return 'Yearly'
    } else if(interval === 'month') {
      return 'Monthly'
    }
  }

  function capitalizeWord(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  function buildCurrencyDisplay(priceObject) {
    let currencySymbol;
    if(priceObject.currency === 'eur'){
      currencySymbol = '€'
    } else if (priceObject.currency === 'usd'){
      currencySymbol = '$';
    }

    const currency = priceObject.currency.toUpperCase();

    return currency + ' ' + currencySymbol;
  }

  const urlSearchParams = new URLSearchParams(window.location.search);
  const params = Object.fromEntries(urlSearchParams.entries());

  console.log(params);
  const confirmValue = params.confirm;
  const planValue = params.plan;
  const pageLocation = params.pageLocation;

  let changeFrontend = false;
  if(pageLocation === 'confirmPage'){
    changeFrontend = true;
  }

  if(!stillWaitingFromBackend && planValue){
    openModal(MODALS.CONFIRM_ODYSEE_MEMBERSHIP, {
      membershipId: 1,
      hasMembership,
    });
  }

  console.log('plan value')
  console.log(planValue);

  return (
    <>
      <Page>
        {/*{!stillWaitingFromBackend && purchasedMemberships.length === 0 ? (*/}
        {!changeFrontend ? (
          <MembershipSplash pageLocation={'confirmPage'} />
        ) : (
          <>
            {/* list available memberships offered by odysee */}
            <h1 style={{ fontSize: '23px' }}>Odysee Memberships</h1>
            {!stillWaitingFromBackend && cardSaved !== false && (
              <div style={{ marginTop: '10px' }}>
                <ChannelSelector uri={activeChannelClaim && activeChannelClaim.permanent_url}/>
              </div>
            )}
            {/* received list of memberships from backend */}
            {!stillWaitingFromBackend && membershipOptions && purchasedMemberships.length < 2 && cardSaved !== false && (
              <div>
                <h1 style={{ marginTop: '17px', fontSize: '19px' }}>Available Memberships:</h1>
                {membershipOptions.map((membershipOption) => (
                  <>
                    {purchasedMemberships && !purchasedMemberships.includes(membershipOption.Membership.id) && (
                      <div style={{ 'margin-top': '16px', marginBottom: '29px' }}>
                        <h4 style={{ marginBottom: '3px', fontWeight: '900', fontSize: '17px' }}>
                          Name: {membershipOption.Membership.name}
                        </h4>
                        <h4 style={{ marginBottom: '15px', fontSize: '16px', fontWeight: '900' }}>Perks: {membershipOption.Membership.description}</h4>
                        {membershipOption.Prices.map((price) => (
                          <>
                            {price.currency !== 'eur' && (
                              <>
                                <h4 style={{ marginBottom: '4px' }}>Subscription Interval: {convertPriceToString(price)}</h4>
                                <h4 style={{ marginBottom: '4px' }}>Subscription Price: {buildCurrencyDisplay(price)}{price.unit_amount/100}/{capitalizeWord(price.recurring.interval)}</h4>
                                <Button
                                  button="secondary"
                                  onClick={purchaseMembership}
                                  membership-id={membershipOption.Membership.id}
                                  membership-subscription-period={membershipOption.Membership.type}
                                  price-id={price.id}
                                  style={{ display: 'block', marginBottom: '18px', marginTop: '10px' }}
                                  label={__('Subscribe to a ' + price.recurring.interval + 'ly membership')}
                                  icon={ICONS.FINANCE}
                                />
                              </>
                            )}
                          </>
                        ))}
                      </div>
                    )}
                  </>
                ))}
              </div>
            )}
            {!stillWaitingFromBackend && cardSaved === true && (
              <>
                <h1 style={{ fontSize: '23px', marginTop: '-2px', marginBottom: '13px' }}>Your Memberships</h1>

                {/* list of active memberships from user */}
                <div style={{ marginBottom: '34px' }}>
                  <h1 style={{ fontSize: '19px' }}>Active Memberships</h1>
                  {!stillWaitingFromBackend && activeMemberships && activeMemberships.length === 0 && (
                    <>
                      <h4>You currently have no active memberships</h4>
                    </>
                  )}
                  {!stillWaitingFromBackend &&
                    activeMemberships &&
                    activeMemberships.map((membership) => (
                      <>
                        <div style={{ 'margin-top': '9px', marginBottom: '10px' }}>
                          <h4 style={{ marginBottom: '3px', fontWeight: '900', fontSize: '17px' }}>
                            Name: {membership.MembershipDetails.name}
                          </h4>
                          <h4 style={{ marginBottom: '3px' }}>
                            Registered On: {formatDate(membership.Membership.created_at)}
                          </h4>
                          <h4 style={{ marginBottom: '3px' }}>
                            Auto-Renews On: {formatDate(membership.Subscription.current_period_end * 1000)}
                          </h4>
                          {!stillWaitingFromBackend && membership.type === 'yearly' && (
                            <>
                              <h4 style={{ marginBottom: '4px' }}>Subscription Period Options: Yearly</h4>
                              <h4 style={{ marginBottom: '4px' }}>
                                ${(membership.cost_usd * 12) / 100} USD For A One Year Subscription ($
                                {membership.cost_usd / 100} Per Month)
                              </h4>
                            </>
                          )}
                        </div>
                        <Button
                          button="secondary"
                          membership-id={membership.Membership.membership_id}
                          onClick={cancelMembership}
                          style={{ display: 'block', marginBottom: '20px' }}
                          label={__('Cancel membership')}
                          icon={ICONS.FINANCE}
                        />
                      </>
                    ))}
                </div>
                <>
                  {/* list canceled memberships of user */}
                  <h1 style={{ fontSize: '19px' }}>Canceled Memberships</h1>
                  {canceledMemberships && canceledMemberships.length === 0 && (
                    <>
                      <h4>You currently have no canceled memberships</h4>
                    </>
                  )}
                  {canceledMemberships &&
                    canceledMemberships.map((membership) => (
                      <>
                        <div style={{ 'margin-top': '9px', marginBottom: '10px' }}>
                          <h4 style={{ marginBottom: '3px', fontWeight: '900', fontSize: '17px' }}>
                            Name: {membership.MembershipDetails.name}
                          </h4>
                          <h4 style={{ marginBottom: '3px' }}>
                            Registered On: {formatDate(membership.Membership.created_at)}
                          </h4>
                          <h4 style={{ marginBottom: '3px' }}>
                            Canceled At: {formatDate(membership.Subscription.canceled_at * 1000)}
                          </h4>
                          <h4 style={{ marginBottom: '15px' }}>
                            Still Valid Until: {formatDate(membership.Membership.expires)}
                          </h4>
                        </div>
                      </>
                    ))}
                </>
              </>
            )}
            {!stillWaitingFromBackend && cardSaved === false && (
              <div>
                <br />
                <h2 className={'getPaymentCard'}>
                  Please save a card as a payment method so you can join a membership
                </h2>

                <Button
                  button="secondary"
                  label={__('Add A Card')}
                  icon={ICONS.SETTINGS}
                  navigate={`/$/${PAGES.SETTINGS_STRIPE_CARD}`}
                  style={{ marginTop: '10px' }}
                />
              </div>
            )}
            {stillWaitingFromBackend && (
              <div>
                <h2 style={{ fontSize: '20px', marginTop: '10px' }}>Loading...</h2>
              </div>
            )}
            {isDev && (
              <>
                <h1 style={{ marginTop: '30px', fontSize: '20px' }}>Clear Membership Data (Only Available On Dev)</h1>
                <div>
                  <Button
                    button="secondary"
                    label={__('Clear Membership Data')}
                    icon={ICONS.SETTINGS}
                    style={{ marginTop: '10px' }}
                    onClick={deleteData}
                  />
                </div>
              </>
            )}
          </>
        )}
      </Page>
    </>
  );
};

export default OdyseeMembershipPage;
