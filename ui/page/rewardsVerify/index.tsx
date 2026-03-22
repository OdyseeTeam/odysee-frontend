import React from 'react';
import UserVerify from 'component/userVerify';
import Page from 'component/page';
import { useNavigate } from 'react-router-dom';

function RewardsVerifyPage() {
  const navigate = useNavigate();
  return (
    <Page>
      <UserVerify onSkip={() => navigate(-1)} />
    </Page>
  );
}

export default RewardsVerifyPage;
