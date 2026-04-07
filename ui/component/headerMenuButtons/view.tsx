import 'scss/component/_header.scss';
import { ENABLE_NO_SOURCE_CLAIMS } from 'config';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import * as PUBLISH_TYPES from 'constants/publish_types';
import Button from 'component/button';
import Icon from 'component/common/icon';
import React from 'react';
import Tooltip from 'component/common/tooltip';
import UploadManagerMenu from 'component/header/uploadManagerMenu';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectUserVerifiedEmail, selectUser } from 'redux/selectors/user';
import { selectActivePipelineItems, selectCurrentUploads } from 'redux/selectors/publish';
import { doBeginPublish as doBeginPublishAction } from 'redux/actions/publish';
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
  const hasUploadActivity = (pipelineItems as any[]).length > 0 || Object.keys(currentUploads || {}).length > 0;
  const uploadProps = {
    requiresAuth: !authenticated,
  };
  return authenticated ? (
    <div className="header__buttons">
      <UploadManagerMenu hasActivity={hasUploadActivity} onUploadClick={() => doBeginPublish(PUBLISH_TYPES.FILE)} />
      {livestreamEnabled && (
        <Tooltip title={__('Go live')}>
          <Button
            className="header__navigationItem--icon"
            {...uploadProps}
            onClick={() => doBeginPublish(PUBLISH_TYPES.LIVESTREAM)}
          >
            <Icon size={18} icon={ICONS.GOLIVE} aria-hidden />
          </Button>
        </Tooltip>
      )}
      <Tooltip title={__('Post an article')}>
        <Button className="header__navigationItem--icon" onClick={() => doBeginPublish(PUBLISH_TYPES.POST)}>
          <Icon size={18} icon={ICONS.POST} aria-hidden />
        </Button>
      </Tooltip>
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
