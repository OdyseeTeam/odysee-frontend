import Lbry from 'lbry';
import { doToast } from 'redux/actions/notifications';
import { Lbryio } from 'lbryinc';

type RewardCallbacks = {
  claimRewardSuccess: ((reward: any) => void) | null;
  claimFirstRewardSuccess: ((reward: any) => void) | null;
  rewardApprovalRequired: ((reward: any) => void) | null;
  [key: string]: ((reward: any) => void) | null | undefined;
};

type Rewards = {
  TYPE_NEW_DEVELOPER: string;
  TYPE_NEW_USER: string;
  TYPE_CONFIRM_EMAIL: string;
  TYPE_FIRST_CHANNEL: string;
  TYPE_FIRST_STREAM: string;
  TYPE_MANY_DOWNLOADS: string;
  TYPE_FIRST_PUBLISH: string;
  TYPE_REFERRAL: string;
  TYPE_REFEREE: string;
  TYPE_REWARD_CODE: string;
  TYPE_SUBSCRIPTION: string;
  YOUTUBE_CREATOR: string;
  TYPE_WEEKLY_WATCH: string;
  TYPE_NEW_ANDROID: string;
  claimReward: (type: string, rewardParams?: any) => Promise<any>;
  callbacks: RewardCallbacks;
  setCallback: (name: string, method: ((reward: any) => void) | null) => void;
};

const rewards: Rewards = {} as Rewards;
rewards.TYPE_NEW_DEVELOPER = 'new_developer';
rewards.TYPE_NEW_USER = 'new_user';
rewards.TYPE_CONFIRM_EMAIL = 'email_provided';
rewards.TYPE_FIRST_CHANNEL = 'new_channel';
rewards.TYPE_FIRST_STREAM = 'first_stream';
rewards.TYPE_MANY_DOWNLOADS = 'many_downloads';
rewards.TYPE_FIRST_PUBLISH = 'first_publish';
rewards.TYPE_REFERRAL = 'referrer';
rewards.TYPE_REFEREE = 'referee';
rewards.TYPE_REWARD_CODE = 'reward_code';
rewards.TYPE_SUBSCRIPTION = 'subscription';
rewards.YOUTUBE_CREATOR = 'youtube_creator';
rewards.TYPE_WEEKLY_WATCH = 'weekly_watch';
rewards.TYPE_NEW_ANDROID = 'new_android';

rewards.claimReward = (type, rewardParams) => {
  function requestReward(resolve: (value: any) => void, reject: (reason?: any) => void, params: any) {
    if (!Lbryio.enabled) {
      reject(new Error(__('Credits are not enabled.')));
      return;
    }

    Lbryio.call('reward', 'claim', params, 'post').then((reward: any) => {
      const message = reward.reward_notification || `You have claimed a ${reward.reward_amount} Credit.`;
      // Display global notice
      const action = doToast({
        message,
        linkText: __('Show All'),
        linkTarget: '/rewards',
      });
      window.store.dispatch(action);

      if (rewards.callbacks.claimRewardSuccess) {
        rewards.callbacks.claimRewardSuccess(reward);
      }

      resolve(reward);
    }, reject);
  }

  return new Promise((resolve, reject) => {
    Lbry.address_unused().then((address: string) => {
      const params: any = {
        reward_type: type,
        wallet_address: address,
        ...rewardParams,
      };

      switch (type) {
        case rewards.TYPE_FIRST_CHANNEL:
          Lbry.channel_list({
            page: 1,
            page_size: 10,
          })
            .then((claims: any) => {
              const claim =
                claims.items &&
                claims.items.find(
                  (foundClaim: any) =>
                    foundClaim.name.length &&
                    foundClaim.name[0] === '@' &&
                    foundClaim.txid.length &&
                    foundClaim.type === 'claim'
                );

              if (claim) {
                params.transaction_id = claim.txid;
                requestReward(resolve, reject, params);
              } else {
                reject(new Error(__('Please create a channel identity first.')));
              }
            })
            .catch(reject);
          break;

        case rewards.TYPE_FIRST_PUBLISH:
          Lbry.stream_list({
            page: 1,
            page_size: 10,
          })
            .then((claims: any) => {
              const claim =
                claims.items &&
                claims.items.find(
                  (foundClaim: any) =>
                    foundClaim.name.length &&
                    foundClaim.name[0] !== '@' &&
                    foundClaim.txid.length &&
                    foundClaim.type === 'claim'
                );

              if (claim) {
                params.transaction_id = claim.txid;
                requestReward(resolve, reject, params);
              } else {
                reject(
                  claims.length
                    ? new Error(
                        __('Please upload something and wait for confirmation by the network to claim this credit.')
                      )
                    : new Error(__('Please upload something to claim this credit.'))
                );
              }
            })
            .catch(reject);
          break;

        case rewards.TYPE_FIRST_STREAM:
        case rewards.TYPE_NEW_USER:
        default:
          requestReward(resolve, reject, params);
      }
    });
  });
};

rewards.callbacks = {
  // Set any callbacks that require code not found in this project
  claimRewardSuccess: null,
  claimFirstRewardSuccess: null,
  rewardApprovalRequired: null,
};

rewards.setCallback = (name, method) => {
  rewards.callbacks[name] = method;
};

export default rewards;
