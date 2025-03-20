// @flow
import React, { useEffect } from 'react';

import './style.scss';
import { FormField } from 'component/common/form';
import Card from 'component/common/card';
import I18nMessage from 'component/i18nMessage';
import Button from 'component/button';
import * as PAGES from 'constants/pages';
import { PAYWALL } from 'constants/publish';

type Props = {
  updatePublishForm: (UpdatePublishState) => void,
  getMembershipTiersForContentClaimId: (type: string) => void,
  claim: Claim,
  activeChannel: ChannelClaim,
  incognito: boolean,
  getExistingTiers: ({ channel_name: string, channel_id: string }) => Promise<CreatorMemberships>,
  myMembershipTiers: Array<MembershipTier>,
  isStillEditing: boolean,
  memberRestrictionOn: boolean,
  memberRestrictionTierIds: Array<number>,
  validTierIds: ?Array<number>,
  paywall: Paywall,
  visibility: Visibility,
};

function PublishProtectedContent(props: Props) {
  const {
    activeChannel,
    incognito,
    updatePublishForm,
    getMembershipTiersForContentClaimId,
    claim,
    getExistingTiers,
    myMembershipTiers,
    memberRestrictionOn,
    memberRestrictionTierIds,
    validTierIds,
    paywall,
    visibility,
  } = props;

  const claimId = claim?.claim_id;

  // Fetch tiers for current claim
  React.useEffect(() => {
    if (claimId) {
      getMembershipTiersForContentClaimId(claimId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- @see TODO_NEED_VERIFICATION
  }, [claimId]);

  // Remove previous selections that are no longer valid.
  React.useEffect(() => {
    if (validTierIds) {
      const filteredTierIds = memberRestrictionTierIds.filter((id) => validTierIds.includes(id));
      if (filteredTierIds.length < memberRestrictionTierIds.length) {
        updatePublishForm({ memberRestrictionTierIds: filteredTierIds });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-filter when validTierIds changes.
  }, [validTierIds]);

  function toggleMemberRestrictionOn() {
    updatePublishForm({ memberRestrictionOn: !memberRestrictionOn });
  }

  function toggleMemberRestrictionTierId(id: number) {
    if (memberRestrictionTierIds.includes(id)) {
      updatePublishForm({
        memberRestrictionTierIds: memberRestrictionTierIds.filter((x) => x !== id),
      });
    } else {
      updatePublishForm({
        memberRestrictionTierIds: memberRestrictionTierIds.concat(id),
      });
    }
  }

  useEffect(() => {
    if (activeChannel) {
      getExistingTiers({
        channel_name: activeChannel.normalized_name,
        channel_id: activeChannel.claim_id,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- @see TODO_NEED_VERIFICATION
  }, [activeChannel]);

  if (incognito) return null;

  if (!myMembershipTiers || (myMembershipTiers && myMembershipTiers.length === 0)) {
    return (
      <>
        <Card
          background
          isBodyList
          title={__('Restrict Content')}
          body={
            <div className="settings-row publish-row--locked">
              <I18nMessage
                tokens={{
                  activate_your_memberships: (
                    <Button
                      navigate={`/$/${PAGES.CREATOR_MEMBERSHIPS}`}
                      label={__('activate your memberships')}
                      button="link"
                    />
                  ),
                }}
              >
                Please %activate_your_memberships% first to to use this functionality.
              </I18nMessage>
            </div>
          }
        />
      </>
    );
  }

  if (validTierIds && validTierIds.length === 0) {
    return (
      <Card
        background
        isBodyList
        title={__('Restrict Content')}
        body={
          <div className="publish-row publish-row-tiers">
            <div className="publish-row__reason">
              {__('The selected channel has no membership tiers with exclusive-content perks for the current setup.')}
            </div>
          </div>
        }
      />
    );
  }

  if (validTierIds && validTierIds.length > 0) {
    if (visibility === 'unlisted') {
      return (
        <Card
          background
          isBodyList
          title={__('Restrict Content')}
          body={
            <div className="publish-row publish-row-tiers">
              <div className="publish-row__reason">
                {__('Membership restrictions are not available for Unlisted content.')}
              </div>
            </div>
          }
        />
      );
    }

    return (
      <>
        <Card
          background
          isBodyList
          title={__('Restrict Content')}
          body={
            <div className="publish-row publish-row-tiers">
              <FormField
                type="checkbox"
                disabled={paywall !== PAYWALL.FREE}
                checked={memberRestrictionOn}
                label={__('Restrict content to only allow subscribers to certain memberships to view it')}
                name={'toggleRestrictedContent'}
                className="restrict-content__checkbox"
                onChange={toggleMemberRestrictionOn}
              />

              {memberRestrictionOn && (
                <div className="tier-list">
                  {myMembershipTiers.map((tier: MembershipTier) => {
                    const show = validTierIds && validTierIds.includes(tier.membership_id);
                    return show ? (
                      <FormField
                        disabled={paywall !== PAYWALL.FREE}
                        key={tier.membership_id}
                        type="checkbox"
                        checked={memberRestrictionTierIds.includes(tier.membership_id)}
                        label={tier.name}
                        name={tier.membership_id}
                        onChange={() => toggleMemberRestrictionTierId(tier.membership_id)}
                      />
                    ) : (
                      <div key={tier.membership_id} className="dummy-tier" />
                    );
                  })}
                </div>
              )}

              {paywall !== PAYWALL.FREE && (
                <div className="error__text">
                  {__('This file has an attached price, disable it in order to add content restrictions.')}
                </div>
              )}
            </div>
          }
        />
      </>
    );
  }

  return null;
}

export default PublishProtectedContent;
