import React from 'react';
import Section from 'component/channelSections/Section';
import Page from 'component/page';
import Spinner from 'component/spinner';
import Yrbl from 'component/yrbl';
import { useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { CHANNEL_SECTIONS_QUERIES as CSQ } from 'constants/urlParams';
import { doFetchCreatorSettings as doFetchCreatorSettingsAction } from 'redux/actions/comments';
import {
  selectFeaturedChannelsForChannelId,
  selectFetchingCreatorSettings,
  selectSettingsForChannelId,
} from 'redux/selectors/comments';

function FeaturedChannelsPage() {
  const dispatch = useAppDispatch();
  const { search } = useLocation();
  const urlParams = new URLSearchParams(search);
  const claimId = urlParams.get(CSQ.CLAIM_ID);
  const sectionId = urlParams.get(CSQ.SECTION_ID);
  const creatorSettingsFetched = useAppSelector((state) => selectSettingsForChannelId(state, claimId) !== undefined);
  const fetchingCreatorSettings = useAppSelector(selectFetchingCreatorSettings);
  const featuredChannels = useAppSelector((state) => selectFeaturedChannelsForChannelId(state, claimId));
  const fc: FeaturedChannelsSection | null | undefined = React.useMemo(() => {
    return featuredChannels && featuredChannels.find((x) => x.id === sectionId);
  }, [featuredChannels, sectionId]);
  React.useEffect(() => {
    if (!creatorSettingsFetched && claimId) {
      dispatch(doFetchCreatorSettingsAction(claimId)).catch(() => {});
    }
  }, [claimId, creatorSettingsFetched, dispatch]);

  // **************************************************************************
  // **************************************************************************
  if (!fc) {
    return (
      <Page>
        <div className="main--empty">
          <Yrbl title={__('List Not Found')} />
        </div>
      </Page>
    );
  }

  if (fetchingCreatorSettings) {
    return (
      <Page>
        <div className="main--empty">
          <Spinner />
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <Section key={fc.id} id={fc.id} title={fc.value.title} uris={fc.value.uris} channelId={claimId} />
    </Page>
  );
}

export default FeaturedChannelsPage;
