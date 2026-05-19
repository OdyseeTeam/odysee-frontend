import { FF_MAX_CHARS_IN_DESCRIPTION } from 'constants/form-field';
import React, { useEffect, useCallback } from 'react';
import { FormField } from 'component/common/form';
import Card from 'component/common/card';
import useThrottle from 'effects/use-throttle';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectPublishFormValue } from 'redux/selectors/publish';
import { doUpdatePublishForm } from 'redux/actions/publish';
type Props = {
  disabled: boolean;
};
const INPUT_THROTTLE_MS = 750;

function PublishDescription(props: Props) {
  const { disabled } = props;
  const dispatch = useAppDispatch();
  const description = useAppSelector((state) => selectPublishFormValue(state, 'description'));
  const updatePublishForm = (value: UpdatePublishState) => dispatch(doUpdatePublishForm(value));
  const [descriptionValue, setDescriptionValue] = React.useState(description);
  const throttledDescription = useThrottle(descriptionValue, INPUT_THROTTLE_MS);

  const autoResize = useCallback(() => {
    const el = document.getElementById('content_description') as HTMLTextAreaElement | null;
    if (el) {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }
  }, []);

  useEffect(() => {
    autoResize();
  }, [descriptionValue, autoResize]);

  useEffect(() => {
    if (description !== descriptionValue) {
      setDescriptionValue(description);
    } // eslint-disable-next-line react-hooks/exhaustive-deps -- one way update only
  }, [description]);

  useEffect(() => {
    updatePublishForm({
      description: throttledDescription || '',
    });
  }, [throttledDescription]); // eslint-disable-line react-hooks/exhaustive-deps -- avoid recreating dispatcher

  function flushDescription() {
    updatePublishForm({
      description: descriptionValue || '',
    });
  }

  return (
    <>
      <Card
        className="card--description"
        actions={
          <FormField
            type={'textarea'}
            name="content_description"
            hideSuggestions
            placeholder={__(
              'What is your content about? Use this space to include any other relevant details you may like to share about your content and channel.'
            )}
            value={descriptionValue}
            disabled={disabled}
            onChange={(value) => setDescriptionValue(value.target.value)}
            onBlur={flushDescription}
            quickActionLabel={undefined}
            quickActionHandler={undefined}
            textAreaMaxLength={FF_MAX_CHARS_IN_DESCRIPTION}
          />
        }
      />
    </>
  );
}

export default PublishDescription;
