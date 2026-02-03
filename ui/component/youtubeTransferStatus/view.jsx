// @flow
import { SITE_HELP_EMAIL } from 'config';
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
  experimentalUi: boolean,
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
    experimentalUi,
  } = props;
  const hasChannels = youtubeChannels && youtubeChannels.length > 0;
  const transferEnabled = youtubeChannels.some((status) => status.transferable);
  const hasPendingTransfers = youtubeChannels.some(
    (status) => status.transfer_state === YOUTUBE_STATUSES.YOUTUBE_SYNC_PENDING_TRANSFER
  );

  // Get the first available status token for self-sync
  const firstAvailableToken = hasChannels
    ? youtubeChannels.find((channel) => channel.status_token)?.status_token
    : null;

  // State for token visibility
  const [isTokenVisible, setIsTokenVisible] = React.useState(false);
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
          return __('This channel is not eligible to be synced');
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
              __('Please check back later. This may take a few hours.')}

            {isYoutubeTransferComplete &&
              !isNotElligible &&
              __('Transfer complete. You can view your channel, or choose a new channel to sync.')}
            {isNotElligible && (
              <I18nMessage
                tokens={{
                  here: (
                    <Button
                      button="link"
                      href="https://help.odysee.tv/category-syncprogram/limits/#requirements/"
                      label={__('here')}
                    />
                  ),
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
                vip: isVip,
                reviewed: isReviewed,
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

              const isAutomatedSync = isVip === true;
              const isNotEligible = syncStatus === YOUTUBE_STATUSES.YOUTUBE_SYNC_ABANDONDED && isReviewed === true;

              return (
                <div key={url} className="card--inline sync-state">
                  {claimId ? (
                    <ClaimPreview
                      uri={url}
                      actions={
                        <div className="help">
                          <div>{transferState}</div>
                          {!isAutomatedSync && (
                            <div className="help--inline">
                              {__(
                                'This channel is not automatically syncing right now. If you want to sync more content, reach out to hello@odysee.com to use the self sync tool.'
                              )}
                            </div>
                          )}
                        </div>
                      }
                      properties={false}
                      hideJoin
                    />
                  ) : (
                    <div className="error">
                      {isNotEligible ? (
                        <div>
                          {__(
                            '%channelName% is not eligible to be synced. Reach out to hello@odysee.com for access to the self sync tool.',
                            { channelName }
                          )}
                        </div>
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
                            {isReviewed === false ? (
                              <>
                                {__('Automated sync status is still under review')}
                                <Icon icon={ICONS.NOT_COMPLETED} className={classnames('progress__complete-icon')} />
                              </>
                            ) : isAutomatedSync ? (
                              <>
                                {__('Wait for your videos to be synced')}
                                {isWaitingForSync ? (
                                  <Spinner type="small" />
                                ) : (
                                  <Icon icon={ICONS.COMPLETED} className="progress__complete-icon--completed" />
                                )}
                              </>
                            ) : (
                              <>
                                {__(
                                  'Wait for sync to start, or reach out to hello@odysee.com to use the self sync tool'
                                )}
                                <Icon icon={ICONS.NOT_COMPLETED} className={classnames('progress__complete-icon')} />
                              </>
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
                              '*Not all content may be processed. There are limitations based on both YouTube and Odysee activity. Click Learn More below to see the latest requirements and limits. If you need to sync more content, reach out to hello@odysee.com for access to the self sync tool.'
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
            </div>
            {addNewChannel && (
              <div className="section__actions section__actions--above-list">
                <Button button="primary" label={__('Add Another Channel')} onClick={addNewChannel} />
              </div>
            )}

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

            {/* Self-Sync Alternative - Only show for experimental UI users */}
            {experimentalUi && (
              <div className="card card--self-sync">
                <div className="card__header">
                  <h4>
                    {__('Want to sync more content?')}{' '}
                    <Button
                      button="link"
                      label={__('Try Self-Sync')}
                      href="https://sync.odysee.tv/"
                      className="header-link"
                    />
                  </h4>
                </div>
                <div className="card__body">
                  <p>
                    {__(
                      "Use our desktop sync tool to transfer content from your YouTube channels including inactive or never-synced channels. If you've already synced a channel before, you can still use Self-Sync to upload additional content, including videos outside of our default sync limits (for example, longer videos)."
                    )}
                  </p>

                  {firstAvailableToken && (
                    <div className="token-section">
                      <div className="token-section__header">
                        <strong>{__('Your token:')}</strong>
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
                                console.log('Failed to copy token:', err);
                              }
                            }}
                          />
                        </div>

                        <p className="help">
                          {__(
                            'This token is private. Do not share it. Copy this token and paste it into the sync tool when prompted. Click the token to reveal it.'
                          )}
                        </p>

                        <div className="help help--inline">
                          <strong>{__('How to use it:')}</strong>
                          <ol className="help-list help-list--detailed">
                            <li>{__('Copy this token')}</li>
                            <li>{__('Open the desktop sync tool')}</li>
                            <li>{__('Paste the token when prompted')}</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="help-section">
                    <p className="help">
                      <strong>{__('Important Notes:')}</strong>
                    </p>

                    <div className="help help--inline">
                      <strong>{__('1. Channels with many or age-restricted videos')}</strong>
                      <div className="help--inline">
                        {__(
                          'If your YouTube channel has many videos or age-gated content, you may need to enable "Use browser cookies" in the sync tool.'
                        )}
                      </div>
                      <div className="help--inline">
                        <strong>{__('Recommended setup on Windows:')}</strong>
                        <ul className="help-list help-list--detailed">
                          <li>{__('Use Firefox')}</li>
                          <li>{__('Sign in to YouTube in Firefox')}</li>
                          <li>
                            {__(
                              'In the sync tool: right-click the taskbar icon → Preferences → enable "Use browser cookies"'
                            )}
                          </li>
                        </ul>
                        <div className="help--inline">
                          {__('This method works best for large channels and age-restricted videos.')}
                        </div>
                      </div>
                    </div>

                    <div className="help help--inline">
                      <strong>{__('2. Retrying failed uploads')}</strong>
                      <ul className="help-list help-list--detailed">
                        <li>{__('Quit the sync app')}</li>
                        <li>{__('Restart the app to retry')}</li>
                      </ul>
                    </div>

                    <div className="help help--inline">
                      <strong>{__('3. New vs existing Odysee channels')}</strong>
                      <ul className="help-list help-list--detailed">
                        <li>{__('New users: the sync tool will automatically create a new Odysee channel')}</li>
                        <li>
                          {__(
                            'Existing channels: to sync into an existing Odysee channel, contact hello@odysee.com before syncing'
                          )}
                        </li>
                      </ul>
                    </div>

                    <div className="help help--inline">
                      <strong>{__('4. Manual uploads and duplicates')}</strong>
                      <ul className="help-list help-list--detailed">
                        <li>{__('Videos will not be automatically de-duplicated')}</li>
                        <li>
                          {__('If you have many manual uploads, contact hello@odysee.com before syncing for help')}
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="card__actions card__actions--inline">
                    <Button
                      button="secondary"
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
                </div>
              </div>
            )}
          </>
        }
      />
    )
  );
}
