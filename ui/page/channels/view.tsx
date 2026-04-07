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
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectMyChannelClaimUrls, selectMyChannelClaimIds, selectFetchingMyChannels } from 'redux/selectors/claims';
import { selectHasYoutubeChannels } from 'redux/selectors/user';
import { doFetchOdyseeMembershipForChannelIds } from 'redux/actions/memberships';
import { doFetchChannelListMine } from 'redux/actions/claims';
import { doSetActiveChannel } from 'redux/actions/app';

const YoutubeTransferStatus = lazyImport(
  () =>
    import(
      'component/youtubeTransferStatus'
      /* webpackChunkName: "youtubeTransferStatus" */
    )
);

export default function ChannelsPage() {
  const dispatch = useAppDispatch();
  const channelUrls = useAppSelector(selectMyChannelClaimUrls);
  const channelIds = useAppSelector(selectMyChannelClaimIds);
  const fetchingChannels = useAppSelector(selectFetchingMyChannels);
  const hasYoutubeChannels = useAppSelector(selectHasYoutubeChannels);

  const hasChannels = Number.isInteger(channelIds?.length);
  React.useEffect(() => {
    if (channelIds) {
      dispatch(doFetchOdyseeMembershipForChannelIds(channelIds));
    } else {
      dispatch(doFetchChannelListMine());
    }
  }, [channelIds, dispatch]);
  const navigate = useNavigate();

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
                    dispatch(doSetActiveChannel(claim.claim_id));
                    navigate(`/$/${PAGES.CREATOR_DASHBOARD}`);
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
