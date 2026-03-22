import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';
import React from 'react';
import { lazyImport } from 'util/lazyImport';
import { useIsMobile } from 'effects/use-screensize';
import { useAppDispatch } from 'redux/hooks';
import { doOpenModal } from 'redux/actions/app';

const Button = lazyImport(
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
  const doOpenMobileSearch = (searchProps: any) => dispatch(doOpenModal(MODALS.MOBILE_SEARCH, searchProps));
  const isMobile = useIsMobile();
  return isMobile ? (
    <React.Suspense fallback={null}>
      <Button
        icon={ICONS.SEARCH}
        className="wunderbar__mobile-search"
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
