// @flow
import { formatLbryUrlForWeb, generateListSearchUrlParams } from 'util/url';
import { useHistory } from 'react-router';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import { MenuItem, MenuLink } from 'component/common/menu-components';
import React from 'react';

type Props = {
  collectionId: string,
  editedCollection: Collection,
  inline?: boolean,
  shuffleList?: any,
  toggleShuffle: () => void,
  openDeleteModal: () => void,
};

export default function CollectionMenuItems(props: Props) {
  const { collectionId, editedCollection, shuffleList, toggleShuffle, openDeleteModal } = props;

  const { push } = useHistory();

  const [doShuffle, setDoShuffle] = React.useState(false);

  const shuffle = shuffleList && shuffleList.collectionId === collectionId && shuffleList.newUrls;
  const playNextUri = shuffle && shuffle[0];

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
    collectionId && (
      <>
        <MenuLink page={`${PAGES.LIST}/${collectionId}`} icon={ICONS.VIEW} label={__('View List')} />

        <MenuItem
          onSelect={() => {
            toggleShuffle();
            setDoShuffle(true);
          }}
          icon={ICONS.SHUFFLE}
          label={__('Shuffle Play')}
        />

        <MenuLink
          page={`${PAGES.LIST}/${collectionId}?view=edit`}
          icon={ICONS.PUBLISH}
          label={editedCollection ? __('Publish') : __('Edit List')}
        />

        <MenuItem onSelect={openDeleteModal} icon={ICONS.DELETE} label={__('Delete List')} />
      </>
    )
  );
}
