import React from 'react';
import Nag from 'component/nag';
import I18nMessage from 'component/i18nMessage';
import * as PAGES from 'constants/pages';
import { useNavigate } from 'react-router-dom';
import Button from '../../ui/component/button';
type Props = {
  email?: User;
  onClose: () => void;
};
export default function NagSunset(props: Props) {
  const { email, onClose } = props;
  const navigate = useNavigate();

  const handleOnClick = () => {
    onClose();
    navigate(`/$/${PAGES.AUTH_SIGNIN}`);
  };

  return (
    <Nag
      type="helpful"
      message={
        <I18nMessage
          tokens={{
            more: <Button button={'link'} label={__('Learn more')} href="https://odysee.com/@lbry:3f/retirement" />,
          }}
        >
          lbry.tv has been retired. You have been magically transported to Odysee.com. %more%
        </I18nMessage>
      }
      actionText={__('Sign In')}
      onClick={!email ? handleOnClick : undefined}
      onClose={onClose}
    />
  );
}
