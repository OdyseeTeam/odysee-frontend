import 'scss/component/_header.scss';
import { ENABLE_NO_SOURCE_CLAIMS } from 'config';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import * as PUBLISH_TYPES from 'constants/publish_types';
import classnames from 'classnames';
import Button from 'component/button';
import Icon from 'component/common/icon';
import React from 'react';
import Tooltip from 'component/common/tooltip';
import UploadManagerMenu from 'component/header/uploadManagerMenu';
import { Menu, MenuButton, MenuList, MenuItem } from 'component/common/menu';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectUserVerifiedEmail, selectUser } from 'redux/selectors/user';
import { selectActivePipelineItems, selectCurrentUploads } from 'redux/selectors/publish';
import { doBeginPublish as doBeginPublishAction } from 'redux/actions/publish';
import { useLivestreamPublish } from 'contexts/livestreamPublish';
type HeaderMenuButtonProps = {
  authRedirect?: string;
};

export default function HeaderMenuButtons(props: HeaderMenuButtonProps) {
  const { authRedirect } = props;
  const dispatch = useAppDispatch();
  const authenticated = useAppSelector(selectUserVerifiedEmail);
  const user = useAppSelector(selectUser);
  const doBeginPublish = (type: PublishType) => dispatch(doBeginPublishAction(type));
  const livestreamEnabled = Boolean(ENABLE_NO_SOURCE_CLAIMS && user && !user.odysee_live_disabled);
  const authRedirectParam = authRedirect ? `?redirect=${authRedirect}` : '';
  const pipelineItems = useAppSelector(selectActivePipelineItems);
  const currentUploads = useAppSelector(selectCurrentUploads);
  const hasUploadActivity =
    (pipelineItems as any[]).some((item: any) => item.stage !== 'error') ||
    Object.keys(currentUploads || {}).length > 0;

  const ctx = useLivestreamPublish();
  const isLive = ctx.state.status === 'live' || ctx.state.status === 'connecting';

  return authenticated ? (
    <div className="header__buttons">
      {hasUploadActivity && (
        <UploadManagerMenu hasActivity={hasUploadActivity} onUploadClick={() => doBeginPublish(PUBLISH_TYPES.FILE)} />
      )}
      <Menu>
        <Tooltip title={__('Create')}>
          <MenuButton
            className={classnames('button header__navigationItem--icon', {
              'header__livestream-btn--live': isLive,
            })}
          >
            <Icon size={18} icon={ICONS.ADD} aria-hidden />
          </MenuButton>
        </Tooltip>
        <MenuList className="menu__list">
          <MenuItem className="comment__menu-option" onSelect={() => doBeginPublish(PUBLISH_TYPES.FILE)}>
            <div className="menu__link">
              <Icon aria-hidden icon={ICONS.PUBLISH} />
              {__('Upload a video')}
            </div>
          </MenuItem>
          {livestreamEnabled && (
            <MenuItem className="comment__menu-option" onSelect={() => doBeginPublish(PUBLISH_TYPES.LIVESTREAM)}>
              <div className="menu__link">
                <Icon aria-hidden icon={isLive ? ICONS.GOLIVE : ICONS.VIDEO} />
                {isLive ? __('Livestream settings') : __('Start a livestream')}
              </div>
            </MenuItem>
          )}
          <MenuItem className="comment__menu-option" onSelect={() => doBeginPublish(PUBLISH_TYPES.POST)}>
            <div className="menu__link">
              <Icon aria-hidden icon={ICONS.POST} />
              {__('Post an article')}
            </div>
          </MenuItem>
        </MenuList>
      </Menu>
    </div>
  ) : (
    <>
      <Tooltip title={__('Upload')}>
        <Button className="header__navigationItem--icon" navigate={`/$/${PAGES.AUTH}${authRedirectParam}`}>
          <Icon size={18} icon={ICONS.PUBLISH} aria-hidden />
        </Button>
      </Tooltip>
      <Tooltip title={__('Settings')}>
        <Button className="header__navigationItem--icon" navigate={`/$/${PAGES.SETTINGS}`}>
          <Icon size={18} icon={ICONS.SETTINGS} aria-hidden />
        </Button>
      </Tooltip>
      <Tooltip title={__('Help')}>
        <Button className="header__navigationItem--icon" navigate={`/$/${PAGES.HELP}`}>
          <Icon size={18} icon={ICONS.HELP} aria-hidden />
        </Button>
      </Tooltip>
    </>
  );
}
