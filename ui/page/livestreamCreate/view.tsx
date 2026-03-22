import React from 'react';
import LivestreamForm from 'component/publish/livestream/livestreamForm';
import Page from 'component/page';
import YrblWalletEmpty from 'component/yrblWalletEmpty';
import Spinner from 'component/spinner';
import { useAppSelector } from 'redux/hooks';
import { selectFetchingMyChannels } from 'redux/selectors/claims';
import { selectBalance } from 'redux/selectors/wallet';

function LivestreamCreatePage() {
  const balance = useAppSelector(selectBalance);
  const fetchingChannels = useAppSelector(selectFetchingMyChannels);

  return (
    <Page noFooter>
      {balance < 0.01 && <YrblWalletEmpty />}
      {balance >= 0.01 && fetchingChannels ? (
        <div className="main--empty">
          <Spinner />
        </div>
      ) : (
        <LivestreamForm disabled={balance < 0.01} />
      )}
    </Page>
  );
}

export default LivestreamCreatePage;
