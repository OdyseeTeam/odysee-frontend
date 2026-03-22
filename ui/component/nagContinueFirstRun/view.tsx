import * as PAGES from 'constants/pages';
import * as SETTINGS from 'constants/settings';
import React from 'react';
import Nag from 'component/nag';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector } from 'redux/hooks';
import { selectClientSetting } from 'redux/selectors/settings';

export default function NagContinueFirstRun() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const followingAcknowledged = useAppSelector((state) => selectClientSetting(state, SETTINGS.FOLLOWING_ACKNOWLEDGED));
  const firstRunStarted = useAppSelector((state) => selectClientSetting(state, SETTINGS.FIRST_RUN_STARTED));
  const isOnFirstRun = pathname.includes(PAGES.AUTH);

  function handleContinue() {
    navigate(`/$/${PAGES.AUTH}`);
  }

  if (isOnFirstRun || !firstRunStarted || followingAcknowledged) {
    return null;
  }

  return (
    <Nag
      type="helpful"
      message={__('Continue setting up your account.')}
      actionText={__('Finish Up')}
      onClick={handleContinue}
    />
  );
}
