import React from 'react';
import { URL } from 'config';
import { formatLbryUrlForWeb } from 'util/url';
import * as ICONS from 'constants/icons';
import CopyableText from 'component/copyableText';
import ChannelThumbnail from 'component/channelThumbnail';
import ButtonNavigateChannelId from 'component/buttonNavigateChannelId';
import TruncatedText from 'component/common/truncated-text';
import { useAppSelector } from 'redux/hooks';
import { selectSupportersAmountForChannelId, selectMonthlyIncomeForChannelId } from 'redux/selectors/memberships';
type Props = {
  channelClaim: ChannelClaim;
  onSelect: () => void;
};

const ChannelOverview = (props: Props) => {
  const { channelClaim, onSelect } = props;
  const supportersAmount = useAppSelector((state) => selectSupportersAmountForChannelId(state, channelClaim.claim_id));
  const monthlyIncome = useAppSelector((state) => selectMonthlyIncomeForChannelId(state, channelClaim.claim_id));
  return (
    <>
      <button type="button" className="membership-overview-channel__select" onClick={onSelect}>
        <span className="membership-overview-channel__identity">
          <ChannelThumbnail xsmall uri={channelClaim.canonical_url} />
          <TruncatedText text={channelClaim.value.title || channelClaim.name} lines={1} />
        </span>

        <span className="membership-overview-channel__metric">
          <span>{__('Supporters')}</span>
          {supportersAmount}
        </span>
        <span className="membership-overview-channel__metric">
          <span>{__('Estimated Monthly Income')}</span>${(monthlyIncome / 100).toFixed(2)}
        </span>
      </button>

      <div className="membership-overview-channel__action">
        <ButtonNavigateChannelId
          button="alt"
          channelId={channelClaim.claim_id}
          icon={ICONS.MEMBERSHIP}
          navigate={`${formatLbryUrlForWeb(channelClaim.canonical_url)}?view=membership`}
        />
      </div>

      <div className="membership-overview-channel__action">
        <CopyableText // onlyCopy
          hideValue // primaryButton
          // linkTo={`${URL}${formatLbryUrlForWeb(channelClaim.canonical_url)}?view=membership`}
          copyable={`${URL}${formatLbryUrlForWeb(channelClaim.canonical_url)}?view=membership`}
          snackMessage={__('Page location copied')}
        />
      </div>
    </>
  );
};

export default ChannelOverview;
