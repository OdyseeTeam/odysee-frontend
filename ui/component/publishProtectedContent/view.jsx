// @flow
import React, { useEffect } from 'react';
import { FormField } from 'component/common/form';
import Card from 'component/common/card';
import I18nMessage from 'component/i18nMessage';
import Button from 'component/button';
import * as PAGES from 'constants/pages';

type Props = {
  description: ?string,
  disabled: boolean,
  updatePublishForm: ({}) => void,
  getMembershipTiersForContentClaimId: (type: string) => void,
  claim: Claim,
  protectedMembershipIds: Array<number>,
  activeChannel: ChannelClaim,
  incognito: boolean,
  getExistingTiers: ({ channel_name: string, channel_id: string }) => Promise<CreatorMemberships>,
  myMembershipTiers: CreatorMemberships,
  myMembershipTiersWithExclusiveContentPerk: CreatorMemberships,
  myMembershipTiersWithExclusiveLivestreamPerk: CreatorMemberships,
  location: string,
};

function PublishProtectedContent(props: Props) {
  const {
    activeChannel,
    incognito,
    updatePublishForm,
    getMembershipTiersForContentClaimId,
    claim,
    protectedMembershipIds,
    getExistingTiers,
    myMembershipTiers,
    myMembershipTiersWithExclusiveContentPerk,
    myMembershipTiersWithExclusiveLivestreamPerk,
    location,
  } = props;

  const [isRestrictingContent, setIsRestrictingContent] = React.useState(false);

  const claimId = claim?.claim_id;

  let membershipsToUse = myMembershipTiersWithExclusiveContentPerk;
  if (location === 'livestream') membershipsToUse = myMembershipTiersWithExclusiveLivestreamPerk;

  // run the redux action
  React.useEffect(() => {
    if (claimId) {
      getMembershipTiersForContentClaimId(claimId);
    }
  }, [claimId]);

  // $FlowIssue
  const commaSeparatedValues = protectedMembershipIds?.join(',') || '';

  // if there are already restricted memberships for this content, setup state
  React.useEffect(() => {
    if (activeChannel && protectedMembershipIds && protectedMembershipIds.length) {
      setIsRestrictingContent(true);
      const restrictionCheckbox = document.getElementById('toggleRestrictedContent');
      // $FlowFixMe
      if (restrictionCheckbox) restrictionCheckbox.checked = true;

      updatePublishForm({
        restrictedToMemberships: commaSeparatedValues,
        channelClaimId: activeChannel.claim_id,
      });
    } else {
      setIsRestrictingContent(false);
      const restrictionCheckbox = document.getElementById('toggleRestrictedContent');
      // $FlowFixMe
      if (restrictionCheckbox) restrictionCheckbox.checked = false;

      updatePublishForm({
        restrictedToMemberships: commaSeparatedValues,
        channelClaimId: activeChannel.claim_id,
      });
    }
  }, [protectedMembershipIds, activeChannel, claim]);

  function handleRestrictedMembershipChange(event) {
    let matchedMemberships;
    const restrictCheckboxes = document.querySelectorAll('*[id^="restrictToMembership"]');

    // $FlowFixMe
    for (const checkbox of restrictCheckboxes) {
      // $FlowFixMe
      if (checkbox.checked) {
        matchedMemberships = new Set(matchedMemberships);
        matchedMemberships.add(Number(checkbox.id.split(':')[1]));
      }
    }

    const commaSeparatedValueString = matchedMemberships && Array.from(matchedMemberships).join(',');

    updatePublishForm({
      restrictedToMemberships: commaSeparatedValueString,
      channelClaimId: activeChannel.claim_id,
    });
  }

  function handleChangeRestriction() {
    // update data to check against during publish
    // backend checks against an empty string so need to use that instead of undefined
    updatePublishForm({ restrictedToMemberships: isRestrictingContent ? '' : null });

    setIsRestrictingContent(!isRestrictingContent);
  }

  useEffect(() => {
    if (activeChannel) {
      getExistingTiers({
        channel_name: activeChannel.normalized_name,
        channel_id: activeChannel.claim_id,
      });
    }
  }, [activeChannel]);

  if (incognito) return null;

  return (
    <>
      <h2 className="card__title">{__('Restrict Content')}</h2>
      {(!myMembershipTiers || (myMembershipTiers && myMembershipTiers.length === 0)) && (
        <Card
          className="card--restrictions"
          body={
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
          }
        />
      )}

      {/* to-do: add some logic to say "none of your tiers have the perk" */}

      {membershipsToUse && membershipsToUse.length > 0 && (
        <Card
          className="card--restrictions"
          body={
            <>
              <FormField
                type="checkbox"
                defaultChecked={isRestrictingContent}
                label={__('Restrict content to only allow subscribers to certain memberships to view it')}
                name={'toggleRestrictedContent'}
                className="restrict-content__checkbox"
                onChange={() => handleChangeRestriction()}
              />

              {isRestrictingContent && (
                <div className="tier-list">
                  {membershipsToUse.map((membership) => (
                    <FormField
                      key={membership.Membership.id}
                      type="checkbox"
                      defaultChecked={
                        protectedMembershipIds && protectedMembershipIds.includes(membership.Membership.id)
                      }
                      label={membership.Membership.name}
                      name={'restrictToMembership:' + membership.Membership.id}
                      onChange={handleRestrictedMembershipChange}
                    />
                  ))}
                </div>
              )}
            </>
          }
        />
      )}
    </>
  );
}

export default PublishProtectedContent;
