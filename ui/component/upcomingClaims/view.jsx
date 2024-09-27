// @flow
import React from 'react';
import classnames from 'classnames';
import ClaimList from 'component/claimList';
import Icon from 'component/common/icon';
import ClaimPreviewTile from 'component/claimPreviewTile';
import * as ICONS from 'constants/icons';
import { useIsMobile, useIsMediumScreen, useIsLargeScreen } from 'effects/use-screensize';
import Button from 'component/button';
import * as SETTINGS from 'constants/settings';

// ****************************************************************************
// ****************************************************************************

export type Props = {|
  name: string, // unique instance name
  channelIds: Array<string>,
  tileLayout: boolean,
  liveUris?: ?Array<string>, // ones that have gone live (not upcoming anymore)
  limitClaimsPerChannel?: number,
  loading?: boolean,
  isChannelPage?: boolean,
  onLoad?: (number) => void,
  showHideSetting?: boolean,
|};

type StateProps = {|
  livestreamUris: ?Array<string>,
  scheduledUris: ?Array<string>,
  livestreamOptions: ?ClaimSearchOptions,
  scheduledOptions: ?ClaimSearchOptions,
  hideUpcoming?: boolean,
|};

type DispatchProps = {|
  doClaimSearch: (ClaimSearchOptions) => void,
  setClientSetting: (string, boolean | string | number, boolean) => void,
|};

// ****************************************************************************
// UpcomingClaims
// ****************************************************************************

const UpcomingClaims = (props: Props & StateProps & DispatchProps) => {
  const {
    tileLayout,
    liveUris = [],
    loading,
    isChannelPage,
    livestreamOptions,
    scheduledOptions,
    livestreamUris,
    scheduledUris,
    doClaimSearch,
    setClientSetting,
    showHideSetting = true,
    hideUpcoming,
  } = props;

  const isMobileScreen = useIsMobile();
  const isMediumScreen = useIsMediumScreen();
  const isLargeScreen = useIsLargeScreen();
  const [showAllUpcoming, setShowAllUpcoming] = React.useState(false);

  const upcomingMax = React.useMemo(() => {
    let multiply = 1;
    if (showAllUpcoming) multiply = 2;
    if (isLargeScreen) return 6 * multiply;
    if (isMobileScreen || isMediumScreen) return 3 * multiply;
    return 4 * multiply;
  }, [showAllUpcoming, isMobileScreen, isMediumScreen, isLargeScreen]);

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
          {new Array(upcomingMax).fill(1).map((x, i) => (
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
              if (isMobileScreen) window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
              setShowAllUpcoming(false);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default UpcomingClaims;
