import React from 'react';
import moment from 'moment';
import classnames from 'classnames';
import ClaimList from 'component/claimList';
import Icon from 'component/common/icon';
import ClaimPreviewTile from 'component/claimPreviewTile';
import * as ICONS from 'constants/icons';
import { useIsMobile, useIsSmallScreen, useIsLargeScreen } from 'effects/use-screensize';
import Button from 'component/button';
import * as SETTINGS from 'constants/settings';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { createSelector } from 'reselect';
import { selectMutedAndBlockedChannelIds } from 'redux/selectors/blocked';
import { selectClaimSearchByQuery } from 'redux/selectors/claims';
import { selectClientSetting } from 'redux/selectors/settings';
import { doClaimSearch as doClaimSearchAction } from 'redux/actions/claims';
import { doSetClientSetting } from 'redux/actions/settings';
import { LIVESTREAM_UPCOMING_BUFFER } from 'constants/livestream';
import { SCHEDULED_TAGS } from 'constants/tags';
import { createNormalizedClaimSearchKey } from 'util/claim';
import { CsOptHelper } from 'util/claim-search';
import { objSelectorEqualityCheck } from 'util/redux-utils';

const selectOptions = createSelector(
  (state: any) => state.comments.moderationBlockList,
  (state: any) => selectMutedAndBlockedChannelIds(state),
  (_state: any, _name: string, channelIds: Array<string>) => channelIds,
  (_state: any, _name: string, _channelIds: Array<string>, isLivestream: boolean) => isLivestream,
  (_state: any, _name: string, _channelIds: Array<string>, _isLivestream: boolean, limitPerChannel?: number) =>
    limitPerChannel,
  (
    blocked: any,
    mutedAndBlockedIds: any,
    channelIds: Array<string>,
    isLivestream: boolean,
    limitPerChannel?: number
  ) => {
    return {
      page: 1,
      page_size: 50,
      no_totals: true,
      claim_type: ['stream'],
      remove_duplicates: true,
      any_tags: isLivestream ? [SCHEDULED_TAGS.LIVE] : [SCHEDULED_TAGS.SHOW],
      channel_ids: channelIds || [],
      not_channel_ids: mutedAndBlockedIds,
      not_tags: CsOptHelper.not_tags(),
      order_by: ['^release_time'],
      release_time: [`>${moment().subtract(LIVESTREAM_UPCOMING_BUFFER, 'minutes').startOf('minute').unix()}`],
      ...(isLivestream ? { has_no_source: true } : { has_source: true }),
      ...(isLivestream && limitPerChannel ? { limit_claims_per_channel: limitPerChannel } : {}),
    };
  },
  {
    memoizeOptions: {
      maxSize: 10,
      resultEqualityCheck: objSelectorEqualityCheck,
    },
  }
);

// ****************************************************************************
// ****************************************************************************
export type Props = {
  name: string;
  // unique instance name
  channelIds: Array<string>;
  tileLayout: boolean;
  liveUris?: Array<string> | null | undefined;
  // ones that have gone live (not upcoming anymore)
  limitClaimsPerChannel?: number;
  loading?: boolean;
  isChannelPage?: boolean;
  onLoad?: (arg0: number) => void;
  showHideSetting?: boolean;
};

// ****************************************************************************
// UpcomingClaims
// ****************************************************************************
const UpcomingClaims = (props: Props) => {
  const {
    name,
    channelIds,
    tileLayout,
    liveUris = [],
    loading,
    isChannelPage,
    limitClaimsPerChannel,
    showHideSetting = true,
  } = props;
  const dispatch = useAppDispatch();
  const csByQuery = useAppSelector(selectClaimSearchByQuery) || {};
  const livestreamOptions = useAppSelector((state) =>
    selectOptions(state, name, channelIds, true, limitClaimsPerChannel)
  );
  const scheduledOptions = useAppSelector((state) => selectOptions(state, name, channelIds, false));
  const loKey = livestreamOptions ? createNormalizedClaimSearchKey(livestreamOptions) : '';
  const soKey = scheduledOptions ? createNormalizedClaimSearchKey(scheduledOptions) : '';
  const livestreamUris = csByQuery[loKey];
  const scheduledUris = csByQuery[soKey];
  const hideUpcoming = useAppSelector((state) => selectClientSetting(state, SETTINGS.HIDE_SCHEDULED_LIVESTREAMS));
  const doClaimSearch = (csOptions: ClaimSearchOptions) => dispatch(doClaimSearchAction(csOptions));
  const setClientSetting = (key: string, value: boolean | string | number, pushPrefs: boolean) =>
    dispatch(doSetClientSetting(key, value, pushPrefs));
  const isMobileScreen = useIsMobile();
  const isSmallScreen = useIsSmallScreen();
  const isLargeScreen = useIsLargeScreen();
  const [showAllUpcoming, setShowAllUpcoming] = React.useState(false);
  const upcomingMax = React.useMemo(() => {
    let multiply = 1;
    if (showAllUpcoming) multiply = 2;
    if (isLargeScreen) return 6 * multiply;
    if (isMobileScreen || isSmallScreen) return 3 * multiply;
    return 4 * multiply;
  }, [showAllUpcoming, isMobileScreen, isSmallScreen, isLargeScreen]);
  const list = React.useMemo(() => {
    let uris = (livestreamUris || []).concat(scheduledUris || []);

    if (liveUris) {
      uris = uris.filter((x) => !liveUris.includes(x));
    }

    if (uris.length > 12) uris = uris.slice(0, 12);
    return {
      uris: upcomingMax > 0 ? uris.slice(0, upcomingMax) : uris,
      total: uris.length,
    };
  }, [liveUris, livestreamUris, scheduledUris, upcomingMax]);

  const hideScheduled = (e) => {
    setClientSetting(SETTINGS.HIDE_SCHEDULED_LIVESTREAMS, e, true);
  };

  const Header = () => {
    if (list.total === 0) return null;
    return (
      <div
        className="claim-grid__header"
        onClick={() => {
          showHideSetting && hideScheduled(!hideUpcoming);
        }}
      >
        <div className="button__content">
          <span className="icon__wrapper">
            <Icon icon={ICONS.TIME} />
          </span>
          <span className="claim-grid__title">{__('Upcoming')}</span>

          {showHideSetting && (
            <div className="upcoming-grid__visibility" onClick={() => hideScheduled(!hideUpcoming)}>
              <Icon icon={hideUpcoming ? ICONS.EYE : ICONS.EYE_OFF} />
              <span>{hideUpcoming ? __('Show') : __('Hide')}</span>
              <div className="upcoming-grid__counter">
                {Math.min(list.total, showAllUpcoming ? upcomingMax : upcomingMax * 2)}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  React.useEffect(() => {
    if (livestreamOptions) {
      doClaimSearch(livestreamOptions);
    }
  }, [doClaimSearch, livestreamOptions]);
  React.useEffect(() => {
    if (scheduledOptions) {
      doClaimSearch(scheduledOptions);
    }
  }, [doClaimSearch, scheduledOptions]);
  if (isChannelPage && list.total === 0) return null;
  return (
    <div
      className={classnames('md:mb-xl', {
        'upcoming-grid': showHideSetting && tileLayout,
        'upcoming-list': !showHideSetting || !tileLayout,
        'upcoming-grid--extended': showAllUpcoming,
        'upcoming-grid--closed':
          (hideUpcoming && showHideSetting) ||
          (showHideSetting && list.total === 0 && !loading) ||
          (!showHideSetting && list.total === 0 && !loading),
      })}
    >
      <Header />
      {loading && (
        <section className="claim-grid">
          {Array.from({ length: upcomingMax }, (_, i) => (
            <ClaimPreviewTile key={i} placeholder="loading" pulse />
          ))}
        </section>
      )}

      {!loading && list.total > 0 && <ClaimList uris={list.uris} tileLayout={tileLayout} showNoSourceClaims />}
      {list.total > upcomingMax && !showAllUpcoming && !isChannelPage && !hideUpcoming && (
        <div className="upcoming-list__view-more">
          <Button
            label={__('Show more upcoming content')}
            button="link"
            iconRight={ICONS.ARROW_RIGHT}
            className="claim-grid__title--secondary"
            onClick={() => setShowAllUpcoming(true)}
          />
        </div>
      )}

      {showAllUpcoming && !hideUpcoming && (
        <div className="upcoming-list__view-more">
          <Button
            label={__('Show less upcoming content')}
            button="link"
            iconRight={ICONS.ARROW_RIGHT}
            className="claim-grid__title--secondary"
            onClick={() => {
              if (isMobileScreen)
                window.scrollTo({
                  top: 0,
                  left: 0,
                  behavior: 'smooth',
                });
              setShowAllUpcoming(false);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default UpcomingClaims;
