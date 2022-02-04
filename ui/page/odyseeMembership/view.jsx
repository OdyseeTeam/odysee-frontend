// @flow
import React from 'react';
import moment from 'moment';
import Page from 'component/page';
import { Lbryio } from 'lbryinc';
import { getStripeEnvironment } from 'util/stripe';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import * as MODALS from 'constants/modal_types';
import Card from 'component/common/card';
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
  const [hasShownModal, setHasShownModal] = React.useState(false);

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

  function buildPurchaseString(price, interval, plan) {
    console.log('plan');
    console.log(plan);
    let featureString;
    if (plan === 'Premium') {
      featureString = 'Your badges will be shown on up to three channels and you will have early access to new features. ';
    } else if (plan === 'Premium+') {
      featureString = 'Your feature of no ads applies site-wide and badges are shown for up to three channels. ';
    }

    let purchaseString = `You are purchasing a ${interval}ly membership, that is active immediately ` +
      `and will resubscribe ${interval}ly at a price of USD $${price / 100}. ` +
      featureString +
      'You can cancel the membership at any time and you can also close this window and choose a different subscription option.';

    return purchaseString;
  }

  const purchaseMembership = function (e, membershipOption, price) {
    e.preventDefault();
    e.stopPropagation();

    console.log(membershipOption);
    console.log(price);

    const planName = membershipOption.Membership.name;

    const membershipId = e.currentTarget.getAttribute('membership-id');
    const priceId = e.currentTarget.getAttribute('price-id');
    const purchaseString = buildPurchaseString(price.unit_amount, price.recurring.interval, planName);

    openModal(MODALS.CONFIRM_ODYSEE_MEMBERSHIP, {
      membershipId,
      odyseeChannelId: userChannelClaimId, // TODO: this needs to be renamed
      odyseeChannelName: userChannelName,
      priceId,
      purchaseString,
      plan: planName,
    });
  };

  const cancelMembership = async function (e, membership) {
    const membershipId = e.currentTarget.getAttribute('membership-id');

    console.log(membership);

    const cancellationString = 'You are cancelling your Odysee Membership. You will still have access to all the paid ' +
      'features until the point of the expiration of your current membership, at which point you will not be charged ' +
      'again and your membership will no longer be active.';

    openModal(MODALS.CONFIRM_ODYSEE_MEMBERSHIP, {
      membershipId,
      hasMembership,
      purchaseString: cancellationString,
    });
  };

  function convertPriceToString(price) {
    const interval = price.recurring.interval;

    if (interval === 'year') {
      return 'Yearly';
    } else if (interval === 'month') {
      return 'Monthly';
    }
  }

  function capitalizeWord(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  function buildCurrencyDisplay(priceObject) {
    let currencySymbol;
    if (priceObject.currency === 'eur') {
      currencySymbol = '€';
    } else if (priceObject.currency === 'usd') {
      currencySymbol = '$';
    }

    const currency = priceObject.currency.toUpperCase();

    return currency + ' ' + currencySymbol;
  }

  const urlSearchParams = new URLSearchParams(window.location.search);
  const params = Object.fromEntries(urlSearchParams.entries());

  const { interval, plan, pageLocation } = params;

  console.log(params);
  const confirmValue = params.confirm;
  const planValue = params.plan;
  // const pageLocation = params.pageLocation;

  // add a bit of a delay otherwise it's a bit jarring
  let timeoutValue = 300;
  if (pageLocation === 'confirmPage') {
    timeoutValue = 300;
  }

  if (!stillWaitingFromBackend && planValue) {
    setTimeout(function() {
      // clear query params
      window.history.replaceState(null, null, window.location.pathname);

      setHasShownModal(true);

      // open confirm purchase modal
      // document.querySelector(`[plan=${plan}][interval=${interval}]`).click();
      document.querySelector('[plan="' + plan + '"][interval="' + interval + '"]').click();
    }, timeoutValue);
  }

  console.log('plan value');
  console.log(planValue);

  return (
    <>
      <Page>
        {!stillWaitingFromBackend && purchasedMemberships.length === 0 && (!planValue && !hasShownModal) ? (
        // {!stillWaitingFromBackend && purchasedMemberships.length === 0 ? (
        // {!changeFrontend ? (
          <MembershipSplash pageLocation={'confirmPage'} />
        ) : (
          <div className={'card-stack'}>
            {/* list available memberships offered by odysee */}
            <h1 style={{ fontSize: '23px' }}>Odysee Memberships</h1>
            {!stillWaitingFromBackend && cardSaved !== false && (
              <div style={{ marginTop: '10px' }}>
                <ChannelSelector uri={activeChannelClaim && activeChannelClaim.permanent_url} />
              </div>
            )}

            {/* received list of memberships from backend */}
            {!stillWaitingFromBackend && membershipOptions && purchasedMemberships.length < 2 && cardSaved !== false && (
              <>

                <div className="card__title-section">
                  <h2 className="card__title">Available Memberships</h2>
                </div>
                <Card>

                  {membershipOptions.map((membershipOption) => (
                    <>
                      {purchasedMemberships && !purchasedMemberships.includes(membershipOption.Membership.id) && (
                        <>
                          <h4 className="membership_title">
                            {membershipOption.Membership.name}
                          </h4>
                          <h4 className="membership_subtitle">
                            {membershipOption.Membership.description}
                          </h4>
                          {membershipOption.Prices.map((price) => (
                            <>
                              {/* dont show a monthly Premium membership option */}
                              {!(price.recurring.interval === 'month' && membershipOption.Membership.name === 'Premium') && (
                                <>
                                  {price.currency !== 'eur' && (
                                    <>
                                      <h4 className="membership_info">
                                        <b>Interval:</b> {convertPriceToString(price)}
                                      </h4>
                                      <h4 className="membership_info">
                                        <b>Price:</b> {buildCurrencyDisplay(price)}
                                        {price.unit_amount / 100}/{capitalizeWord(price.recurring.interval)}
                                      </h4>
                                      <Button
                                        button="secondary"
                                        onClick={(e) => purchaseMembership(e, membershipOption, price)}
                                        membership-id={membershipOption.Membership.id}
                                        membership-subscription-period={membershipOption.Membership.type}
                                        price-id={price.id}
                                        className="membership_button"
                                        label={__('Subscribe to a ' + price.recurring.interval + 'ly membership')}
                                        icon={ICONS.FINANCE}
                                        interval={price.recurring.interval}
                                        plan={membershipOption.Membership.name}
                                      />
                                    </>
                                  )}
                                </>
                              )}
                            </>
                          ))}
                        </>
                      )}
                    </>
                  ))}
                </Card>
              </>
            )}
            {!stillWaitingFromBackend && cardSaved === true && (
              <>
                <div className="card__title-section">
                  <h2 className="card__title">Your active Memberships</h2>
                </div>

                <Card>
                  {/* list of active memberships from user */}
                  <div>
                    { /* <h1 style={{ fontSize: '19px' }}>Active Memberships</h1> */ }
                    {!stillWaitingFromBackend && activeMemberships && activeMemberships.length === 0 && (
                      <>
                        <h4>You currently have no active memberships</h4>
                      </>
                    )}
                    {!stillWaitingFromBackend &&
                      activeMemberships &&
                      activeMemberships.map((membership) => (
                        <>
                          <h4 className="membership_title">
                            {membership.MembershipDetails.name}
                          </h4>
                          <h4 className="membership_info">
                            <b>Registered On:</b> {formatDate(membership.Membership.created_at)}
                          </h4>
                          <h4 className="membership_info">
                            <b>Auto-Renews On:</b> {formatDate(membership.Subscription.current_period_end * 1000)}
                          </h4>
                          {!stillWaitingFromBackend && membership.type === 'yearly' && (
                            <>
                              <h4 className="membership_info"><b>Subscription Period Options:</b> Yearly</h4>
                              <h4 className="membership_info">
                                ${(membership.cost_usd * 12) / 100} USD For A One Year Subscription ($
                                {membership.cost_usd / 100} Per Month)
                              </h4>
                            </>
                          )}
                          <Button
                            button="secondary"
                            membership-id={membership.Membership.membership_id}
                            onClick={(e) => cancelMembership(e, membership)}
                            className="membership_button"
                            label={__('Cancel membership')}
                            icon={ICONS.FINANCE}
                          />
                        </>
                      ))}
                  </div>
                </Card>
                <>
                  {/* list canceled memberships of user */}
                  <div className="card__title-section">
                    <h2 className="card__title">Canceled Memberships</h2>
                  </div>
                  <Card>
                    {canceledMemberships && canceledMemberships.length === 0 && (
                      <>
                        <h4>You currently have no canceled memberships</h4>
                      </>
                    )}
                    {canceledMemberships &&
                      canceledMemberships.map((membership) => (
                        <>
                          <h4 className="membership_title">
                            {membership.MembershipDetails.name}
                          </h4>
                          <h4 className="membership_info">
                            <b>Registered On:</b> {formatDate(membership.Membership.created_at)}
                          </h4>
                          <h4 className="membership_info">
                            <b>Canceled On:</b> {formatDate(membership.Subscription.canceled_at * 1000)}
                          </h4>
                          <h4 className="membership_info">
                            <b>Still Valid Until:</b> {formatDate(membership.Membership.expires)}
                          </h4>
                        </>
                      ))}
                  </Card>
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
                  className="membership_button"
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
                    className="membership_button"
                    onClick={deleteData}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </Page>
    </>
  );
};

export default OdyseeMembershipPage;
