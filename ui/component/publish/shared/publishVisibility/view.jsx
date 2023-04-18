// @flow
import React from 'react';

import './style.scss';
import Card from 'component/common/card';
import { FormField } from 'component/common/form';
import PublishReleaseDate from 'component/publish/shared/publishReleaseDate';

type Props = {
  visibility: Visibility,
  scheduledShow: boolean,
  isNonPublicAllowed: boolean,
  doUpdatePublishForm: (data: UpdatePublishState) => void,
};

const PublishVisibility = (props: Props) => {
  const { visibility, scheduledShow, isNonPublicAllowed, doUpdatePublishForm } = props;

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
          <>
            <fieldset-section>
              <FormField
                type="radio"
                name="visibility::public"
                checked={visibility === 'public'}
                label={__('Public')}
                onChange={() => setVisibility('public')}
              />
              <p className="publish-visibility__radio-help">{__(HELP.public)}</p>

              <FormField
                type="radio"
                name="visibility::unlisted"
                checked={visibility === 'unlisted'}
                disabled={!isNonPublicAllowed}
                label={__('Unlisted')}
                onChange={() => setVisibility('unlisted')}
              />
              <p className="publish-visibility__radio-help">{__(HELP.unlisted)}</p>
              {visibility === 'unlisted' && <p className="publish-visibility__warning">{__(HELP.chain_warning)}</p>}

              <FormField
                type="radio"
                name="visibility::scheduled"
                checked={visibility === 'scheduled'}
                disabled={!isNonPublicAllowed}
                label={__('Scheduled')}
                onChange={() => setVisibility('scheduled')}
              />
              <p className="publish-visibility__radio-help">{__(HELP.scheduled)}</p>
              {visibility === 'scheduled' && <p className="publish-visibility__warning">{__(HELP.chain_warning)}</p>}
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
                <PublishReleaseDate />
              </div>
            )}
          </>
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
};

export default PublishVisibility;
