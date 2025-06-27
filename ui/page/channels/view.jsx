// @flow
import React from 'react';
import ClaimList from 'component/claimList';
import Page from 'component/page';
import Button from 'component/button';
import Spinner from 'component/spinner';
import Yrbl from 'component/yrbl';
import Icon from 'component/common/icon';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import { lazyImport } from 'util/lazyImport';
import { useHistory } from 'react-router';

const YoutubeTransferStatus = lazyImport(() =>
  import('component/youtubeTransferStatus' /* webpackChunkName: "youtubeTransferStatus" */)
);

type Props = {
  // -- redux --
  channelUrls: Array<string>,
  channelIds: ?ClaimIds,
  fetchingChannels: boolean,
  hasYoutubeChannels: boolean,
  doFetchChannelListMine: () => void,
  doSetActiveChannel: (string) => void,
  doFetchOdyseeMembershipForChannelIds: (claimIds: ClaimIds) => void,
};

export default function ChannelsPage(props: Props) {
  const {
    // -- redux --
    channelUrls,
    channelIds,
    fetchingChannels,
    hasYoutubeChannels,
    doFetchChannelListMine,
    doSetActiveChannel,
    doFetchOdyseeMembershipForChannelIds,
  } = props;

  const hasChannels = Number.isInteger(channelIds?.length);

  React.useEffect(() => {
    if (channelIds) {
      doFetchOdyseeMembershipForChannelIds(channelIds);
    } else {
      doFetchChannelListMine();
    }
  }, [channelIds, doFetchChannelListMine, doFetchOdyseeMembershipForChannelIds]);

  const { push } = useHistory();

  if (!hasChannels && !hasYoutubeChannels) {
    return (
      <Page className="channelsPage-wrapper">
        {fetchingChannels ? (
          <div className="main--empty">
            <Spinner delayed />
          </div>
        ) : (
          <Yrbl
            title={__('No channels')}
            subtitle={__("You haven't created a channel yet. All of your beautiful channels will be listed here!")}
            actions={
              <div className="section__actions">
                <Button button="primary" label={__('Create Channel')} navigate={`/$/${PAGES.CHANNEL_NEW}`} />
              </div>
            }
          />
        )}
      </Page>
    );
  }

  return (
    <Page className="channelsPage-wrapper">
      <div className="card-stack">
        {hasYoutubeChannels && (
          <React.Suspense fallback={null}>
            <YoutubeTransferStatus hideChannelLink />
          </React.Suspense>
        )}

        <ClaimList
          header={
            <h1 className="page__title">
              <Icon icon={ICONS.CHANNEL} />
              <label>{__('Your channels')}</label>
            </h1>
          }
          headerAltControls={
            <>
              <Button
                button="secondary"
                label={__('Sync YouTube Channel')}
                icon={ICONS.YOUTUBE}
                navigate={`/$/${PAGES.YOUTUBE_SYNC}`}
              />
              <Button
                button="secondary"
                icon={ICONS.CHANNEL}
                label={__('New Channel')}
                navigate={`/$/${PAGES.CHANNEL_NEW}`}
              />
            </>
          }
          loading={fetchingChannels}
          uris={channelUrls}
          renderActions={(claim) => {
            const claimsInChannel = claim.meta.claims_in_channel;
            return claimsInChannel === 0 ? (
              <span />
            ) : (
              <div className="section__actions">
                <Button
                  button="alt"
                  icon={ICONS.ANALYTICS}
                  label={__('Analytics')}
                  onClick={() => {
                    doSetActiveChannel(claim.claim_id);
                    push(`/$/${PAGES.CREATOR_DASHBOARD}`);
                  }}
                />
              </div>
            );
          }}
          renderProperties={(claim) => {
            const claimsInChannel = claim.meta.claims_in_channel;
            if (!claim || claimsInChannel === 0) {
              return null;
            }
          }}
        />
      </div>
    </Page>
  );
}
