import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';
import React from 'react';
import classnames from 'classnames';
import { Menu, MenuButton, MenuList, MenuItem } from 'component/common/menu';
import Icon from 'component/common/icon';
import * as PAGES from 'constants/pages';
import { useNavigate } from 'react-router-dom';
import { COLLECTION_PAGE as CP } from 'constants/urlParams';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import {
  selectCollectionTitleForId,
  selectIsCollectionBuiltInForId,
  selectPublishedCollectionNotEditedForId,
  selectCollectionIsEmptyForId,
  selectCollectionIsMine,
  selectCollectionAutoPublishForId,
  selectCollectionHasEditsForId,
  selectCollectionPublishErrorForId,
} from 'redux/selectors/collections';
import { selectClaimForClaimId } from 'redux/selectors/claims';
import { doOpenModal } from 'redux/actions/app';
import { doEnableCollectionShuffle } from 'redux/actions/content';
import { doSetCollectionAutoPublish, doRetryCollectionPublish } from 'redux/actions/collections';

type Props = {
  inline?: boolean;
  collectionId: string;
};

function CollectionMenuList(props: Props) {
  const { inline = false, collectionId } = props;
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const collectionName = useAppSelector((state) => selectCollectionTitleForId(state, collectionId));
  const claimId = useAppSelector((state) => (selectClaimForClaimId(state, collectionId) || {}).claim_id);
  const isBuiltin = useAppSelector((state) => selectIsCollectionBuiltInForId(state, collectionId));
  const publishedNotEdited = useAppSelector((state) => selectPublishedCollectionNotEditedForId(state, collectionId));
  const collectionEmpty = useAppSelector((state) => selectCollectionIsEmptyForId(state, collectionId));
  const isMyCollection = useAppSelector((state) => selectCollectionIsMine(state, collectionId));
  const autoPublish = useAppSelector((state) => selectCollectionAutoPublishForId(state, collectionId));
  const collectionHasEdits = useAppSelector((state) => selectCollectionHasEditsForId(state, collectionId));
  const publishError = useAppSelector((state) => selectCollectionPublishErrorForId(state, collectionId));

  return (
    <Menu>
      <MenuButton
        className={classnames('menu__button', {
          'claim__menu-button': !inline,
          'claim__menu-button--inline': inline,
        })}
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
            <MenuItem
              className="comment__menu-option"
              onSelect={() => navigate(`/$/${PAGES.PLAYLIST}/${collectionId}`)}
            >
              <a className="menu__link" href={`/$/${PAGES.PLAYLIST}/${collectionId}`}>
                <Icon aria-hidden icon={ICONS.VIEW} />
                {__('Open')}
              </a>
            </MenuItem>
            {!collectionEmpty && (
              <MenuItem
                className="comment__menu-option"
                onSelect={() =>
                  dispatch(
                    doEnableCollectionShuffle({
                      collectionId,
                    })
                  )
                }
              >
                <div className="menu__link">
                  <Icon aria-hidden icon={ICONS.SHUFFLE} />
                  {__('Shuffle Play')}
                </div>
              </MenuItem>
            )}

            {!isBuiltin && isMyCollection && (
              <>
                {!collectionEmpty && (
                  <MenuItem
                    className="comment__menu-option"
                    onSelect={() =>
                      navigate(`/$/${PAGES.PLAYLIST}/${collectionId}?${CP.QUERIES.VIEW}=${CP.VIEWS.PUBLISH}`)
                    }
                  >
                    <div className="menu__link">
                      <Icon aria-hidden iconColor={'red'} icon={ICONS.PUBLISH} />
                      {publishedNotEdited ? __('Update') : __('Publish')}
                    </div>
                  </MenuItem>
                )}
                <MenuItem
                  className="comment__menu-option"
                  onSelect={() => navigate(`/$/${PAGES.PLAYLIST}/${collectionId}?${CP.QUERIES.VIEW}=${CP.VIEWS.EDIT}`)}
                >
                  <div className="menu__link">
                    <Icon aria-hidden icon={ICONS.EDIT} />
                    {__('Edit')}
                  </div>
                </MenuItem>
                {claimId && (
                  <MenuItem
                    className="comment__menu-option"
                    onSelect={() => dispatch(doSetCollectionAutoPublish(collectionId, !autoPublish))}
                  >
                    <div className="menu__link">
                      <Icon aria-hidden icon={ICONS.PUBLISH} />
                      {autoPublish ? __('Disable Auto-publish') : __('Enable Auto-publish')}
                    </div>
                  </MenuItem>
                )}
                {claimId && collectionHasEdits && publishError && (
                  <MenuItem
                    className="comment__menu-option"
                    onSelect={() => dispatch(doRetryCollectionPublish(collectionId))}
                  >
                    <div className="menu__link">
                      <Icon aria-hidden icon={ICONS.REFRESH} />
                      {__('Retry Publish Now')}
                    </div>
                  </MenuItem>
                )}
                <MenuItem
                  className="comment__menu-option"
                  onSelect={() =>
                    dispatch(
                      doOpenModal(MODALS.COLLECTION_DELETE, {
                        collectionId,
                      })
                    )
                  }
                >
                  <div className="menu__link">
                    <Icon aria-hidden icon={ICONS.DELETE} />
                    {__('Delete')}
                  </div>
                </MenuItem>
              </>
            )}
          </>
        )}
      </MenuList>
    </Menu>
  );
}

export default CollectionMenuList;
