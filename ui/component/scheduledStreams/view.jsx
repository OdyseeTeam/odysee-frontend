// @flow
import React from 'react';
import ClaimList from 'component/claimList';
import Icon from 'component/common/icon';
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
  onLoad?: (number) => void,
  showHideSetting?: boolean,
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
  doShowSnackBar: (string) => void,
|};

// ****************************************************************************
// ScheduledStreams
// ****************************************************************************

const ScheduledStreams = (props: Props & StateProps & DispatchProps) => {
  const {
    tileLayout,
    liveUris = [],
    livestreamOptions,
    scheduledOptions,
    livestreamUris,
    scheduledUris,
    doClaimSearch,
    setClientSetting,
    doShowSnackBar,
    showHideSetting = true,
  } = props;

  const isMobileScreen = useIsMobile();
  const isLargeScreen = useIsLargeScreen();
  const [showAllUpcoming, setShowAllUpcoming] = React.useState(false);
  const useSwipeLayout = isMobileScreen;

  const upcomingMax = React.useMemo(() => {
    if (showAllUpcoming || useSwipeLayout) return -1;
    if (isLargeScreen) return 6;
    if (isMobileScreen) return 3;
    return 4;
  }, [showAllUpcoming, isMobileScreen, isLargeScreen, useSwipeLayout]);

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

  const hideScheduledStreams = () => {
    setClientSetting(SETTINGS.HIDE_SCHEDULED_LIVESTREAMS, true, true);
    doShowSnackBar(__('Scheduled streams hidden, you can re-enable them in settings.'));
  };

  const Header = () => {
    return (
      <div className="claim-grid__header">
        <div className="button__content">
          <span className="icon__wrapper">
            <Icon icon={ICONS.VIDEO} />
          </span>
          <span className="claim-grid__title">{__('Upcoming')}</span>
          {showHideSetting && (
            <Button button="link" label={__('Hide')} onClick={hideScheduledStreams} className={'hide-livestreams'} />
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
    <div className={'mb-m mt-m md:mb-xl upcoming-livestreams'} style={{ display: list.total > 0 ? 'block' : 'none' }}>
      <Header />
      <ClaimList uris={list.uris} tileLayout={tileLayout} showNoSourceClaims />
      {list.total > upcomingMax && !showAllUpcoming && !useSwipeLayout && (
        <div className="livestream-list--view-more">
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
        <div className="livestream-list--view-more">
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

export default ScheduledStreams;
