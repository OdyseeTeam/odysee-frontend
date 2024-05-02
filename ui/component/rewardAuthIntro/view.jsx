// @flow
import { SITE_NAME } from 'config';
import * as PAGES from 'constants/pages';
import React from 'react';
import Button from 'component/button';
import Card from 'component/common/card';

type Props = {
  balance: number,
  totalRewardValue: number,
  title?: string,
};

function RewardAuthIntro(props: Props) {
  const { title } = props;

  return (
    <Card
      title={title || __('Unlock %SITE_NAME% Credits', { SITE_NAME })}
      actions={
        <Button
          requiresAuth
          button="primary"
          navigate={`/$/${PAGES.REWARDS_VERIFY}?redirect=/$/${PAGES.REWARDS}`}
          label={__('Unlock Credits')}
        />
      }
    />
  );
}

export default RewardAuthIntro;
