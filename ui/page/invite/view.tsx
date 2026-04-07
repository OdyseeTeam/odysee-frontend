import { SITE_NAME } from 'config';
import * as SETTINGS from 'constants/settings';
import React from 'react';
import BusyIndicator from 'component/common/busy-indicator';
import InviteNew from 'component/inviteNew';
import InviteList from 'component/inviteList';
import Page from 'component/page';
import RewardAuthIntro from 'component/rewardAuthIntro';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import {
  selectUserInviteStatusFailed,
  selectUserInviteStatusIsPending,
  selectUserVerifiedEmail,
} from 'redux/selectors/user';
import { doFetchInviteStatus } from 'redux/actions/user';
import { selectClientSetting } from 'redux/selectors/settings';
import { doSetClientSetting } from 'redux/actions/settings';
import './style.scss';

function InvitePage() {
  const dispatch = useAppDispatch();
  const isFailed = useAppSelector(selectUserInviteStatusFailed);
  const isPending = useAppSelector(selectUserInviteStatusIsPending);
  const inviteAcknowledged = useAppSelector((state) => selectClientSetting(state, SETTINGS.INVITE_ACKNOWLEDGED));
  const authenticated = useAppSelector(selectUserVerifiedEmail);

  React.useEffect(() => {
    dispatch(doFetchInviteStatus(false));

    if (!inviteAcknowledged) {
      dispatch(doSetClientSetting(SETTINGS.INVITE_ACKNOWLEDGED, true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Page className="invite-page__wrapper">
      {!authenticated ? (
        <RewardAuthIntro
          title={__('Log in to %SITE_NAME% to Invite Your Friends', {
            SITE_NAME,
          })}
        />
      ) : (
        <React.Fragment>
          {isPending && <BusyIndicator message={__('Checking your invite status')} />}
          {!isPending && isFailed && <span className="empty">{__('Failed to retrieve invite status.')}</span>}
          {!isPending && !isFailed && (
            <React.Fragment>
              <InviteNew />
              <InviteList />
            </React.Fragment>
          )}
        </React.Fragment>
      )}
    </Page>
  );
}

export default InvitePage;
