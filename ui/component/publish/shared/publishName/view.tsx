import { DOMAIN } from 'config';
import { INVALID_NAME_ERROR } from 'constants/claim';
import React, { useState, useEffect } from 'react';
import { isNameValid } from 'util/lbryURI';
import { FormField } from 'component/common/form';
import NameHelpText from './name-help-text';
import { useIsMobile } from 'effects/use-screensize';
import useThrottle from 'effects/use-throttle';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { doUpdatePublishForm, doPrepareEdit } from 'redux/actions/publish';
import {
  selectPublishFormValue,
  selectIsStillEditing,
  selectMyClaimForUri,
  selectTakeOverAmount,
  selectCurrentUploads,
} from 'redux/selectors/publish';
import { selectActiveChannelClaim, selectIncognito } from 'redux/selectors/app';
type Props = {
  uri?: string | null | undefined;
  onChange?: () => void;
};

function PublishName(props: Props) {
  const { onChange } = props;
  const dispatch = useAppDispatch();
  const publishFormName = useAppSelector((state) => selectPublishFormValue(state, 'name'));
  const uri = useAppSelector((state) => selectPublishFormValue(state, 'uri'));
  const isStillEditing = useAppSelector((state) => selectIsStillEditing(state));
  const myClaimForUri = useAppSelector((state) => selectMyClaimForUri(state));
  const myClaimForUriCaseInsensitive = useAppSelector((state) => selectMyClaimForUri(state, false));
  const currentUploads = useAppSelector((state) => selectCurrentUploads(state));
  const activeChannelClaim = useAppSelector((state) => selectActiveChannelClaim(state));
  const incognito = useAppSelector((state) => selectIncognito(state));
  const amountNeededForTakeover = useAppSelector((state) => selectTakeOverAmount(state));
  const updatePublishForm = (value: UpdatePublishState) => dispatch(doUpdatePublishForm(value));
  const prepareEdit = (claim: {}, editUri: string) => dispatch(doPrepareEdit(claim, editUri));
  const [name, setName] = useState(publishFormName);
  const nameThrottled = useThrottle(name, 750);
  const [nameError, setNameError] = useState(undefined);
  const [blurred, setBlurred] = React.useState(false);
  const activeChannelName = activeChannelClaim && activeChannelClaim.name;
  const isMobile = useIsMobile();
  let prefix = IS_WEB ? (isMobile ? '' : `${DOMAIN}/`) : 'lbry://';

  if (activeChannelName && !incognito) {
    prefix += `${activeChannelName}/`;
  }

  function editExistingClaim() {
    if (myClaimForUri) {
      prepareEdit(myClaimForUri, uri);
    }
  }

  function handleChange(event) {
    handleNameChange(event);
    if (onChange) onChange();
  }

  function handleNameChange(event) {
    setName(event.target.value);
  }

  useEffect(() => {
    // Cases: Form was cleared; Sanitized; New file selected
    if (publishFormName !== name) {
      setName(publishFormName);
    } // eslint-disable-next-line react-hooks/exhaustive-deps -- one way update only
  }, [publishFormName]);
  useEffect(() => {
    updatePublishForm({
      name: nameThrottled || '',
    });
  }, [nameThrottled, updatePublishForm]);
  useEffect(() => {
    if (!blurred && !name) {
      return;
    }

    let nameError;

    if (!name) {
      nameError = __('A name is required');
    } else if (!isNameValid(name)) {
      nameError = INVALID_NAME_ERROR;
    }

    setNameError(nameError);
  }, [name, blurred]);
  return (
    <>
      <fieldset-group class="fieldset-group--smushed fieldset-group--disabled-prefix">
        <fieldset-section>
          <label>{__('URL')}</label>
          <div className="form-field__prefix">{prefix}</div>
        </fieldset-section>
        <FormField
          type="text"
          name="content_name"
          value={name}
          error={nameError}
          disabled={isStillEditing}
          onChange={handleChange}
          onBlur={() => setBlurred(true)}
          autoComplete="off"
        />
      </fieldset-group>

      <div className="form-field__help">
        <NameHelpText
          uri={uri}
          isStillEditing={isStillEditing}
          myClaimForUri={myClaimForUri}
          myClaimForUriCaseInsensitive={myClaimForUriCaseInsensitive}
          currentUploads={currentUploads}
          onEditMyClaim={editExistingClaim}
        />
      </div>
    </>
  );
}

export default PublishName;
