import React from 'react';
import Page from 'component/page';
import Invited from './internal/invited';
import Spinner from 'component/spinner';
import { useParams } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectPermanentUrlForUri } from 'redux/selectors/claims';
import { doResolveUri } from 'redux/actions/claims';

export default function ReferredPage() {
  const dispatch = useAppDispatch();
  const { referrer = '' } = useParams();
  const uri = `lbry://${referrer}`;
  const referrerUri = useAppSelector((state) => selectPermanentUrlForUri(state, uri));
  React.useEffect(() => {
    if (referrerUri === undefined) {
      dispatch(doResolveUri(uri));
    }
  }, [dispatch, referrerUri, uri]);
  return (
    <Page authPage>
      {referrerUri === undefined ? (
        <div className="main--empty">
          <Spinner />
        </div>
      ) : (
        <Invited referrerUri={referrerUri} />
      )}
    </Page>
  );
}
