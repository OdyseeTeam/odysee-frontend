// @flow
import * as React from 'react';
import classnames from 'classnames';
import * as MODALS from 'constants/modal_types';
import Tag from 'component/tag';
import Button from 'component/button';
import * as ICONS from 'constants/icons';
import { Lbryio } from 'lbryinc';
import { getStripeEnvironment } from 'util/stripe';
let stripeEnvironment = getStripeEnvironment();

type Props = {
  tags: Array<string>,
  followedTags: Array<Tag>,
  type: string,
};

export default function PreorderButton(props: Props) {
  const { tags, followedTags, type, preorderTag, doOpenModal, uri, claim, claimIsMine } = props;

  console.log('claim is mine');
  console.log(claimIsMine);

  console.log(claim);
  const claimId = claim.claim_id;
  const myUpload = claimIsMine;

  const [hasAlreadyPreordered, setHasAlreadyPreordered] = React.useState(false);

  console.log(tags, followedTags, type, preorderTag);
  console.log('here is my preorder tag!');

  function getPaymentHistory() {
    return Lbryio.call(
      'customer',
      'list',
      {
        environment: stripeEnvironment,
      },
      'post'
    );
  }

  async function checkIfAlreadyPurchased(){
    try {
      // get card payments customer has made
      let customerTransactionResponse = await getPaymentHistory();

      console.log(customerTransactionResponse);

      let matchingTransaction = false;
      for(const transaction of customerTransactionResponse){
        console.log(claimId);
        console.log(transaction.source_claim_id);
        if(claimId === transaction.source_claim_id){
          matchingTransaction = true;
        }
      }

      if(matchingTransaction){
        console.log('matching transaction')
        console.log(matchingTransaction);
        setHasAlreadyPreordered(true);
      }

    } catch (err) {
      console.log(err);
    }
  }

  // populate customer payment data
  React.useEffect(() => {
    checkIfAlreadyPurchased()
  }, []);


  return (
    <>
      {preorderTag && !hasAlreadyPreordered && !myUpload && (<div>
        <Button
          // ref={buttonRef}
          iconColor="red"
          className={'preorder-button'}
          // largestLabel={isMobile && shrinkOnMobile ? '' : subscriptionLabel}
          icon={ICONS.FINANCE}
          button="primary"
          label={'Preorder now for $' + preorderTag}
          // title={titlePrefix}
          requiresAuth
          onClick={() => doOpenModal(MODALS.PREORDER_CONTENT, { uri, checkIfAlreadyPurchased })}
        />
      </div>)}
      {preorderTag && hasAlreadyPreordered && !myUpload && (<div>
        <Button
          // ref={buttonRef}
          iconColor="red"
          className={'preorder-button'}
          // largestLabel={isMobile && shrinkOnMobile ? '' : subscriptionLabel}
          button="primary"
          label={'You have preordered this content'}
          // title={titlePrefix}
          requiresAuth
        />
      </div>)}
      {preorderTag && myUpload && (<div>
        <Button
          // ref={buttonRef}
          iconColor="red"
          className={'preorder-button'}
          // largestLabel={isMobile && shrinkOnMobile ? '' : subscriptionLabel}
          button="primary"
          label={'You cannot preorder your own content'}
          // title={titlePrefix}
        />
      </div>)}
    </>
  );
}
