// @flow
// $FlowFixMe
import { Global } from '@emotion/react';

import { Menu, MenuButton, MenuList } from '@reach/menu-button';
import { MenuItem } from 'component/common/menu-components';
import { useHistory } from 'react-router-dom';
import usePersistedState from 'effects/use-persisted-state';
import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';
import React from 'react';

type Props = {
  isPopoutWindow?: boolean,
  superchatsHidden?: boolean,
  noSuperchats?: boolean,
  isMobile?: boolean,
  hideChat?: () => void,
  setPopoutWindow?: (any) => void,
  toggleSuperchats?: () => void,
};

export default function LivestreamMenu(props: Props) {
  const {
    isPopoutWindow,
    superchatsHidden,
    noSuperchats,
    isMobile,
    hideChat,
    setPopoutWindow,
    toggleSuperchats,
  } = props;

  const {
    location: { pathname },
  } = useHistory();

  const [showTimestamps, setShowTimestamps] = usePersistedState('live-timestamps', false);

  function handlePopout() {
    if (setPopoutWindow) {
      const newWindow = window.open('/$/popout' + pathname, 'Popout Chat', 'height=700,width=400');

      // Add function to newWindow when closed (either manually or from button component)
      newWindow.onbeforeunload = () => setPopoutWindow(undefined);

      if (window.focus) newWindow.focus();
      setPopoutWindow(newWindow);
    }
  }

  return (
    <>
      <MenuGlobalStyles showTimestamps={showTimestamps} />

      <Menu>
        <MenuButton className="menu__button">
          <Icon size={isMobile ? 16 : 18} icon={ICONS.SETTINGS} />
        </MenuButton>

        <MenuList className="menu__list">
          <MenuItem
            onSelect={() => setShowTimestamps(!showTimestamps)}
            icon={ICONS.TIME}
            label={__('Toggle Timestamps')}
          />

          {!isMobile ? (
            <>
              {/* No need for Hide Chat on mobile with the expand/collapse drawer */}
              {hideChat && <MenuItem onSelect={hideChat} icon={ICONS.EYE} label={__('Hide Chat')} />}

              {!isPopoutWindow && <MenuItem onSelect={handlePopout} icon={ICONS.EXTERNAL} label={__('Popout Chat')} />}
            </>
          ) : (
            !noSuperchats &&
            toggleSuperchats && (
              <MenuItem
                onSelect={toggleSuperchats}
                icon={superchatsHidden ? ICONS.EYE : ICONS.DISMISS_ALL}
                label={superchatsHidden ? __('Display Superchats') : __('Dismiss Superchats')}
              />
            )
          )}
        </MenuList>
      </Menu>
    </>
  );
}

type GlobalStylesProps = {
  showTimestamps?: boolean,
};

const MenuGlobalStyles = (globalStylesProps: GlobalStylesProps) => {
  const { showTimestamps } = globalStylesProps;

  return (
    <Global
      styles={{
        ':root': {
          '--live-timestamp-opacity': showTimestamps ? '0.5' : '0',
        },
      }}
    />
  );
};
