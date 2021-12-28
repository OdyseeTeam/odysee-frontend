// @flow
import React from 'react';
import Page from 'component/page';
import UserOAuth from 'component/userOAuth';

export default function OAuthPage() {
  return (
    <Page authPage>
      <UserOAuth />
    </Page>
  );
}
