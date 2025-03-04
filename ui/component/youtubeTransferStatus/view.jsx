// @flow
import { SITE_NAME, SITE_HELP_EMAIL } from 'config';
import * as ICONS from 'constants/icons';
import * as React from 'react';
import classnames from 'classnames';
import Button from 'component/button';
import ClaimPreview from 'component/claimPreview';
import Card from 'component/common/card';
import { YOUTUBE_STATUSES } from 'lbryinc';
import { buildURI } from 'util/lbryURI';
import Spinner from 'component/spinner';
import Icon from 'component/common/icon';
import I18nMessage from 'component/i18nMessage';
import './style.lazy.scss';

type Props = {
  youtubeChannels: Array<any>,
  youtubeImportPending: boolean,
  claimChannels: () => void,
  updateUser: () => void,
  checkYoutubeTransfer: () => void,
  videosImported: ?Array<number>, // [currentAmountImported, totalAmountToImport]
  alwaysShow: boolean,
  addNewChannel?: boolean,
  doResolveUris: (uris: Array<string>) => void,
};

export default function YoutubeTransferStatus(props: Props) {
  const {
    youtubeChannels,
    youtubeImportPending,
    claimChannels,
    videosImported,
    checkYoutubeTransfer,
    updateUser,
    alwaysShow = false,
    addNewChannel,
    doResolveUris,
  } = props;
  const hasChannels = youtubeChannels && youtubeChannels.length > 0;
  const transferEnabled = youtubeChannels.some((status) => status.transferable);
  const hasPendingTransfers = youtubeChannels.some(
    (status) => status.transfer_state === YOUTUBE_STATUSES.YOUTUBE_SYNC_PENDING_TRANSFER
  );
  const isYoutubeTransferComplete =
    hasChannels &&
    youtubeChannels.every(
      (channel) =>
        channel.transfer_state === YOUTUBE_STATUSES.YOUTUBE_SYNC_COMPLETED_TRANSFER ||
        channel.sync_status === YOUTUBE_STATUSES.YOUTUBE_SYNC_ABANDONDED
    );

  const isNotElligible =
    hasChannels && youtubeChannels.every((channel) => channel.sync_status === YOUTUBE_STATUSES.YOUTUBE_SYNC_ABANDONDED);

  let total;
  let complete;
  if (hasPendingTransfers && videosImported) {
    complete = videosImported[0];
    total = videosImported[1];
  }

  function getMessage(channel) {
    const { transferable, transfer_state: transferState, sync_status: syncStatus } = channel;
    if (!transferable) {
      switch (transferState) {
        case YOUTUBE_STATUSES.YOUTUBE_SYNC_NOT_TRANSFERRED:
          return syncStatus[0].toUpperCase() + syncStatus.slice(1);
        case YOUTUBE_STATUSES.YOUTUBE_SYNC_PENDING_TRANSFER:
          return __('Transfer in progress');
        case YOUTUBE_STATUSES.YOUTUBE_SYNC_COMPLETED_TRANSFER:
          return __('Completed transfer');
        case YOUTUBE_STATUSES.YOUTUBE_SYNC_ABANDONDED:
          return __('This channel not eligible to by synced');
      }
    } else {
      return __('Ready to transfer');
    }
  }

  React.useEffect(() => {
    // If a channel is transferable, there's nothing to check
    if (hasPendingTransfers) {
      checkYoutubeTransfer();

      let interval = setInterval(() => {
        checkYoutubeTransfer();
        updateUser();
      }, 60 * 1000);

      return () => {
        clearInterval(interval);
      };
    }
  }, [hasPendingTransfers, checkYoutubeTransfer, updateUser]);

  return (
    (alwaysShow || (hasChannels && !isYoutubeTransferComplete)) && (
      <Card
        title={
          isNotElligible
            ? __('Process complete')
            : isYoutubeTransferComplete
            ? __('Transfer complete')
            : youtubeChannels.length > 1
            ? __('Your YouTube channels')
            : __('Your YouTube channel')
        }
        subtitle={
          <span>
            {hasPendingTransfers &&
              __('Your videos are currently being transferred. There is nothing else for you to do.')}
            {transferEnabled && !hasPendingTransfers && __('Your videos are ready to be transferred.')}
            {!transferEnabled &&
              !hasPendingTransfers &&
              !isYoutubeTransferComplete &&
              !isNotElligible &&
              __('Please check back later, this may take a few hours.')}

            {isYoutubeTransferComplete && !isNotElligible && __('View your channel or choose a new channel to sync.')}
            {isNotElligible && (
              <I18nMessage
                tokens={{
                  here: <Button button="link" href="https://help.odysee.tv/category-syncprogram/" label={__('here')} />,
                  email: SITE_HELP_EMAIL,
                }}
              >
                Email %email% if you think there has been a mistake. Make sure your channel qualifies %here%.
              </I18nMessage>
            )}
          </span>
        }
        body={
          <section>
            {youtubeChannels.map((channel, index) => {
              const {
                lbry_channel_name: channelName,
                channel_claim_id: claimId,
                sync_status: syncStatus,
                total_subs: totalSubs,
                total_videos: totalVideos,
              } = channel;
              const url = buildURI({ channelName, channelClaimId: claimId });
              doResolveUris([url]);
              const transferState = getMessage(channel);
              const isWaitingForSync =
                syncStatus === YOUTUBE_STATUSES.YOUTUBE_SYNC_QUEUED ||
                syncStatus === YOUTUBE_STATUSES.YOUTUBE_SYNC_PENDING ||
                syncStatus === YOUTUBE_STATUSES.YOUTUBE_SYNC_PENDING_EMAIL ||
                syncStatus === YOUTUBE_STATUSES.YOUTUBE_SYNC_PENDINGUPGRADE ||
                syncStatus === YOUTUBE_STATUSES.YOUTUBE_SYNC_SYNCING;

              const isNotEligible = syncStatus === YOUTUBE_STATUSES.YOUTUBE_SYNC_ABANDONDED;

              return (
                <div key={url} className="card--inline sync-state">
                  {claimId ? (
                    <ClaimPreview
                      uri={url}
                      actions={<span className="help">{transferState}</span>}
                      properties={false}
                      hideJoin
                    />
                  ) : (
                    <div className="error">
                      {isNotEligible ? (
                        <div>{__('%channelName% is not eligible to be synced', { channelName })}</div>
                      ) : (
                        <div className="progress">
                          <div className="progress__item">
                            {__('Claim your handle %handle%', { handle: channelName })}
                            <Icon icon={ICONS.COMPLETED} className="progress__complete-icon--completed" />
                          </div>
                          <div className="progress__item">
                            {__('Agree to sync')}{' '}
                            <Icon icon={ICONS.COMPLETED} className="progress__complete-icon--completed" />
                          </div>
                          <div className="progress__item">
                            {__('Wait for your videos to be synced')}
                            {isWaitingForSync ? (
                              <Spinner type="small" />
                            ) : (
                              <Icon icon={ICONS.COMPLETED} className="progress__complete-icon--completed" />
                            )}
                          </div>
                          <div className="help--inline">
                            {__('Syncing %total_videos% videos from your channel with %total_subs% subscriptions.', {
                              total_videos: totalVideos,
                              total_subs: totalSubs,
                            })}
                          </div>
                          <div className="help--inline">
                            {' '}
                            {__(
                              '*Not all content may be processed, there are limitations based on both Youtube and Odysee activity. Click Learn More at the bottom to see the latest requirements and limits. '
                            )}{' '}
                          </div>

                          <div className="progress__item">
                            {__('Claim your channel')}
                            <Icon icon={ICONS.NOT_COMPLETED} className={classnames('progress__complete-icon')} />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {videosImported && (
              <div className="section help">{__('%complete% / %total% videos transferred', { complete, total })}</div>
            )}
          </section>
        }
        actions={
          <>
            <div className="section__actions">
              {!isYoutubeTransferComplete && (
                <Button
                  button="primary"
                  disabled={youtubeImportPending || !transferEnabled}
                  onClick={claimChannels}
                  label={youtubeChannels.length > 1 ? __('Claim Channels') : __('Claim Channel')}
                />
              )}
              {addNewChannel && <Button button="link" label={__('Add Another Channel')} onClick={addNewChannel} />}
              <Button
                button={isYoutubeTransferComplete ? 'primary' : 'link'}
                label={__('Explore %SITE_NAME%', { SITE_NAME })}
                navigate="/"
              />
            </div>

            <p className="help">
              {youtubeChannels.length > 1
                ? __('You will be able to claim your channels once they finish syncing.')
                : __('You will be able to claim your channel once it has finished syncing.')}{' '}
              {youtubeImportPending &&
                __('You will not be able to edit the channel or content until the transfer process completes.')}{' '}
              <Button button="link" label={__('Learn More')} href="https://help.odysee.tv/category-syncprogram/" />
            </p>
          </>
        }
      />
    )
  );
}
