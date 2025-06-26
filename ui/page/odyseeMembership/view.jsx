// @flow
import React from 'react';
import Page from 'component/page';
import Card from 'component/common/card';
import ChannelSelector from 'component/channelSelector';
import './style.scss';

type Props = {
  // -- redux --
  hasOdyseeLegacy: boolean,
};

const OdyseeMembershipPage = (props: Props) => {
  const {
    // -- redux --
    hasOdyseeLegacy,
  } = props;

  return (
    <Page className="premium-wrapper card-stack">
      <Card title={__('Odysee Premium')} subtitle={<ChannelSelector />}>
          <Card
            className="premium-explanation-text"
            title={__('Legacy Odysee Premium Membership')}
            subtitle={hasOdyseeLegacy
              ? __('Thank you for being a Legacy Odysee Premium Member. You will continue to have these benefits going forward as a token of our appreciation.')
              : __('Purchasing Odysee Premium Membership is not available at this time.')}
          />
      </Card>
    </Page>
  );
};

export default OdyseeMembershipPage;
