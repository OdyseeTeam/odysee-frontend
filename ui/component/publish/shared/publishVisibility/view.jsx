// @flow
import React from 'react';

import './style.scss';
import Card from 'component/common/card';
import { FormField } from 'component/common/form';

type Props = {
  visibility: Visibility,
  doUpdatePublishForm: (data: UpdatePublishState) => void,
};

const PublishVisibility = (props: Props) => {
  const { visibility, doUpdatePublishForm } = props;

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
              label={__('Unlisted')}
              onChange={() => setVisibility('unlisted')}
            />
            <p className="publish-visibility__radio-help">{__(HELP.unlisted)}</p>
          </fieldset-section>
        }
      />
    </div>
  );
};

// prettier-ignore
const HELP = {
  public: 'Content is visible to everyone.',
  unlisted: "The title and description will still be visible on the blockchain but the content can't be viewed without the special link.",
};

export default PublishVisibility;
