// @flow
import React, { useEffect } from 'react';
import { FormField } from 'component/common/form';
import Card from 'component/common/card';
import I18nMessage from 'component/i18nMessage';
import Button from 'component/button';
import * as PAGES from 'constants/pages';
import { Lbryio } from 'lbryinc';
import { getStripeEnvironment } from 'util/stripe';
let stripeEnvironment = getStripeEnvironment();

type Props = {
  description: ?string,
  disabled: boolean,
  updatePublishForm: ({}) => void,
  doGetMembershipTiersForContentClaimId: (type: string) => void,
  claim: Claim,
  protectedMembershipIds: Array<number>,
  activeChannel: ChannelClaim,
};

function PublishProtectedContent(props: Props) {
  const {
    activeChannel,
    updatePublishForm,
    doGetMembershipTiersForContentClaimId,
    claim,
    protectedMembershipIds,
  } = props;

  const [hasSavedTiers, setHasSavedTiers] = React.useState(false);
  const [commentsChatAlreadyRestricted, setCommentsChatAlreadyRestricted] = React.useState(false);

  const claimId = claim?.claim_id;

  React.useEffect(() => {
    if (claimId) {
      doGetMembershipTiersForContentClaimId(claimId);
    }
  }, [claimId]);

  React.useEffect(() => {
    if (claim) {
      const alreadyRestricted = claim?.value?.tags?.includes('chat:members-only');
      setCommentsChatAlreadyRestricted(alreadyRestricted);
    }
  }, [claim]);

  // if there are already restricted memberships for this content, setup state
  React.useEffect(() => {
    l('protected membership ids');
    l(protectedMembershipIds);

    if (activeChannel && protectedMembershipIds && protectedMembershipIds) {
      setIsRestrictingContent(true);
    }
  }, [protectedMembershipIds, activeChannel]);

  function handleRestrictedMembershipChange(event) {
    let matchedMemberships = [];
    const restrictCheckboxes = document.querySelectorAll('*[id^="restrictToMembership"]');
    for (const checkbox of restrictCheckboxes) {
      if (checkbox.checked) {
        matchedMemberships.push(Number(checkbox.id.split(':')[1]));
      }
    }

    const commaSeparatedValueString = matchedMemberships.join(',');

    updatePublishForm({
      restrictedToMemberships: commaSeparatedValueString,
      channelClaimId: activeChannel.claim_id,
    });
  }

  const [isRestrictingContent, setIsRestrictingContent] = React.useState(false);
  const [creatorMemberships, setCreatorMemberships] = React.useState([]);

  function handleChangeRestriction() {
    // user is no longer restricting content
    if (isRestrictingContent) {
      updatePublishForm({
        restrictedToMemberships: '',
      });
    }

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

  async function getExistingTiers() {
    const response = await Lbryio.call(
      'membership',
      'list',
      {
        environment: stripeEnvironment,
        channel_name: activeChannel.normalized_name,
        channel_id: activeChannel.claim_id,
      },
      'post'
    );

    console.log('response');
    console.log(response);

    if (response && response.length && response.length > 0) {
      setHasSavedTiers(true);
      setCreatorMemberships(response);
    }

    return response;
  }

  useEffect(() => {
    if (activeChannel) {
      getExistingTiers();
    }
  }, [activeChannel]);

  return (
    <>
      <h2 className="card__title">{__('Restrictions')}</h2>

      {!hasSavedTiers && (
        <>
          <div>
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
              Please %activate_your_memberships% first to to use this functionality
            </I18nMessage>
          </div>
        </>
      )}

      {hasSavedTiers && (
        <>
          <Card
            className="card--restrictions"
            body={
              <>
                <FormField
                  type="checkbox"
                  defaultChecked={protectedMembershipIds && protectedMembershipIds.length}
                  label={'Restrict content to only allow subscribers to certain memberships to view it'}
                  name={'toggleRestrictedContent'}
                  className="restrict-content__checkbox"
                  onChange={() => handleChangeRestriction()}
                />

                {isRestrictingContent && (
                  <div className="tier-list">
                    {creatorMemberships.map((membership) => (
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
                  label={'Restrict comments and chats to members only'}
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
