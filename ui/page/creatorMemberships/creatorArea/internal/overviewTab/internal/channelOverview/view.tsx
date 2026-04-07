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
};

const ChannelOverview = (props: Props) => {
  const { channelClaim } = props;
  const supportersAmount = useAppSelector((state) => selectSupportersAmountForChannelId(state, channelClaim.claim_id));
  const monthlyIncome = useAppSelector((state) => selectMonthlyIncomeForChannelId(state, channelClaim.claim_id));
  return (
    <>
      <td className="channelThumbnail">
        <ChannelThumbnail xsmall uri={channelClaim.canonical_url} />
      </td>

      <td>
        <TruncatedText text={channelClaim.value.title || channelClaim.name} lines={1} />
      </td>

      <td>{supportersAmount}</td>
      <td>${(monthlyIncome / 100).toFixed(2)}</td>

      <td>
        <ButtonNavigateChannelId
          button="alt"
          channelId={channelClaim.claim_id}
          icon={ICONS.MEMBERSHIP}
          navigate={`${formatLbryUrlForWeb(channelClaim.canonical_url)}?view=membership`}
        />
      </td>

      <td className="membership-table__url">
        <CopyableText // onlyCopy
          hideValue // primaryButton
          // linkTo={`${URL}${formatLbryUrlForWeb(channelClaim.canonical_url)}?view=membership`}
          copyable={`${URL}${formatLbryUrlForWeb(channelClaim.canonical_url)}?view=membership`}
          snackMessage={__('Page location copied')}
        />
      </td>
    </>
  );
};

export default ChannelOverview;
