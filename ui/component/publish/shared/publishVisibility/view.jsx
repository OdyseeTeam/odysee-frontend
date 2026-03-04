// @flow
import React from 'react';

import './style.scss';
import Card from 'component/common/card';
import { FormField } from 'component/common/form';
import PublishReleaseDate from 'component/publish/shared/publishReleaseDate';
import { MS } from 'constants/date-time';
import { getClaimScheduledState, isClaimPrivate, isClaimUnlisted } from 'util/claim';

type Props = {
  visibility: Visibility,
  scheduledShow: boolean,
  isNonPublicAllowed: boolean,
  claimToEdit: ?StreamClaim,
  doUpdatePublishForm: (data: UpdatePublishState) => void,
};

const PublishVisibility = (props: Props) => {
  const { visibility, scheduledShow, isNonPublicAllowed, claimToEdit: ce, doUpdatePublishForm } = props;

  let showEditWarning = false;
  if (ce) {
    const pastScheduledState = getClaimScheduledState(ce);
    const wasPublic = pastScheduledState === 'non-scheduled' && !isClaimUnlisted(ce) && !isClaimPrivate(ce);
    showEditWarning = wasPublic && visibility !== 'public';
  }

  function setVisibility(visibility: Visibility) {
    const change: UpdatePublishState = { visibility };
    doUpdatePublishForm(change);
  }

  return (
    <div className="publish-visibility">
      <Card
        background
        isBodyList
        title={__('Visibility')}
        className="card--enable-overflows"
        body={
          <div className="publish-row">
            <fieldset-section>
              <FormField
                type="radio"
                name="visibility::public"
                checked={visibility === 'public'}
                label={
                  <>
                    {__('Public')}
                    <span className="publish-visibility__radio-help">{__(HELP.public)}</span>
                  </>
                }
                onChange={() => setVisibility('public')}
              />

              <FormField
                type="radio"
                name="visibility::unlisted"
                checked={visibility === 'unlisted'}
                disabled={!isNonPublicAllowed}
                label={
                  <>
                    {__('Unlisted')}
                    <span className="publish-visibility__radio-help">{__(HELP.unlisted)}</span>
                  </>
                }
                onChange={() => setVisibility('unlisted')}
              />
              {visibility === 'unlisted' && <p className="publish-visibility__warning">{__(HELP.chain_warning)}</p>}
              {visibility === 'unlisted' && showEditWarning && (
                <p className="publish-visibility__caution">{__(HELP.edit_warning)}</p>
              )}

              <FormField
                type="radio"
                name="visibility::scheduled"
                checked={visibility === 'scheduled'}
                disabled={!isNonPublicAllowed}
                label={
                  <>
                    {__('Scheduled')}
                    <span className="publish-visibility__radio-help">{__(HELP.scheduled)}</span>
                  </>
                }
                onChange={() => setVisibility('scheduled')}
              />
              {visibility === 'scheduled' && <p className="publish-visibility__warning">{__(HELP.chain_warning)}</p>}
              {visibility === 'scheduled' && showEditWarning && (
                <p className="publish-visibility__caution">{__(HELP.edit_warning)}</p>
              )}
            </fieldset-section>

            {visibility === 'scheduled' && (
              <div className="publish-visibility__scheduled">
                <FormField
                  type="checkbox"
                  name="scheduled::show"
                  label={__("Show this on my channel's Upcoming section.")}
                  checked={scheduledShow}
                  onChange={() => doUpdatePublishForm({ scheduledShow: !scheduledShow })}
                />
                <PublishReleaseDate minDate={new Date(Date.now() + 30 * MS.MINUTE)} />
              </div>
            )}
          </div>
        }
      />
    </div>
  );
};

// prettier-ignore
const HELP = {
  public: 'Content is visible to everyone.',
  unlisted: 'The content cannot be viewed without a special link.',
  scheduled: 'Set a date to make the content public.',
  chain_warning: 'Note: The title, description, and other metadata are still public for unlisted and scheduled content.',
  edit_warning: 'Editing previously public content may still allow it to be accessed by some applications if the data is being shared by others on the network. If you want to make sure the content is not accessible, you should delete and re-upload it.',
};

export default PublishVisibility;
