import React from 'react';
import PostEditor from 'component/postEditor';
import Card from 'component/common/card';
import { FormField } from 'component/common/form';
import PublishName from 'component/publish/shared/publishName';
import classnames from 'classnames';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectBalance } from 'redux/selectors/wallet';
import { selectPublishFormValue } from 'redux/selectors/publish';
import { doUpdatePublishForm, doUpdateTitle as doUpdateTitleAction } from 'redux/actions/publish';
type Props = {
  uri: string | null | undefined;
  fileMimeType: string | null | undefined;
  disabled: boolean;
  setPrevFileText: (arg0: string) => void;
};

function PublishPost(props: Props) {
  const { uri, fileMimeType, disabled, setPrevFileText } = props;
  const dispatch = useAppDispatch();
  const title = useAppSelector((state) => selectPublishFormValue(state, 'title'));
  const balance = useAppSelector((state) => selectBalance(state));
  const doUpdateTitle = (t: string, manual: boolean) => dispatch(doUpdateTitleAction(t, manual));
  const [urlChangedManually, setUrlChangedManually] = React.useState(false);

  function handleTitleChange(event) {
    doUpdateTitle(event.target.value, urlChangedManually);
  }

  return (
    <Card
      className={classnames({
        'card--disabled': disabled || balance === 0,
      })}
      actions={
        <React.Fragment>
          <FormField
            type="text"
            name="content_title"
            label={__('Title')}
            placeholder={__('Descriptive titles work best')}
            disabled={disabled}
            value={title}
            onChange={handleTitleChange}
            className="fieldset-group"
            max="200"
            autoFocus
            autoComplete="off"
          />
          <PublishName uri={uri} onChange={() => setUrlChangedManually(true)} />
          <PostEditor
            label={__('Post --[noun, markdown post tab button]--')}
            uri={uri}
            disabled={disabled}
            fileMimeType={fileMimeType}
            setPrevFileText={setPrevFileText}
          />
        </React.Fragment>
      }
    />
  );
}

export default PublishPost;
