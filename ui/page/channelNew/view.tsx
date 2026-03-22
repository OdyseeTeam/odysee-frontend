import * as PAGES from 'constants/pages';
import REWARD_TYPES from 'rewards';
import React from 'react';
import ChannelEdit from 'component/channelEdit';
import Page from 'component/page';
import { useLocation, useNavigate } from 'react-router-dom';
import YrblWalletEmpty from 'component/yrblWalletEmpty';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectBalance } from 'redux/selectors/wallet';
import { selectUserVerifiedEmail } from 'redux/selectors/user';
import { selectIsMyChannelCountOverLimit } from 'redux/selectors/claims';
import { doClaimRewardType } from 'redux/actions/rewards';

function ChannelNew() {
  const dispatch = useAppDispatch();
  const balance = useAppSelector(selectBalance);
  const isAuthenticated = useAppSelector(selectUserVerifiedEmail);
  const channelCountOverLimit = useAppSelector(selectIsMyChannelCountOverLimit);

  const navigate = useNavigate();
  const location = useLocation();
  const urlSearchParams = new URLSearchParams(location.search);
  const redirectUrl = urlSearchParams.get('redirect');
  const emptyBalance = balance === 0;
  React.useEffect(() => {
    if (isAuthenticated && emptyBalance) {
      dispatch(doClaimRewardType(REWARD_TYPES.TYPE_CONFIRM_EMAIL, { notifyError: false }));
    }
  }, [isAuthenticated, emptyBalance, dispatch]);
  return (
    <Page
      className="channelPage-wrapper channelPage-edit-wrapper channelPage-new-wrapper"
      noSideNavigation
      fullWidthPage
      noFooter
      backout={{
        title: __('Create a channel'),
        backLabel: __('Cancel'),
      }}
    >
      {emptyBalance && <YrblWalletEmpty />}

      {channelCountOverLimit && (
        <div className="empty empty--centered">{__('Sorry, you have exceeded the channel creation limit.')}</div>
      )}

      <ChannelEdit
        disabled={emptyBalance || channelCountOverLimit}
        onDone={() => {
          navigate(redirectUrl || `/$/${PAGES.CHANNELS}`);
        }}
      />
    </Page>
  );
}

export default ChannelNew;
