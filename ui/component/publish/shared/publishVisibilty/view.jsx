// @flow

import React, { useEffect, useState } from 'react';
import { FormField } from 'component/common/form';
import './style.scss';
import Card from 'component/common/card';
import classnames from 'classnames';

type Props = {
  updatePublishForm: (any) => void,
  isUnlistedContent: boolean,
  isPrivateContent: boolean,
  location: string,
  editedReleaseTime: number,
  releaseTime: number,
};

const PublishVisibility = (props: Props) => {
  const { updatePublishForm, isUnlistedContent, isPrivateContent, location, editedReleaseTime, releaseTime } = props;

  const hasAReleaseTime = editedReleaseTime || releaseTime;

  const [selectedVisibility, setSelectedVisibility] = useState('public');

  function switchVisibility(visibility) {
    setSelectedVisibility(visibility);

    updatePublishForm({
      visibility,
    });

    // when switching to public, set release time to current time
    if (visibility === 'public' && location !== 'livestream') {
      updatePublishForm({
        releaseTime: Math.round(Date.now() / 1000),
      });
    }
  }

  useEffect(() => {
    return () => {
      updatePublishForm({ visibility: undefined });
    };
  }, []);

  useEffect(() => {
    if (isUnlistedContent) {
      switchVisibility('unlisted');
    } else if (isPrivateContent) {
      switchVisibility('private');
    }
  }, [isUnlistedContent, isPrivateContent]);

  return (
    <div className="publish-visibility">
      <h2 className="card__title">{__('Visibility')}</h2>

      <Card
        className="card--restrictions"
        body={
          <>
            <FormField
              type="radio"
              name="public-visibility"
              checked={selectedVisibility === 'public'}
              label={__('Public (anyone can view it)')}
              onChange={() => switchVisibility('public')}
            />
            <div className={classnames('', {
              'disabledUnlistedUpload': hasAReleaseTime,
            })}>
              <FormField
                type="radio"
                name="unlisted-visibility"
                checked={selectedVisibility === 'unlisted'}
                label={__('Unlisted (only people with the special link can access)')}
                onChange={() => switchVisibility('unlisted')}
              />
            </div>

            {/*<FormField*/}
            {/*  type="radio"*/}
            {/*  name="private-visibility"*/}
            {/*  checked={selectedVisibility === 'private'}*/}
            {/*  label={__('Private (only you can view the content)')}*/}
            {/*  // helper={__(HELP.ONLY_CONFIRM_OVER_AMOUNT)}*/}
            {/*  onChange={() => switchVisibility('private')}*/}
            {/*/>*/}
          </>
        }
      />
    </div>
  );
};

export default PublishVisibility;
