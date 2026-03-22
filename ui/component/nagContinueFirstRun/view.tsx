import * as PAGES from 'constants/pages';
import React from 'react';
import Nag from 'component/nag';
import { useLocation, useNavigate } from 'react-router-dom';
type Props = {
  followingAcknowledged: boolean;
  firstRunStarted: boolean;
  setClientSetting: (arg0: string, arg1: boolean) => void;
  syncSetttings: () => void;
};
export default function NagContinueFirstRun(props: Props) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { followingAcknowledged, firstRunStarted } = props;
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
