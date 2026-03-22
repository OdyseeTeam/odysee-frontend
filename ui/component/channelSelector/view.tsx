import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import classnames from 'classnames';
import React from 'react';
import ChannelThumbnail from 'component/channelThumbnail';
import { Menu, MenuList, MenuButton, MenuItem } from 'component/common/menu';
import Icon from 'component/common/icon';
import { useLocation, useNavigate } from 'react-router-dom';
import IncognitoSelector from './internal/incognito-selector';
import LoadingSelector from './internal/loading-selector';
import ChannelListItem from './internal/channelListItem';
import { NavLink } from 'react-router-dom';
import { formatLbryUrlForWeb } from 'util/url';
import AllSelector from './internal/all-selector';
import { selectMyChannelClaimIds } from 'redux/selectors/claims';
import { selectActiveChannelClaim, selectIncognito } from 'redux/selectors/app';
import { doSetActiveChannel, doSetIncognito } from 'redux/actions/app';
import { doFetchOdyseeMembershipForChannelIds } from 'redux/actions/memberships';
import { doSetDefaultChannel } from 'redux/actions/settings';
import { selectDefaultChannelClaim } from 'redux/selectors/settings';
import { useAppSelector, useAppDispatch } from 'redux/hooks';

type Props = {
  selectedChannelUrl: string;
  onChannelSelect?: (id: string | null | undefined) => void;
  hideAnon?: boolean;
  storeSelection?: boolean;
  isHeaderMenu?: boolean;
  isPublishMenu?: boolean;
  isTabHeader?: boolean;
  autoSet?: boolean;
  channelToSet?: string;
  disabled?: boolean;
  allOptionProps?: {
    onSelectAll: () => void;
    isSelected: boolean;
  };
  hideCreateNew?: boolean;
};

function ChannelSelector(props: Props) {
  const {
    selectedChannelUrl,
    onChannelSelect,
    hideAnon,
    storeSelection,
    isHeaderMenu,
    isPublishMenu,
    isTabHeader,
    autoSet,
    channelToSet,
    disabled,
    allOptionProps,
    hideCreateNew,
  } = props;

  const dispatch = useAppDispatch();
  const channelIds = useAppSelector(selectMyChannelClaimIds);
  const activeChannelClaim = useAppSelector((state) => {
    const activeClaim = selectActiveChannelClaim(state);
    const defaultClaim = selectDefaultChannelClaim(state);
    return storeSelection ? defaultClaim : activeClaim;
  });
  const incognito = useAppSelector(selectIncognito);
  const showAllOption = Boolean(allOptionProps);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const activeChannelUrl = activeChannelClaim && activeChannelClaim.permanent_url;
  const activeChannelId = activeChannelClaim && activeChannelClaim.claim_id;
  const noActiveChannel = activeChannelUrl === null;
  const pendingChannelFetch = !noActiveChannel && channelIds === undefined;

  React.useEffect(() => {
    if (!autoSet) return;

    if (channelToSet) {
      dispatch(doSetActiveChannel(channelToSet));
      dispatch(doSetIncognito(false));
    } else if (!channelToSet) {
      dispatch(doSetIncognito(true));
    } // eslint-disable-next-line react-hooks/exhaustive-deps -- On mount if we get to autoSet a channel, set it.
  }, []);
  React.useEffect(() => {
    if (channelIds) {
      dispatch(doFetchOdyseeMembershipForChannelIds(channelIds));
    }
  }, [channelIds, dispatch]);
  return (
    <>
      <div
        className={classnames('channel-selector', {
          'channel-selector--publish': isPublishMenu,
          'channel-selector--tabHeader': isTabHeader,
          disabled: disabled,
        })}
      >
        <Menu>
          {isHeaderMenu && channelIds && channelIds.length > 1 ? (
            <>
              <MenuButton className="menu__link">
                <ChannelThumbnail uri={activeChannelUrl} hideStakedIndicator xxsmall noLazyLoad />
                {__('Change Default Channel')}
                <Icon icon={ICONS.DOWN} />
              </MenuButton>
            </>
          ) : (
            <MenuButton disabled={pendingChannelFetch}>
              {showAllOption && allOptionProps?.isSelected ? (
                <AllSelector isSelected />
              ) : pendingChannelFetch ? (
                <LoadingSelector isSelected />
              ) : (incognito && !hideAnon) || !activeChannelUrl ? (
                <IncognitoSelector isSelected />
              ) : (
                <ChannelListItem channelId={activeChannelId} isSelected />
              )}
            </MenuButton>
          )}

          <MenuList className="menu__list channel-selector">
            {showAllOption && (
              <MenuItem onSelect={allOptionProps?.onSelectAll}>
                <AllSelector />
              </MenuItem>
            )}

            {channelIds &&
              channelIds.map((channelId) => (
                <MenuItem
                  key={channelId}
                  onSelect={() => {
                    dispatch(doSetIncognito(false));
                    dispatch(doSetActiveChannel(channelId));

                    if (storeSelection) {
                      dispatch(doSetDefaultChannel(channelId));
                    }

                    if (onChannelSelect) {
                      onChannelSelect(channelId);
                    }
                  }}
                >
                  <ChannelListItem channelId={channelId} />
                </MenuItem>
              ))}

            {!hideAnon && (
              <MenuItem
                onSelect={() => {
                  dispatch(doSetIncognito(true));

                  if (onChannelSelect) {
                    onChannelSelect(null);
                  }
                }}
              >
                <IncognitoSelector />
              </MenuItem>
            )}
            {!hideCreateNew && (
              <MenuItem onSelect={() => navigate(`/$/${PAGES.CHANNEL_NEW}?redirect=${pathname}`)}>
                <div className="channel-selector__item">
                  <Icon sectionIcon icon={ICONS.CHANNEL} />
                  <div className="channel-selector__text">{__('Create a new channel')}</div>
                </div>
              </MenuItem>
            )}
          </MenuList>
        </Menu>
      </div>
      {isHeaderMenu && activeChannelUrl && (
        <NavLink to={formatLbryUrlForWeb(activeChannelUrl)}>
          <div className="header__navigationItem--channel">
            <span>↳</span>
            {__('My Channel Page')}
          </div>
        </NavLink>
      )}
    </>
  );
}

export default ChannelSelector;
