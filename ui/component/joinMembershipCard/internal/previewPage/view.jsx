// @flow
import React from 'react';
import classnames from 'classnames';
import { ChannelPageContext } from 'page/channel/view';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import Button from 'component/button';
import ButtonNavigateChannelId from 'component/buttonNavigateChannelId';
import MembershipTier from './internal/membershipTier';
import MembershipDetails from './internal/membershipDetails';
import ChannelThumbnail from 'component/channelThumbnail';
import * as MODALS from 'constants/modal_types';

type Props = {
  uri: string,
  selectedTier: CreatorMembership,
  selectedMembershipIndex: number,
  setMembershipIndex: (index: number) => void,
  handleSelect: () => void,
  // -- redux --
  channelId: string,
  canReceiveFiatTips: ?boolean,
  channelIsMine: boolean,
  creatorMemberships: CreatorMemberships,
  doTipAccountCheckForUri: (uri: string) => void,
  channelTitle: string,
  channelUri: string,
  channelName: string,
  doOpenModal: (id: string, props: {}) => void,
  protectedMembershipIds: Array<number>,
};

const PreviewPage = (props: Props) => {
  const {
    uri,
    selectedTier,
    selectedMembershipIndex,
    setMembershipIndex,
    handleSelect,
    protectedMembershipIds,
    // -- redux --
    channelId,
    canReceiveFiatTips,
    channelIsMine,
    creatorMemberships,
    doTipAccountCheckForUri,
    channelTitle,
    channelUri,
    channelName,
    doOpenModal,
  } = props;

  const isChannelTab = React.useContext(ChannelPageContext);

  const creatorHasMemberships = creatorMemberships && creatorMemberships.length > 0;
  const creatorPurchaseDisabled = channelIsMine || canReceiveFiatTips === false;

  React.useEffect(() => {
    if (canReceiveFiatTips === undefined) {
      doTipAccountCheckForUri(uri);
    }
  }, [canReceiveFiatTips, doTipAccountCheckForUri, uri]);

  if (!creatorHasMemberships) {
    return (
      <div className="join-membership__empty">
        <span>
          {__(
            channelIsMine
              ? "Unfortunately you haven't activated your memberships functionality for this channel yet, but you can do so now at the link below."
              : "Unfortunately, this creator hasn't activated their membership functionality yet. You can try creating your own memberships with the link below!"
          )}
        </span>
        <ButtonNavigateChannelId
          icon={ICONS.UPGRADE}
          button="primary"
          type="submit"
          label={
            channelIsMine
              ? __('Create Memberships For %channel_name%', { channel_name: channelName })
              : __('Create Your Memberships')
          }
          navigate={`/$/${PAGES.CREATOR_MEMBERSHIPS}?tab=tiers`}
          channelId={channelId}
        />
      </div>
    );
  }

  if (isChannelTab) {
    return (
      <>
        <div className="join-membership__tab">
          {creatorMemberships.map((membership, index) => (
            <MembershipTier
              membership={membership}
              handleSelect={() => {
                setMembershipIndex(index);
                doOpenModal(MODALS.JOIN_MEMBERSHIP, { uri, membershipIndex: index });
                // handleSelect();
              }}
              disabled={creatorPurchaseDisabled}
              key={index}
            />
          ))}
        </div>

        {creatorPurchaseDisabled && (
          <span className="info-label">
            {channelIsMine
              ? __("You're not able to signup for your own memberships")
              : __('This creator does not have an active bank account to receive payments.')}
          </span>
        )}
      </>
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
            className={classnames('button-toggle', {
              'button-toggle--active': index === selectedMembershipIndex,
              'no-access-button': protectedMembershipIds && !protectedMembershipIds.includes(Membership.id),
            })}
          />
        ))}
      </div>
      <div className="join-membership__modal-content">
        <MembershipDetails membership={selectedTier} protectedMembershipIds={protectedMembershipIds} />
      </div>

      <div className="join-membership__modal-action">
        <Button
          icon={ICONS.UPGRADE}
          button="primary"
          type="submit"
          disabled={creatorPurchaseDisabled}
          label={__('Signup for $%membership_price% a month', {
            membership_price: selectedTier.NewPrices && selectedTier.NewPrices[0].Price.amount / 100,
          })}
          requiresAuth
          onClick={handleSelect}
        />

        {creatorPurchaseDisabled && (
          <span className="info-label">
            {channelIsMine
              ? __("You're not able to signup for your own memberships")
              : __('This creator does not have an active bank account to receive payments.')}
          </span>
        )}
      </div>
    </>
  );
};

export default PreviewPage;
