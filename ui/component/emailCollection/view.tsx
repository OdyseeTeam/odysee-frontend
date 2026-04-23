import React from 'react';
import Button from 'component/button';
import UserEmailNew from 'component/userEmailNew';
import UserEmailVerify from 'component/userEmailVerify';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { doSetClientSetting } from 'redux/actions/settings';
import { selectClientSetting } from 'redux/selectors/settings';
import { selectEmailToVerify, selectUser } from 'redux/selectors/user';
import * as SETTINGS from 'constants/settings';

type Props = {
  completeFirstRun: () => void;
};

const FirstRunEmailCollection = React.memo(function FirstRunEmailCollection(props: Props) {
  const { completeFirstRun } = props;

  const dispatch = useAppDispatch();
  const emailCollectionAcknowledged = useAppSelector((state) =>
    selectClientSetting(state, SETTINGS.EMAIL_COLLECTION_ACKNOWLEDGED)
  );
  const email = useAppSelector(selectEmailToVerify);
  const user = useAppSelector(selectUser);

  const acknowledgeEmail = React.useCallback(() => {
    dispatch(doSetClientSetting(SETTINGS.EMAIL_COLLECTION_ACKNOWLEDGED, true));
  }, [dispatch]);

  // this shouldn't happen
  if (!user) {
    return null;
  }

  const cancelButton = <Button button="link" onClick={completeFirstRun} label={__('Not Now')} />;

  if (user && !user.has_verified_email && !email) {
    return <UserEmailNew cancelButton={cancelButton} />;
  } else if (user && !user.has_verified_email) {
    return <UserEmailVerify cancelButton={cancelButton} />;
  }

  // Try to acknowledge here so users don't see an empty email screen in the first run banner
  if (!emailCollectionAcknowledged) {
    acknowledgeEmail();
  }

  return null;
});

export default FirstRunEmailCollection;
