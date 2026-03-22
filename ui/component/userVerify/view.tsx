import { SITE_NAME } from 'config';
import * as MODALS from 'constants/modal_types';
import * as ICONS from 'constants/icons';
import React, { useState, useEffect, useCallback, Fragment } from 'react';
import Button from 'component/button';
import Card from 'component/common/card';
import I18nMessage from 'component/i18nMessage';
import LbcSymbol from 'component/common/lbc-symbol';
import { Navigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { doOpenModal } from 'redux/actions/app';
import { doUserIdentityVerify, doUserFetch } from 'redux/actions/user';
import { makeSelectRewardByType } from 'redux/selectors/rewards';
import rewards from 'rewards';
import { selectUser, selectIdentityVerifyIsPending, selectIdentityVerifyErrorMessage } from 'redux/selectors/user';

type Props = {
  skipLink?: string;
  onSkip: () => void;
};

const UserVerify = React.memo(function UserVerify({ onSkip }: Props) {
  const dispatch = useAppDispatch();

  const user = useAppSelector((state) => selectUser(state));
  const is_reward_approved = user?.is_reward_approved;

  const fetchUser = useCallback(() => dispatch(doUserFetch()), [dispatch]);

  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (is_reward_approved) {
      setShouldRedirect(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run on mount
  }, []);

  const skipButtonProps = { onClick: onSkip };

  if (shouldRedirect) {
    return <Navigate replace to="/$/rewards" />;
  }

  return (
    <div className="main__auth-content">
      <section className="section__header">
        <h1 className="section__title--large">
          {''}
          <I18nMessage
            tokens={{
              lbc: <LbcSymbol size={48} />,
            }}
          >
            Verify to get %lbc%
          </I18nMessage>
        </h1>
        <p>
          <I18nMessage
            tokens={{
              Refresh: <Button onClick={() => fetchUser()} button="link" label={__('Refresh')} />,
              Skip: <Button {...skipButtonProps} button="link" label={__('Skip')} />,
              SITE_NAME,
            }}
          >
            Verified accounts are eligible to receive Credits for using %SITE_NAME%. Verifying also helps us keep the
            %SITE_NAME% community safe! %Skip%.
          </I18nMessage>
        </p>
        <p className="help">
          {__('This step is not mandatory and not required in order for you to use %SITE_NAME%.', {
            SITE_NAME,
          })}
        </p>
      </section>

      <div className="section">
        {/*
          <Card
           icon={ICONS.WALLET}
           title={__('Verify via credit card')}
           subtitle={__('Your card information will not be stored or charged, now or in the future.')}
           actions={
             <Fragment>
               {errorMessage && <p className="error__text">{errorMessage}</p>}
               <CardVerify
                 label={__('Verify Card')}
                 disabled={isPending}
                 token={onToken}
                 stripeKey={Lbryio.getStripeToken()}
               />
               <p className="help">{__('A $1 authorization may temporarily appear with your provider.')}</p>
             </Fragment>
           }
          />
          <div className="section__divider">
           <hr />
           <p>{__('OR')}</p>
          </div>
          */}

        <Card
          icon={ICONS.HELP}
          title={__('Verify via email')}
          subtitle={
            <>
              <p>{__('You can request verification of your Odysee account by sending an email to help@odysee.com')}</p>
              <p>{__('Verification requests can take a few hours to be approved.')}</p>
            </>
          }
        />

        {/*
          <div className="section__divider">
           <hr />
           <p>{__('OR')}</p>
          </div>
          <Card
           icon={ICONS.PHONE}
           title={__('Verify phone number')}
           // subtitle={__('You will receive an SMS text message confirming your phone number is valid. May not be available in all regions.')}
           subtitle={__('Service currently unavailable')}
           className="disabled"
           actions={
             <Fragment>
               <Button
                 onClick={() => {
                   verifyPhone();
                 }}
                 button="primary"
                 label={__('Verify Via Text')}
               />
               <p className="help">
                 {__('Standard messaging rates apply. Having trouble?')}{' '}
                 <Button
                   button="link"
                   href="https://help.odysee.tv/category-monetization/category-rewards/"
                   label={__('Read more')}
                 />
                 .
               </p>
             </Fragment>
           }
          />
          */}

        <div className="section__divider">
          <hr />
          <p>{__('OR')}</p>
        </div>

        <Card
          icon={ICONS.REMOVE}
          title={__('Skip')}
          subtitle={__(
            "Verifying is optional. If you skip this, it just means you can't receive Credits from our system."
          )}
          actions={
            <Fragment>
              <Button {...skipButtonProps} button="primary" label={__('Continue Without Verifying')} />
            </Fragment>
          }
        />
      </div>
    </div>
  );
});

export default UserVerify;
