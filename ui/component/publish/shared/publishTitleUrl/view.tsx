import React from 'react';
import { FormField } from 'component/common/form';
import PublishName from 'component/publish/shared/publishName';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectPublishFormValue, selectMyClaimForUri } from 'redux/selectors/publish';
import { doUpdateTitle } from 'redux/actions/publish';

type Props = {
  disabled?: boolean;
};

export default function PublishTitleUrl(props: Props) {
  const { disabled } = props;
  const dispatch = useAppDispatch();
  const title = useAppSelector((state) => selectPublishFormValue(state, 'title'));
  const myClaimForUri = useAppSelector((state) => selectMyClaimForUri(state, true));
  const uri = (myClaimForUri && myClaimForUri.permanent_url) || '';
  const [urlChangedManually, setUrlChangedManually] = React.useState(false);

  function handleTitleChange(event: React.ChangeEvent<HTMLInputElement>) {
    dispatch(doUpdateTitle(event.target.value, urlChangedManually));
  }

  return (
    <>
      <FormField
        type="text"
        name="content_title"
        label={__('Title')}
        placeholder={__('Descriptive titles work best')}
        disabled={disabled}
        value={title}
        onChange={handleTitleChange}
        className="fieldset-group"
        max={200}
      />
      <PublishName uri={uri} onChange={() => setUrlChangedManually(true)} />
    </>
  );
}
