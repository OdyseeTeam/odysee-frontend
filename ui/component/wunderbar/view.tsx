import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';
import React from 'react';
import { lazyImport } from 'util/lazyImport';
import { getModalUrlParam } from 'util/url';
import { useIsMobile } from 'effects/use-screensize';
import { useAppDispatch } from 'redux/hooks';
import { doOpenModal } from 'redux/actions/app';
import { useLocation, useNavigate } from 'react-router-dom';

const Button: any = lazyImport(
  () =>
    import(
      'component/button'
      /* webpackChunkName: "button" */
    )
);
const Icon = lazyImport(
  () =>
    import(
      'component/common/icon'
      /* webpackChunkName: "icon" */
    )
);
const WunderbarSuggestions = lazyImport(
  () =>
    import(
      'component/wunderbarSuggestions'
      /* webpackChunkName: "wb" */
    )
);
type Props = {
  channelsOnly?: boolean;
  noTopSuggestion?: boolean;
  noBottomLinks?: boolean;
  customSelectAction?: (arg0: string) => void;
};
export default function WunderBar(props: Props) {
  const { channelsOnly, noTopSuggestion, noBottomLinks, customSelectAction } = props;
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const doOpenMobileSearch = React.useCallback(
    (searchProps: Props) => {
      dispatch(doOpenModal(MODALS.MOBILE_SEARCH, searchProps));

      if (searchProps.customSelectAction) {
        return;
      }

      const urlSafeSearchProps = {
        ...(searchProps.channelsOnly ? { channelsOnly: true } : {}),
        ...(searchProps.noTopSuggestion ? { noTopSuggestion: true } : {}),
        ...(searchProps.noBottomLinks ? { noBottomLinks: true } : {}),
      };
      const searchParams = getModalUrlParam(MODALS.MOBILE_SEARCH, urlSafeSearchProps);
      navigate({
        pathname: location.pathname,
        search: `?${searchParams}`,
        hash: location.hash,
      });
    },
    [dispatch, location.hash, location.pathname, navigate]
  );
  const isMobile = useIsMobile();
  return isMobile ? (
    <React.Suspense fallback={null}>
      <Button
        icon={ICONS.SEARCH}
        className="wunderbar__mobile-search"
        aria-label={__('Search')}
        title={__('Search')}
        onClick={() => doOpenMobileSearch({ ...props })}
      />
    </React.Suspense>
  ) : (
    <React.Suspense
      fallback={
        <div className="wunderbar__wrapper wunderbar wunderbar__input" aria-disabled>
          <Icon icon={ICONS.SEARCH} aria-disabled />
        </div>
      }
    >
      <WunderbarSuggestions
        channelsOnly={channelsOnly}
        noTopSuggestion={noTopSuggestion}
        noBottomLinks={noBottomLinks}
        customSelectAction={customSelectAction}
      />
    </React.Suspense>
  );
}
