import React, { useEffect } from 'react';
import './style.scss';
import { FormField } from 'component/common/form';
import Card from 'component/common/card';
import I18nMessage from 'component/i18nMessage';
import Button from 'component/button';
import * as PAGES from 'constants/pages';
import { PAYWALL } from 'constants/publish';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { doUpdatePublishForm } from 'redux/actions/publish';
import { selectActiveChannelClaim, selectIncognito } from 'redux/selectors/app';
import { selectMembershipTiersForCreatorId } from 'redux/selectors/memberships';
import { selectPublishFormValue, selectValidTierIdsForCurrentForm } from 'redux/selectors/publish';
import { doMembershipContentforStreamClaimId, doMembershipList } from 'redux/actions/memberships';

type Props = {
  claim: Claim;
  isStillEditing: boolean;
};

function PublishProtectedContent(props: Props) {
  const { claim } = props;

  const dispatch = useAppDispatch();
  const incognito = useAppSelector(selectIncognito);
  const activeChannel = useAppSelector((state) => {
    const inc = selectIncognito(state);
    return !inc && selectActiveChannelClaim(state);
  });
  const myMembershipTiers = useAppSelector((state) =>
    selectMembershipTiersForCreatorId(state, activeChannel ? activeChannel.claim_id : undefined)
  );
  const memberRestrictionOn = useAppSelector((state) => selectPublishFormValue(state, 'memberRestrictionOn'));
  const memberRestrictionTierIds = useAppSelector((state) => selectPublishFormValue(state, 'memberRestrictionTierIds'));
  const validTierIds = useAppSelector(selectValidTierIdsForCurrentForm);
  const paywall = useAppSelector((state) => selectPublishFormValue(state, 'paywall'));
  const visibility = useAppSelector((state) => selectPublishFormValue(state, 'visibility'));

  const claimId = claim?.claim_id;
  // Fetch tiers for current claim
  React.useEffect(() => {
    if (claimId) {
      dispatch(doMembershipContentforStreamClaimId(claimId));
    } // eslint-disable-next-line react-hooks/exhaustive-deps -- @see TODO_NEED_VERIFICATION
  }, [claimId]);
  // Remove previous selections that are no longer valid.
  React.useEffect(() => {
    if (validTierIds) {
      const filteredTierIds = memberRestrictionTierIds.filter((id) => validTierIds.includes(id));

      if (filteredTierIds.length < memberRestrictionTierIds.length) {
        dispatch(
          doUpdatePublishForm({
            memberRestrictionTierIds: filteredTierIds,
          })
        );
      }
    } // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-filter when validTierIds changes.
  }, [validTierIds]);

  function toggleMemberRestrictionOn() {
    dispatch(
      doUpdatePublishForm({
        memberRestrictionOn: !memberRestrictionOn,
      })
    );
  }

  function toggleMemberRestrictionTierId(id: number | void) {
    if (typeof id !== 'number') return;

    if (memberRestrictionTierIds.includes(id)) {
      dispatch(
        doUpdatePublishForm({
          memberRestrictionTierIds: memberRestrictionTierIds.filter((x) => x !== id),
        })
      );
    } else {
      dispatch(
        doUpdatePublishForm({
          memberRestrictionTierIds: memberRestrictionTierIds.concat(id),
        })
      );
    }
  }

  useEffect(() => {
    if (activeChannel) {
      dispatch(
        doMembershipList({
          channel_claim_id: activeChannel.claim_id,
        })
      );
    } // eslint-disable-next-line react-hooks/exhaustive-deps -- @see TODO_NEED_VERIFICATION
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
                  {myMembershipTiers.map((tier: CreatorMembership) => {
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
