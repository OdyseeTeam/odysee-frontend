import React from 'react';
import { FormField } from 'component/common/form';
import PublishName from 'component/publish/shared/publishName';
import useThrottle from 'effects/use-throttle';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectPublishFormValue, selectMyClaimForUri } from 'redux/selectors/publish';
import { doUpdateTitle } from 'redux/actions/publish';

type Props = {
  disabled?: boolean;
};
const INPUT_THROTTLE_MS = 750;

export default function PublishTitleUrl(props: Props) {
  const { disabled } = props;
  const dispatch = useAppDispatch();
  const title = useAppSelector((state) => selectPublishFormValue(state, 'title'));
  const myClaimForUri = useAppSelector((state) => selectMyClaimForUri(state, true));
  const uri = (myClaimForUri && myClaimForUri.permanent_url) || '';
  const [urlChangedManually, setUrlChangedManually] = React.useState(false);
  const [titleValue, setTitleValue] = React.useState(title);
  const throttledTitle = useThrottle(titleValue, INPUT_THROTTLE_MS);

  function handleTitleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setTitleValue(event.target.value);
  }

  function flushTitle() {
    dispatch(doUpdateTitle(titleValue || '', urlChangedManually));
  }

  React.useEffect(() => {
    if (title !== titleValue) {
      setTitleValue(title);
    } // eslint-disable-next-line react-hooks/exhaustive-deps -- one way update only
  }, [title]);

  React.useEffect(() => {
    dispatch(doUpdateTitle(throttledTitle || '', urlChangedManually));
  }, [dispatch, throttledTitle, urlChangedManually]);

  return (
    <>
      <FormField
        type="text"
        name="content_title"
        label={__('Title')}
        placeholder={__('Descriptive titles work best')}
        disabled={disabled}
        value={titleValue}
        onChange={handleTitleChange}
        onBlur={flushTitle}
        className="fieldset-group"
        max={200}
      />
      <PublishName uri={uri} onChange={() => setUrlChangedManually(true)} />
    </>
  );
}
