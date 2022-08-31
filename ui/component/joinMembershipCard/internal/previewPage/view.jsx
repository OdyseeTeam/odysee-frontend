// @flow
import React from 'react';
import classnames from 'classnames';
import { ChannelPageContext } from 'page/channel/view';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import Button from 'component/button';
import BalanceText from 'react-balance-text';
import MembershipBlock from './internal/membershipBlock';
import MembershipDetails from './internal/membershipDetails';
import ChannelThumbnail from 'component/channelThumbnail';

type Props = {
  uri: string,
  selectedTier: CreatorMembership,
  selectedMembershipIndex: number,
  setMembershipIndex: (index: number) => void,
  handleSelect: () => void,
  // -- redux --
  canReceiveFiatTips: ?boolean,
  channelIsMine: boolean,
  creatorMemberships: CreatorMemberships,
  doTipAccountCheckForUri: (uri: string) => void,
  channelTitle: string,
  channelUri: string,
};

const PreviewPage = (props: Props) => {
  const {
    uri,
    selectedTier,
    selectedMembershipIndex,
    setMembershipIndex,
    handleSelect,
    // -- redux --
    canReceiveFiatTips,
    channelIsMine,
    creatorMemberships,
    doTipAccountCheckForUri,
    channelTitle,
    channelUri,
  } = props;

  const isChannelTab = React.useContext(ChannelPageContext);

  const [seeAllTiers, setSeeAllTiers] = React.useState(false);

  const creatorHasMemberships = creatorMemberships && creatorMemberships.length > 0;
  const creatorPurchaseDisabled = !creatorHasMemberships || canReceiveFiatTips === false;

  React.useEffect(() => {
    if (canReceiveFiatTips === undefined) {
      doTipAccountCheckForUri(uri);
    }
  }, [canReceiveFiatTips, doTipAccountCheckForUri, uri]);

  function showAllTiers(e) {
    setSeeAllTiers(true);

    setTimeout(() => {
      const membershipTierDivs = document.getElementsByClassName('join-membership__block');
      const lastTier = membershipTierDivs[membershipTierDivs.length - 1];
      lastTier.scrollIntoView({ behavior: 'smooth' });
    }, 0);
  }

  /*
  React.useEffect(() => {
    setTimeout(() => {
      const tiers = document.getElementsByClassName('join-membership__tier-info');
      for (const tier of tiers) {
        const elementIsOverflown = tier.scrollHeight > tier.clientHeight || tier.scrollWidth > tier.clientWidth;
        // $FlowFixMe
        // const seeMoreButton = tier.parentNode.querySelector('.button--membership-tier__show-more');
        // if (elementIsOverflown && seeMoreButton) seeMoreButton.style.display = 'block';
      }
    }, 0);
  }, []);
  */

  if (creatorPurchaseDisabled) {
    return (
      <>
        <div className="can-create-your-own-memberships__div">
          <BalanceText>
            {__(
              channelIsMine
                ? "Unfortunately you haven't activated your memberships functionality yet, but you can do so now at the link below"
                : "Unfortunately, this creator hasn't activated their membership functionality yet. You can try creating your own memberships with the link below!"
            )}
          </BalanceText>
        </div>

        <>
          <Button
            icon={ICONS.UPGRADE}
            button="primary"
            type="submit"
            label={__('Create Your Memberships')}
            navigate={`/$/${PAGES.CREATOR_MEMBERSHIPS}`}
          />
        </>
      </>
    );
  }

  if (isChannelTab) {
    return (
      <div className="join-membership__blocks-wrapper">
        {creatorMemberships.map((membership, index) => (
          <MembershipBlock
            membership={membership}
            channelIsMine={channelIsMine}
            handleSelect={() => {
              setMembershipIndex(index);
              handleSelect();
            }}
            seeAllTiers={seeAllTiers}
            key={index}
          />
        ))}

        {!seeAllTiers && creatorMemberships.length > 3 && (
          <Button
            button="link"
            className="button--membership-see-all-tiers"
            label={__('See All')}
            onClick={showAllTiers}
          />
        )}
      </div>
    );
  }

  return (
    <>
      <div className="join-membership__modal-header">
        <ChannelThumbnail uri={channelUri} />
        <h2>{channelTitle}</h2>
        <h3>Join Membership</h3>
        <p>Support {channelTitle} with a monthly membership subscription to help and receive exclusive features.</p>
      </div>
      <div className="join-membership__modal-tabs">
        {creatorMemberships.map(({ Membership }, index) => (
          <Button
            key={Membership.id}
            label={Membership.name}
            button="alt"
            onClick={() => setMembershipIndex(index)}
            className={classnames('button-toggle', { 'button-toggle--active': index === selectedMembershipIndex })}
          />
        ))}
      </div>
      <div className="join-membership__modal-content">
        <MembershipDetails membership={selectedTier} expanded />
      </div>

      <>
        <Button
          icon={ICONS.UPGRADE}
          button="primary"
          type="submit"
          disabled={channelIsMine}
          label={__('Signup for $%membership_price% a month', {
            membership_price: selectedTier.NewPrices[0].Price.amount / 100,
          })}
          onClick={handleSelect}
        />

        {channelIsMine && <h1>{__("You're not able to signup for your own memberships")}</h1>}
      </>
    </>
  );
};

export default PreviewPage;
