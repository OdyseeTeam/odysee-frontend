// @flow
import { DOMAIN } from 'config';
import * as ICONS from 'constants/icons';
import * as React from 'react';
import Button from 'component/button';
import ClaimPreview from 'component/claimPreview';
import Card from 'component/common/card';
import { YOUTUBE_STATUSES } from 'lbryinc';
import { buildURI } from 'util/lbryURI';
import Spinner from 'component/spinner';
import Icon from 'component/common/icon';
import './style.lazy.scss';

type Props = {
  youtubeChannels: Array<any>,
  youtubeImportPending: boolean,
  claimChannels: () => void,
  updateUser: () => void,
  checkYoutubeTransfer: () => void,
  videosImported: ?Array<number>,
  alwaysShow: boolean,
  addNewChannel?: boolean,
  autoOpenSync?: boolean,
  doResolveUris: (uris: Array<string>) => void,
};

const AUTO_OPEN_SYNC_PARAM = 'open_in_sync';
const AUTO_OPEN_SYNC_PARAM_ALT = 'open_app';

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
    autoOpenSync = false,
    doResolveUris,
  } = props;
  const hasChannels = youtubeChannels && youtubeChannels.length > 0;
  const transferEnabled = youtubeChannels.some((status) => status.transferable);
  const hasPendingTransfers = youtubeChannels.some(
    (status) => status.transfer_state === YOUTUBE_STATUSES.YOUTUBE_SYNC_PENDING_TRANSFER
  );

  const firstAvailableToken = hasChannels
    ? youtubeChannels.find((channel) => channel.status_token)?.status_token
    : null;
  const selfSyncDeepLink = firstAvailableToken ? `odysee://token/${firstAvailableToken}` : null;
  const selfSyncLauncherUrl = selfSyncDeepLink
    ? `https://${DOMAIN}/$/spinner?launch=${encodeURIComponent(selfSyncDeepLink)}`
    : null;
  const hasAutoOpenedRef = React.useRef(false);

  const [isTokenVisible, setIsTokenVisible] = React.useState(false);
  const isYoutubeTransferComplete =
    hasChannels &&
    youtubeChannels.every(
      (channel) =>
        channel.transfer_state === YOUTUBE_STATUSES.YOUTUBE_SYNC_COMPLETED_TRANSFER ||
        channel.sync_status === YOUTUBE_STATUSES.YOUTUBE_SYNC_ABANDONDED
    );

  let total;
  let complete;
  if (hasPendingTransfers && videosImported) {
    complete = videosImported[0];
    total = videosImported[1];
  }

  function clearAutoOpenParamsFromUrl() {
    const url = new URL(window.location.href);
    url.searchParams.delete(AUTO_OPEN_SYNC_PARAM);
    url.searchParams.delete(AUTO_OPEN_SYNC_PARAM_ALT);
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
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
          return null;
      }
    } else {
      return __('Ready to transfer');
    }
  }

  React.useEffect(() => {
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

  React.useEffect(() => {
    if (!autoOpenSync || hasAutoOpenedRef.current || !selfSyncLauncherUrl) {
      return;
    }

    hasAutoOpenedRef.current = true;
    clearAutoOpenParamsFromUrl();

    const launcherWindow = window.open(selfSyncLauncherUrl, '_blank');
    if (!launcherWindow) {
      window.location.href = selfSyncLauncherUrl;
    }
  }, [autoOpenSync, selfSyncLauncherUrl]);

  return (
    (alwaysShow || (hasChannels && !isYoutubeTransferComplete)) && (
      <Card
        className="card--yt-sync"
        title={
          isYoutubeTransferComplete
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
              __('Please check back later, this may take a few hours.')}
            {isYoutubeTransferComplete && __('View your channel or choose a new channel to sync.')}
          </span>
        }
        body={
          <section className="yt-sync__channels">
            {youtubeChannels.map((channel) => {
              const {
                lbry_channel_name: channelName,
                channel_claim_id: claimId,
                sync_status: syncStatus,
                total_subs: totalSubs,
                total_videos: totalVideos,
                vip: isVip,
              } = channel;
              const url = buildURI({ channelName, channelClaimId: claimId });
              doResolveUris([url]);
              const isWaitingForSync =
                syncStatus === YOUTUBE_STATUSES.YOUTUBE_SYNC_QUEUED ||
                syncStatus === YOUTUBE_STATUSES.YOUTUBE_SYNC_PENDING ||
                syncStatus === YOUTUBE_STATUSES.YOUTUBE_SYNC_PENDING_EMAIL ||
                syncStatus === YOUTUBE_STATUSES.YOUTUBE_SYNC_PENDINGUPGRADE ||
                syncStatus === YOUTUBE_STATUSES.YOUTUBE_SYNC_SYNCING;

              const isAutomatedSync = isVip === true;
              const transferMessage = claimId ? getMessage(channel) : null;

              return (
                <div key={url} className="yt-sync__channel-block">
                  {claimId ? (
                    <ClaimPreview
                      uri={url}
                      actions={
                        <div className="help">
                          {transferMessage && <div>{transferMessage}</div>}
                          {isAutomatedSync ? (
                            <div className="help--inline">
                              {__(
                                'Automated syncing by Odysee is on. You can still run the Self Sync tool to pick up any content that may have been missed or age-restricted content.'
                              )}
                            </div>
                          ) : (
                            <div className="help--inline">
                              {__('Use the Self Sync Tool below to continue syncing.')}
                            </div>
                          )}
                        </div>
                      }
                      properties={false}
                      hideJoin
                    />
                  ) : (
                    <div className="yt-sync__channel-info">
                      <div className="yt-sync__channel-name">{channelName}</div>
                      {isAutomatedSync ? (
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
                          <div className="progress__item">
                            {__('Claim your channel')}
                            <Icon icon={ICONS.NOT_COMPLETED} className="progress__complete-icon" />
                          </div>
                        </div>
                      ) : (
                        <div className="yt-sync__self-sync-prompt">
                          <p>
                            {__('%total_videos% videos • %total_subs% subscriptions', {
                              total_videos: totalVideos,
                              total_subs: totalSubs,
                            })}
                          </p>
                          <Button
                            button="link"
                            label={__('Download Self Sync Tool to start syncing')}
                            href="https://sync.odysee.tv/"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {complete != null && total != null && (
              <div className="section help">{__('%complete% / %total% videos transferred', { complete, total })}</div>
            )}
          </section>
        }
        actions={
          <>
            <div className="section__actions">
              {!isYoutubeTransferComplete && transferEnabled && (
                <Button
                  button="primary"
                  disabled={youtubeImportPending}
                  onClick={claimChannels}
                  label={youtubeChannels.length > 1 ? __('Claim Channels') : __('Claim Channel')}
                />
              )}
              {addNewChannel && <Button button="secondary" label={__('Add Another Channel')} onClick={addNewChannel} />}
            </div>

            <p className="help">
              {youtubeChannels.length > 1
                ? __('You will be able to claim your channels once they finish syncing.')
                : __('You will be able to claim your channel once it has finished syncing.')}{' '}
              {youtubeImportPending &&
                __('You will not be able to edit the channel or content until the transfer process completes.')}{' '}
              <Button
                button="link"
                label={__('Learn More')}
                href="https://help.odysee.tv/category-syncprogram/category-walkthrough/claimingyourchannel/"
              />
            </p>

            {/* Self Sync Tool */}
            <div className="card card--self-sync">
              <div className="card__header">
                <h4>{__('Self Sync Tool')}</h4>
              </div>
              <div className="card__body">
                <p>
                  {__(
                    'Use the Self Sync tool to transfer content from any of your YouTube channels, including content outside of our default sync limits such as longer videos or age-restricted content.'
                  )}
                </p>

                <div className="card__actions card__actions--inline">
                  {autoOpenSync && selfSyncLauncherUrl && (
                    <Button button="primary" label={__('Launch Self Sync Tool')} href={selfSyncLauncherUrl} />
                  )}
                  <Button
                    button="primary"
                    label={__('Download Sync Tool')}
                    href="https://sync.odysee.tv/"
                    iconRight="EXTERNAL"
                  />
                  <Button
                    button="link"
                    label={__('How to use')}
                    href="https://help.odysee.tv/category-syncprogram/synctool/"
                  />
                </div>

                {firstAvailableToken && (
                  <div className="token-section">
                    <div className="token-section__header">
                      <strong>{__('Auth Token')}</strong>
                      <span className="help">{__('(use this if the tool does not open automatically)')}</span>
                    </div>
                    <div className="token-display">
                      <div className="token-display__value">
                        <code
                          className={`token-code ${!isTokenVisible ? 'token-code--hidden' : ''}`}
                          onClick={() => setIsTokenVisible(!isTokenVisible)}
                          title={isTokenVisible ? __('Click to hide token') : __('Click to reveal token')}
                        >
                          {isTokenVisible ? firstAvailableToken : '••••••••••••••••••••••••••••••••'}
                        </code>
                        <Button
                          button="secondary"
                          icon={ICONS.COPY}
                          aria-label={__('Copy token')}
                          title={__('Copy token to clipboard')}
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(firstAvailableToken);
                            } catch (err) {
                              // eslint-disable-next-line no-console
                              console.log('Failed to copy token:', err);
                            }
                          }}
                        />
                      </div>
                      <p className="help">
                        {isTokenVisible
                          ? __(
                              'This token is private — do not share it. Copy and paste it into the sync tool when prompted. Click the token to hide it.'
                            )
                          : __(
                              'This token is private — do not share it. Click copy or click the token field to reveal it.'
                            )}
                      </p>
                    </div>
                  </div>
                )}

                <div className="help-section">
                  <ul className="help-list help-list--detailed">
                    <li>{__('You can de-duplicate manually uploaded content via the sync tool.')}</li>
                    <li>{__('New channels can still change their desired channel name.')}</li>
                    <li>
                      {__(
                        'You can now sync into an existing Odysee channel, choose that option in the configure menu.'
                      )}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        }
      />
    )
  );
}
