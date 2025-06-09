// @flow
import React from 'react';
import classnames from 'classnames';
import { ChannelPageContext } from 'contexts/channel';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import Button from 'component/button';
import ButtonNavigateChannelId from 'component/buttonNavigateChannelId';
import MembershipTier from './internal/membershipTier';
import MembershipDetails from './internal/membershipDetails';
import ChannelThumbnail from 'component/channelThumbnail';
import * as MODALS from 'constants/modal_types';

import './style.scss';

type Props = {
  uri: string,
  selectedCreatorMembership: CreatorMembership,
  selectedMembershipIndex: number,
  unlockableTierIds: Array<number>,
  userHasACreatorMembership: boolean,
  membersOnly?: boolean,
  isLivestream: ?boolean,
  setMembershipIndex: (index: number) => void,
  handleSelect: () => void,
  // -- redux --
  channelId: string,
  canReceiveFiatTips: ?boolean,
  canReceiveArweaveTips: ?boolean,
  channelIsMine: boolean,
  creatorMemberships: CreatorMemberships,
  doTipAccountCheckForUri: (uri: string) => void,
  channelTitle: string,
  channelUri: string,
  channelName: string,
  doOpenModal: (id: string, props: {}) => void,
  joinEnabled: boolean,
  cheapestPlan: CreatorMembership,
  exchangeRate: { ar: number },
};

const PreviewPage = (props: Props) => {
  const {
    uri,
    selectedCreatorMembership,
    selectedMembershipIndex,
    unlockableTierIds,
    userHasACreatorMembership,
    membersOnly,
    isLivestream,
    setMembershipIndex,
    handleSelect,
    // -- redux --
    channelId,
    canReceiveFiatTips,
    canReceiveArweaveTips,
    channelIsMine,
    creatorMemberships,
    doTipAccountCheckForUri,
    channelTitle,
    channelUri,
    channelName,
    doOpenModal,
    joinEnabled,
    cheapestPlan,
    exchangeRate,
  } = props;

  const isChannelTab = React.useContext(ChannelPageContext);

  const creatorHasMemberships = creatorMemberships && creatorMemberships.length > 0;
  const creatorPurchaseDisabled = channelIsMine || userHasACreatorMembership;

  React.useEffect(() => {
    if (canReceiveFiatTips === undefined || canReceiveArweaveTips === undefined) {
      doTipAccountCheckForUri(uri);
    }
  }, [canReceiveFiatTips, canReceiveArweaveTips, doTipAccountCheckForUri, uri]);

  if (!creatorHasMemberships) {
    // -- On a channel that is mine, the button uses the channel id to set it as active
    // when landing on the memberships page for the given channel --

    // hack to test monetization disabled - memberships come back address = ''
    if (cheapestPlan && !joinEnabled) {
      return (
        <div className="join-membership__empty">
          <h2 className="header--no-memberships">{__('Closed to New Members')}</h2>
          <p>
            {__(
              'Unfortunately, this membership is not accepting new members at this time.'
            )}
          </p>
          <div>
            <Button
              icon={ICONS.MEMBERSHIP}
              button="primary"
              type="submit"
              label={__(`Create Your Channel's Memberships`)}
              navigate={`/$/${PAGES.CREATOR_MEMBERSHIPS}?tab=tiers`}
            />
          </div>
        </div>
      );
    }
    if (channelIsMine) {
      return (
        <div className="join-membership__empty">
          <h2 className="header--no-memberships">{__('Cannot join own memberships')}</h2>
          <p>
            {__(
              "Unfortunately you haven't activated your memberships functionality for this channel yet, but you can do so now at the link below."
            )}
          </p>
          <div>
            <ButtonNavigateChannelId
              icon={ICONS.MEMBERSHIP}
              button="primary"
              type="submit"
              label={__('Create Memberships For %channel_name%', { channel_name: channelName })}
              navigate={`/$/${PAGES.CREATOR_MEMBERSHIPS}?tab=tiers`}
              channelId={channelId}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="join-membership__empty">
        <h2 className="header--no-memberships">{__('Channel Has No Memberships')}</h2>
        <p>
          {__(
            "Unfortunately, this creator hasn't activated their membership functionality yet, but you can create your own tiers with the link below!"
          )}
        </p>
        <div>
          <Button
            icon={ICONS.MEMBERSHIP}
            button="primary"
            type="submit"
            label={__('Create Your Memberships')}
            navigate={`/$/${PAGES.CREATOR_MEMBERSHIPS}?tab=tiers`}
          />
        </div>
      </div>
    );
  }

  if (isChannelTab) {
    return (
      <>
        {channelIsMine && (
          <div className="button--manage-memberships">
            <ButtonNavigateChannelId
              icon={ICONS.MEMBERSHIP}
              button="primary"
              type="submit"
              label={__('Manage Your Membership Tiers')}
              navigate={`/$/${PAGES.CREATOR_MEMBERSHIPS}?tab=tiers`}
              channelId={channelId}
            />
          </div>
        )}

        <div className="join-membership__tab">
          {creatorMemberships.filter(m => m.enabled === true).map((membership, index) => (
            <MembershipTier
              membership={membership}
              handleSelect={() => {
                setMembershipIndex(index);
                doOpenModal(MODALS.JOIN_MEMBERSHIP, { uri, membershipIndex: index, membershipId: membership.membership_id, passedTierIndex: index, isChannelTab: isChannelTab });
              }}
              index={index}
              length={creatorMemberships.length}
              key={index}
              isOwnChannel={channelIsMine}
              userHasCreatorMembership={userHasACreatorMembership} // here
              isChannelTab
            />
          ))}
        </div>
      </>
    );
  }

  function pickIconToUse(membershipId) {
    let icon = '';
    if (unlockableTierIds && !unlockableTierIds.includes(membershipId)) {
      icon = ICONS.LOCK;
    } else if (unlockableTierIds && unlockableTierIds.includes(membershipId)) {
      icon = ICONS.UNLOCK;
    }
    return icon;
  }

  return (
    <>
      <div className="join-membership__modal-header">
        <ChannelThumbnail uri={channelUri} />
        <h2>{channelTitle}</h2>
        <h3>{__('Join Membership')}</h3>
        <p>
          {__(
            'Support %channel_title% with a monthly membership subscription to help and receive exclusive features.',
            { channel_title: channelTitle }
          )}
        </p>
      </div>

      <div className="join-membership__modal-tabs">
        {creatorMemberships.map((m, index) => (
          <Button
            key={m.membership_id}
            label={m.name}
            button="alt"
            icon={pickIconToUse(m.membership_id)}
            onClick={() => setMembershipIndex(index)}
            className={classnames('button-toggle', {
              'button-toggle--active': index === selectedMembershipIndex,
              'no-access-button': unlockableTierIds && !unlockableTierIds.includes(m.membership_id),
              'access-button': unlockableTierIds && unlockableTierIds.includes(m.membership_id),
            })}
          />
        ))}
      </div>

      <div className="join-membership__modal-content">
        {selectedCreatorMembership && (
          <MembershipDetails
            membership={selectedCreatorMembership}
            unlockableTierIds={unlockableTierIds}
            userHasACreatorMembership={userHasACreatorMembership}
            membersOnly={membersOnly}
            isLivestream={isLivestream}
            exchangeRate={exchangeRate}
          />
        )}
      </div>

      <div className="join-membership__modal-action">
        <Button
          icon={ICONS.MEMBERSHIP}
          button="primary"
          type="submit"
          disabled={userHasACreatorMembership || creatorPurchaseDisabled}
          label={__('Join X for $%membership_price% per month', {
            membership_price: selectedCreatorMembership?.prices[0].amount / 100,
          })}
          requiresAuth
          onClick={handleSelect}
        />

        {creatorPurchaseDisabled && (
          <span className="error-bubble">
            {channelIsMine
              ? __("You're not able to signup for your own memberships")
              : __("You're already a member.")}
          </span>
        )}
      </div>
    </>
  );
};

export default PreviewPage;
