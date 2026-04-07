import React from 'react';
import * as ICONS from 'constants/icons';
import { SORT_ORDER, SORT_KEYS } from 'constants/collections';
import FileActionButton from 'component/common/file-action-button';
import { Menu, MenuButton, MenuList, MenuItem } from 'component/common/menu';
import { useAppDispatch } from 'redux/hooks';
import { doSortCollectionByKey } from 'redux/actions/collections';
type ButtonProps = {
  collectionId: string;
};

const SortButton = (props: ButtonProps) => {
  const { collectionId } = props;
  const dispatch = useAppDispatch();
  return (
    <div className="section__actions">
      <div className="sort-menu__button">
        <Menu>
          <MenuButton
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            <FileActionButton className="button-toggle" icon={ICONS.MENU} title={__('Sort')} label={__('Sort')} />
          </MenuButton>

          <MenuList className="menu__list">
            <MenuItem
              className="comment__menu-option"
              onSelect={() => {
                dispatch(doSortCollectionByKey(collectionId, SORT_KEYS.RELEASED_AT, SORT_ORDER.ASC));
              }}
            >
              <div className="menu__link">{__('Newest first')}</div>
            </MenuItem>
            <MenuItem
              className="comment__menu-option"
              onSelect={() => {
                dispatch(doSortCollectionByKey(collectionId, SORT_KEYS.RELEASED_AT, SORT_ORDER.DESC));
              }}
            >
              <div className="menu__link">{__('Oldest first')}</div>
            </MenuItem>
            <MenuItem
              className="comment__menu-option"
              onSelect={() => {
                dispatch(doSortCollectionByKey(collectionId, SORT_KEYS.NAME, SORT_ORDER.DESC));
              }}
            >
              <div className="menu__link">{__('A-Z')}</div>
            </MenuItem>
            <MenuItem
              className="comment__menu-option"
              onSelect={() => {
                dispatch(doSortCollectionByKey(collectionId, SORT_KEYS.NAME, SORT_ORDER.ASC));
              }}
            >
              <div className="menu__link">{__('Z-A')}</div>
            </MenuItem>
          </MenuList>
        </Menu>
      </div>
    </div>
  );
};

export default SortButton;
