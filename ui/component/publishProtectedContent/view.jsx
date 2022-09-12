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
  getExistingTiers: ({ channel_name: string, channel_id: string }) => Promise<CreatorMemberships>,
  myMembershipTiers: Array<Membership>,
  myMembershipTiersWithExclusiveContentPerk: Array<Membership>,
  myMembershipTiersWithExclusiveLivestreamPerk: Array<Membership>,
  location: string,
};

function PublishProtectedContent(props: Props) {
  const {
    activeChannel,
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

  const [commentsChatAlreadyRestricted, setCommentsChatAlreadyRestricted] = React.useState(false);
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

  // update frontend is restricted chat tag is already present
  React.useEffect(() => {
    if (claim) {
      const alreadyRestricted = claim?.value?.tags?.includes('chat:members-only');
      setCommentsChatAlreadyRestricted(alreadyRestricted);
    }
  }, [claim]);

  // if there are already restricted memberships for this content, setup state
  React.useEffect(() => {
    if (activeChannel && protectedMembershipIds && protectedMembershipIds) {
      setIsRestrictingContent(true);
    }
  }, [protectedMembershipIds, activeChannel]);

  function handleRestrictedMembershipChange(event) {
    let matchedMemberships;
    const restrictCheckboxes = document.querySelectorAll('*[id^="restrictToMembership"]');

    for (const checkbox of restrictCheckboxes) {
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
    // user is no longer restricting content
    updatePublishForm({ restrictedToMemberships: isRestrictingContent ? null : undefined });

    setIsRestrictingContent(!isRestrictingContent);
  }

  function handleChangeRestrictCommentsChat() {
    if (commentsChatAlreadyRestricted) {
      updatePublishForm({
        restrictCommentsAndChat: false,
      });
    } else {
      updatePublishForm({
        restrictCommentsAndChat: true,
      });
    }
    setCommentsChatAlreadyRestricted(!commentsChatAlreadyRestricted);
  }

  useEffect(() => {
    if (activeChannel) {
      getExistingTiers({
        channel_name: activeChannel.normalized_name,
        channel_id: activeChannel.claim_id,
      });
    }
  }, [activeChannel]);

  return (
    <>
      <h2 className="card__title">{__('Restrictions')}</h2>

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

      {membershipsToUse && membershipsToUse.length > 1 && (
        <>
          <Card
            className="card--restrictions"
            body={
              <>
                <FormField
                  type="checkbox"
                  defaultChecked={protectedMembershipIds && protectedMembershipIds.length}
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

                <FormField
                  type="checkbox"
                  defaultChecked={commentsChatAlreadyRestricted}
                  label={'Restrict comments and chats to memberships with members-only chat perk'}
                  name={'toggleRestrictCommentsChat'}
                  className="restrict-comments-chat_checkbox"
                  onChange={() => handleChangeRestrictCommentsChat()}
                />
              </>
            }
          />
        </>
      )}
    </>
  );
}

export default PublishProtectedContent;
