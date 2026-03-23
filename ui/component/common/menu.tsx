import MUIRawMenu from '@mui/material/Menu';
import classnames from 'classnames';
import React from 'react';

type MenuContextValue = {
  anchorEl: HTMLElement | null;
  open: boolean;
  setAnchorEl: (element: HTMLElement | null) => void;
  closeMenu: () => void;
};

const MenuContext = React.createContext<MenuContextValue | null>(null);

type MenuProps = {
  children: React.ReactNode;
};

function Menu(props: MenuProps) {
  const { children } = props;
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const value = React.useMemo(
    () => ({
      anchorEl,
      open: Boolean(anchorEl),
      setAnchorEl,
      closeMenu: () => setAnchorEl(null),
    }),
    [anchorEl]
  );

  return (
    <MenuContext.Provider value={value}>
      <div className="menu__wrapper">{children}</div>
    </MenuContext.Provider>
  );
}

type MenuButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const MenuButton = React.forwardRef<HTMLButtonElement, MenuButtonProps>((props, forwardedRef) => {
  const { children, onClick, type = 'button', ...buttonProps } = props;
  const menu = React.useContext(MenuContext);

  return (
    <button
      {...buttonProps}
      ref={forwardedRef}
      type={type}
      data-reach-menu-button=""
      aria-haspopup="menu"
      aria-expanded={menu?.open || false}
      onClick={(event) => {
        onClick?.(event);

        if (!menu) {
          return;
        }

        menu.setAnchorEl(menu.open ? null : (event.currentTarget as HTMLElement));
      }}
    >
      {children}
    </button>
  );
});

MenuButton.displayName = 'MenuButton';

type MenuListProps = {
  children: React.ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLUListElement>;
};

function flattenFragments(children: React.ReactNode): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === React.Fragment) {
      result.push(...flattenFragments(child.props.children));
    } else {
      result.push(child);
    }
  });
  return result;
}

function MenuList(props: MenuListProps) {
  const { children, className, onClick } = props;
  const menu = React.useContext(MenuContext);

  if (!menu) {
    return null;
  }

  return (
    <MUIRawMenu
      anchorEl={menu.anchorEl}
      open={menu.open}
      onClose={menu.closeMenu}
      disableScrollLock
      slotProps={{
        paper: {
          className,
          'data-reach-menu-popover': '',
        },
        list: {
          className,
          onClick,
          'data-reach-menu-list': '',
          'data-reach-menu-items': '',
          role: 'menu',
        },
      }}
    >
      {flattenFragments(children)}
    </MUIRawMenu>
  );
}

type MenuItemProps = {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  onSelect?: (event: React.SyntheticEvent) => void;
};

function MenuItem(props: MenuItemProps) {
  const { children, className, disabled, onClick, onSelect } = props;
  const menu = React.useContext(MenuContext);
  const [highlighted, setHighlighted] = React.useState(false);

  function handleActivate(event: React.SyntheticEvent) {
    if (disabled) {
      event.preventDefault();
      return;
    }

    onSelect?.(event);

    if (!event.defaultPrevented) {
      menu?.closeMenu();
    }
  }

  return (
    <div
      role="menuitem"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      className={classnames(className, {
        disabled,
      })}
      data-reach-menu-item=""
      {...(highlighted ? { 'data-selected': '' } : {})}
      onMouseEnter={() => setHighlighted(true)}
      onMouseLeave={() => setHighlighted(false)}
      onFocus={() => setHighlighted(true)}
      onBlur={() => setHighlighted(false)}
      onClick={(event) => {
        onClick?.(event);

        if (!event.defaultPrevented) {
          handleActivate(event);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleActivate(event);
        }
      }}
    >
      {children}
    </div>
  );
}

type MenuLinkProps = {
  as?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
  [key: string]: any;
};

function MenuLink(props: MenuLinkProps) {
  const { as: Component = 'a', children, className, onClick, ...rest } = props;
  const menu = React.useContext(MenuContext);

  return (
    <Component
      {...rest}
      role="menuitem"
      className={className}
      onClick={(event) => {
        onClick?.(event);

        if (!event.defaultPrevented) {
          menu?.closeMenu();
        }
      }}
    >
      {children}
    </Component>
  );
}

export { Menu, MenuButton, MenuList, MenuItem, MenuLink };
