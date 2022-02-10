// @flow
import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';
import React from 'react';
import classnames from 'classnames';
import { Menu, MenuButton, MenuList } from '@reach/menu-button';
import { MenuItem, MenuLink } from 'component/common/menu-components';
import Icon from 'component/common/icon';
import * as PAGES from 'constants/pages';
import { useHistory } from 'react-router';
import { formatLbryUrlForWeb, generateListSearchUrlParams } from 'util/url';

type Props = {
  inline?: boolean,
  doOpenModal: (string, {}) => void,
  collectionName?: string,
  collectionId: string,
  playNextUri: string,
  doToggleShuffleList: (string) => void,
};

function CollectionMenuList(props: Props) {
  const { inline = false, collectionId, collectionName, doOpenModal, playNextUri, doToggleShuffleList } = props;
  const [doShuffle, setDoShuffle] = React.useState(false);

  const { push } = useHistory();

  React.useEffect(() => {
    if (playNextUri && doShuffle) {
      setDoShuffle(false);
      const navigateUrl = formatLbryUrlForWeb(playNextUri);
      push({
        pathname: navigateUrl,
        search: generateListSearchUrlParams(collectionId),
        state: { forceAutoplay: true },
      });
    }
  }, [collectionId, doShuffle, playNextUri, push]);

  return (
    <Menu>
      <MenuButton
        className={classnames('menu__button', { 'claim__menu-button': !inline, 'claim__menu-button--inline': inline })}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        <Icon size={20} icon={ICONS.MORE_VERTICAL} />
      </MenuButton>
      <MenuList className="menu__list">
        {collectionId && collectionName && (
          <>
            <MenuLink page={`${PAGES.LIST}/${collectionId}`} icon={ICONS.VIEW} label={__('View List')} />

            <MenuItem
              onSelect={() => {
                doToggleShuffleList(collectionId);
                setDoShuffle(true);
              }}
              icon={ICONS.SHUFFLE}
              label={__('Shuffle Play')}
            />

            <MenuLink
              page={`${PAGES.LIST}/${collectionId}?view=edit`}
              icon={ICONS.PUBLISH}
              label={__('Publish List')}
            />

            <MenuItem
              onSelect={() => doOpenModal(MODALS.COLLECTION_DELETE, { collectionId })}
              icon={ICONS.DELETE}
              label={__('Delete List')}
            />
          </>
        )}
      </MenuList>
    </Menu>
  );
}

export default CollectionMenuList;
