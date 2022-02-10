// @flow
import React from 'react';
import { MenuItem as ReachMenuItem, MenuLink as ReachMenuLink } from '@reach/menu-button';
import Icon from 'component/common/icon';
import { Link } from 'react-router-dom';

type ItemProps = {
  icon?: string,
  label: string | any,
  help?: string | any,
  onSelect: (any) => any,
};

export const MenuItem = (props: ItemProps) => {
  const { icon, label, help, onSelect } = props;

  return (
    <ReachMenuItem onSelect={onSelect}>
      <div className="menu__item">
        {icon && <Icon aria-hidden icon={icon} />}
        {label}
      </div>

      {help && <span className="menu__item-help">{help}</span>}
    </ReachMenuItem>
  );
};

type LinkProps = {
  icon: string,
  label: string,
  page: string,
};

export const MenuLink = (props: LinkProps) => {
  const { icon, label, page } = props;

  return (
    <ReachMenuLink className="menu__item" as={Link} to={`/$/${page}`} onClick={(e) => e.stopPropagation()}>
      <Icon aria-hidden icon={icon} />
      {label}
    </ReachMenuLink>
  );
};
