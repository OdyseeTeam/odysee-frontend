import React from 'react';
import TotalBackground from './total-background.png';
import useTween from 'effects/use-tween';
import I18nMessage from 'component/i18nMessage';
import LbcSymbol from 'component/common/lbc-symbol';
import { useAppSelector } from 'redux/hooks';
import { selectClaimedRewards } from 'redux/selectors/rewards';
type Props = Record<string, never>;

function RewardTotal(props: Props) {
  const rewards = useAppSelector(selectClaimedRewards);
  const rewardTotal = rewards.reduce((acc, val) => acc + val.reward_amount, 0);
  const modifier = rewardTotal > 500 ? 1 : 15; // used to tweak the reward count speed

  const total = useTween(rewardTotal * modifier);
  const integer = Math.round(total * rewardTotal);
  return (
    <section
      className="card  card--section card--reward-total"
      style={{
        backgroundImage: `url(${TotalBackground})`,
      }}
    >
      <I18nMessage
        tokens={{
          amount: integer,
          lbc: <LbcSymbol />,
        }}
      >
        %amount% %lbc% earned from rewards
      </I18nMessage>
    </section>
  );
}

export default RewardTotal;
