import * as PAGES from 'constants/pages';
import React from 'react';
import ChannelEdit from 'component/channelEdit';
import Page from 'component/page';
import { useLocation, useNavigate } from 'react-router-dom';
import YrblWalletEmpty from 'component/yrblWalletEmpty';
type Props = {
  balance: number;
  claimConfirmEmailReward: () => void;
  isAuthenticated: boolean;
  channelCountOverLimit: boolean;
};

function ChannelNew(props: Props) {
  const { balance, claimConfirmEmailReward, isAuthenticated, channelCountOverLimit } = props;
  const navigate = useNavigate();
  const location = useLocation();
  const urlSearchParams = new URLSearchParams(location.search);
  const redirectUrl = urlSearchParams.get('redirect');
  const emptyBalance = balance === 0;
  React.useEffect(() => {
    if (isAuthenticated && emptyBalance) {
      claimConfirmEmailReward();
    }
  }, [isAuthenticated, claimConfirmEmailReward, emptyBalance]);
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
