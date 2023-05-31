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
  onLoad?: (number) => void,
  showHideSetting?: boolean,
  hideUpcoming?: boolean,
|};

type StateProps = {|
  livestreamUris: ?Array<string>,
  scheduledUris: ?Array<string>,
  livestreamOptions: ?ClaimSearchOptions,
  scheduledOptions: ?ClaimSearchOptions,
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
    return {
      uris: upcomingMax > 0 ? uris.slice(0, upcomingMax) : uris,
      total: uris.length,
    };
  }, [liveUris, livestreamUris, scheduledUris, upcomingMax]);

  const hideScheduled = (e) => {
    setClientSetting(SETTINGS.HIDE_SCHEDULED_LIVESTREAMS, e, true);
  };

  const Header = () => {
    return (
      <div className="claim-grid__header" onClick={() => hideScheduled(!hideUpcoming)}>
        <div className="button__content">
          <span className="icon__wrapper">
            <Icon icon={ICONS.TIME} />
          </span>
          <span className="claim-grid__title">{__('Upcoming')}</span>

          {showHideSetting && !hideUpcoming && (
            <div className="upcoming-grid__visibility" onClick={() => hideScheduled(true)}>
              <Icon icon={ICONS.EYE_OFF} />
              <span>{__('Hide')}</span>
            </div>
          )}
          {showHideSetting && hideUpcoming && list.total > 0 && (
            <div className="upcoming-grid__visibility" onClick={() => hideScheduled(false)}>
              <Icon icon={ICONS.EYE} />
              {list.total > 0 ? <span>{__('Show')}</span> : <span>{__('Empty')}</span>}
              <div className="upcoming-grid__counter">{list.total}</div>
            </div>
          )}
          {showHideSetting && hideUpcoming && list.total === 0 && (
            <div className="upcoming-grid__visibility--empty">
              <Icon icon={ICONS.EYE} />
              <span>{__('Empty')}</span>
              <div className="upcoming-grid__counter">{list.total}</div>
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

  return (
    <div
      className={classnames('mb-m mt-m md:mb-xl', {
        'upcoming-grid': showHideSetting && tileLayout,
        'upcoming-list': !showHideSetting || !tileLayout,
        'upcoming-grid--extended': showAllUpcoming,
        'upcoming-grid--closed': hideUpcoming && showHideSetting,
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
      {list.total > upcomingMax && !showAllUpcoming && (
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
      {showAllUpcoming && (
        <div className="upcoming-list__view-more">
          <Button
            label={__('Show less upcoming content')}
            button="link"
            iconRight={ICONS.ARROW_RIGHT}
            className="claim-grid__title--secondary"
            onClick={() => setShowAllUpcoming(false)}
          />
        </div>
      )}
    </div>
  );
};

export default UpcomingClaims;
