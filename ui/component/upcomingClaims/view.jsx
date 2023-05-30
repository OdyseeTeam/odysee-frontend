// @flow
import React from 'react';
import classnames from 'classnames';
import ClaimList from 'component/claimList';
import Icon from 'component/common/icon';
import ClaimPreviewTile from 'component/claimPreviewTile';
import * as ICONS from 'constants/icons';
import { useIsLargeScreen, useIsMobile } from 'effects/use-screensize';
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
  // doShowSnackBar: (string) => void,
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
    // doShowSnackBar,
    showHideSetting = true,
    hideUpcoming,
  } = props;

  const isMobileScreen = useIsMobile();
  const isLargeScreen = useIsLargeScreen();
  const [showAllUpcoming, setShowAllUpcoming] = React.useState(false);

  const upcomingMax = React.useMemo(() => {
    if (showAllUpcoming) return -1;
    if (isLargeScreen) return 6;
    if (isMobileScreen) return 3;
    return 4;
  }, [showAllUpcoming, isMobileScreen, isLargeScreen]);

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
    // doShowSnackBar(__('Scheduled streams hidden, you can re-enable them in settings.'));
  };

  const Header = () => {
    return (
      <div className="claim-grid__header">
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
        'upcoming-grid': showHideSetting,
        'upcoming-list': !showHideSetting,
        'upcoming-grid--closed': hideUpcoming,
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

      {!loading && list.total > 0 && (
        <ClaimList uris={list.uris} loading={loading} tileLayout={tileLayout} showNoSourceClaims />
      )}
      {list.total > upcomingMax && !showAllUpcoming && (
        <div className="upcoming-list__view-more">
          <Button
            label={__('Show more upcoming content')}
            button="link"
            iconRight={ICONS.ARROW_RIGHT}
            className="claim-grid__title--secondary"
            onClick={() => {
              setShowAllUpcoming(true);
            }}
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
            onClick={() => {
              window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
              setShowAllUpcoming(false);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default UpcomingClaims;
