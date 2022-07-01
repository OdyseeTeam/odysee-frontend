// @flow
import React from 'react';
import PostForm from 'component/publish/post/postForm';
import Page from 'component/page';
import YrblWalletEmpty from 'component/yrblWalletEmpty';
import Spinner from 'component/spinner';

type Props = {
  balance: number,
  fetchingChannels: boolean,
};

function PostPage(props: Props) {
  const { balance, fetchingChannels } = props;

  return (
    <Page className="uploadPage-wrapper" noFooter>
      {balance === 0 && <YrblWalletEmpty />}
      {balance !== 0 && fetchingChannels ? (
        <div className="main--empty">
          <Spinner />
        </div>
      ) : (
        <PostForm disabled={balance === 0} />
      )}
    </Page>
  );
}

export default PostPage;
