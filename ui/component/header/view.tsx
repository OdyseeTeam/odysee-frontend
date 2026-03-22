import 'scss/component/_header.scss';
import { formatCredits } from 'util/format-credits';
import { useIsMobile } from 'effects/use-screensize';
import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';
import * as PAGES from 'constants/pages';
import * as SETTINGS from 'constants/settings';
import Button from 'component/button';
import classnames from 'classnames';
import HeaderMenuButtons from 'component/headerMenuButtons';
import HeaderProfileMenuButton from 'component/headerProfileMenuButton';
import Logo from 'component/logo';
import NotificationBubble from 'component/notificationBubble';
import React from 'react';
import Skeleton from '@mui/material/Skeleton';
import SkipNavigationButton from 'component/skipNavigationButton';
import Tooltip from 'component/common/tooltip';
import WunderBar from 'component/wunderbar';
import WanderButton from '../wanderButton';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { doClearEmailEntry, doClearPasswordEntry } from 'redux/actions/user';
import { doSignOut, doOpenModal } from 'redux/actions/app';
import { doClearClaimSearch as doClearClaimSearchAction } from 'redux/actions/claims';
import { doRemoveFromUnsavedChangesCollectionsForCollectionId as doRemoveUnsavedAction } from 'redux/actions/collections';
import { selectClientSetting } from 'redux/selectors/settings';
import { selectGetSyncErrorMessage, selectPrefsReady } from 'redux/selectors/sync';
import { selectHasNavigated } from 'redux/selectors/app';
import { selectTotalBalance, selectBalance } from 'redux/selectors/wallet';
import { selectUserVerifiedEmail, selectEmailToVerify, selectUser } from 'redux/selectors/user';
import { selectAPIArweaveActiveAccounts } from 'redux/selectors/stripe';
import { selectIsPlayerFloating } from 'redux/selectors/content';
type Props = {
  authHeader: boolean;
  authRedirect?: string;
  // Redirects to '/' by default.
  backout: {
    backLabel?: string;
    backNavDefault?: string;
    title: string;
    simpleTitle: string; // Just use the same value as `title` if `title` is already short (~< 10 chars), unless you have a better idea for title overlfow on mobile
  };
  hideCancel: boolean;
  isAbsoluteSideNavHidden: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (arg0: boolean) => void;
  hideSidebarToggle?: boolean;
};

const Header = (props: Props) => {
  const { authHeader, authRedirect, backout, hideCancel, isAbsoluteSideNavHidden, sidebarOpen, setSidebarOpen } = props;
  const dispatch = useAppDispatch();
  const authenticated = useAppSelector(selectUserVerifiedEmail);
  const balance = useAppSelector(selectBalance);
  const emailToVerify = useAppSelector(selectEmailToVerify);
  const hasNavigated = useAppSelector(selectHasNavigated);
  const hideBalance = useAppSelector((state) => selectClientSetting(state, SETTINGS.HIDE_BALANCE));
  const totalBalance = useAppSelector(selectTotalBalance);
  const syncError = useAppSelector(selectGetSyncErrorMessage);
  const user = useAppSelector(selectUser);
  const prefsReady = useAppSelector(selectPrefsReady);
  const arweaveAccounts = useAppSelector(selectAPIArweaveActiveAccounts);
  const isFloatingPlayerOpen = useAppSelector(selectIsPlayerFloating);
  const doClearClaimSearch = () => dispatch(doClearClaimSearchAction());
  const doRemoveFromUnsavedChangesCollectionsForCollectionId = (collectionId: string) =>
    dispatch(doRemoveUnsavedAction(collectionId));
  const clearEmailEntry = () => dispatch(doClearEmailEntry());
  const clearPasswordEntry = () => dispatch(doClearPasswordEntry());
  const signOut = () => dispatch(doSignOut());
  const openChangelog = (modalProps: {}) => dispatch(doOpenModal(MODALS.CONFIRM, modalProps));
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  // on the verify page don't let anyone escape other than by closing the tab to keep session data consistent
  const isVerifyPage = pathname.includes(PAGES.AUTH_VERIFY);
  const isSignUpPage = pathname.includes(PAGES.AUTH);
  const isSignInPage = pathname.includes(PAGES.AUTH_SIGNIN);
  const isPwdResetPage = pathname.includes(PAGES.AUTH_PASSWORD_RESET);
  const iYTSyncPage = pathname.includes(PAGES.YOUTUBE_SYNC);
  const isPlaylistPage = pathname.includes(PAGES.PLAYLIST);
  const urlParams = new URLSearchParams(search);
  const returnPath = urlParams.get('redirect');
  const isYoutubeAuthErrorPage =
    iYTSyncPage && (urlParams.get('error') === 'true' || Boolean(urlParams.get('error_message')));
  // For pages that allow for "backing out", shows a backout option instead of the Home logo
  const canBackout = Boolean(backout);
  const { backLabel, backNavDefault, title: backTitle, simpleTitle: simpleBackTitle } = backout || {};
  const hideWallet = isMobile && isFloatingPlayerOpen;
  const balanceLoading = totalBalance === undefined;
  const roundedSpendableBalance = formatCredits(balance, 2, true);
  const roundedTotalBalance = formatCredits(totalBalance, 2, true);
  // Sign out if they click the "x" when they are on the password prompt
  const authHeaderAction = syncError && {
    onClick: signOut,
  };
  const isEmbedPath = pathname && pathname.startsWith('/$/embed');
  const homeButtonNavigationProps = (isVerifyPage && {}) ||
    (authHeader && authHeaderAction) || {
      navigate: isEmbedPath ? '/$/embed/home' : '/',
    };
  const sidebarLabel = sidebarOpen
    ? __('Close sidebar - hide channels you are following.')
    : __('Expand sidebar - view channels you are following.');
  const authRedirectParam = authRedirect ? `?redirect=${authRedirect}` : '';

  function handleCollectionEditPageCleanUp() {
    const collectionId = pathname.split('/').pop();
    doRemoveFromUnsavedChangesCollectionsForCollectionId(collectionId);
  }

  const onBackout = React.useCallback(
    (e: any) => {
      window.removeEventListener('popstate', onBackout);

      if (isPlaylistPage) {
        handleCollectionEditPageCleanUp();
      }

      if (e.type !== 'popstate') {
        if (returnPath) {
          navigate(returnPath);
        } else if (hasNavigated && !backNavDefault) {
          // if not initiated by pop (back button)
          navigate(-1);
        } else {
          navigate(backNavDefault || `/`);
        }
      }
    }, // eslint-disable-next-line react-hooks/exhaustive-deps -- @see TODO_NEED_VERIFICATION
    [backNavDefault, hasNavigated, navigate, returnPath]
  );
  React.useEffect(() => {
    if (canBackout) {
      window.addEventListener('popstate', onBackout);
      return () => window.removeEventListener('popstate', onBackout);
    }
  }, [canBackout, onBackout]);

  const userButtons = (hideWallet?: boolean, hideProfile?: boolean) => (
    <div className="header__menu--right">
      {isMobile && !authHeader && !canBackout && <WunderBar />}

      {authenticated ? (
        <>
          {!hideWallet && (
            <>
              {arweaveAccounts.length > 0 ? (
                <WanderButton hideBalance={hideBalance} />
              ) : (
                <Tooltip
                  title={
                    balance > 0
                      ? __('Immediately spendable: %spendable_balance%', {
                          spendable_balance: roundedSpendableBalance,
                        })
                      : __('Your Wallet')
                  }
                >
                  <div>
                    {balanceLoading ? (
                      <Skeleton variant="text" animation="wave" className="header__navigationItem--balanceLoading" />
                    ) : (
                      <Button
                        navigate={`/$/${PAGES.WALLET}`}
                        className={classnames('button--file-action header__navigationItem--balance', {
                          'header__navigationItem--balance-round':
                            hideBalance || Number(roundedTotalBalance) === 0 || !prefsReady,
                        })}
                        label={
                          hideBalance || Number(roundedTotalBalance) === 0 || !prefsReady
                            ? __(isMobile ? 'Wallet' : 'Your Wallet')
                            : roundedTotalBalance
                        }
                        icon={ICONS.LBC}
                      />
                    )}
                  </div>
                </Tooltip>
              )}
            </>
          )}

          {!hideProfile && <HeaderProfileMenuButton />}
        </>
      ) : !isMobile ? (
        <>
          <HeaderProfileMenuButton />
          <div className="header__authButtons">
            <Button
              navigate={`/$/${PAGES.AUTH_SIGNIN}${authRedirectParam}`}
              button="link"
              label={__('Log In')}
              disabled={user === null}
            />
            <Button
              navigate={`/$/${PAGES.AUTH}${authRedirectParam}`}
              button="primary"
              label={__('Sign Up')}
              disabled={user === null}
            />
          </div>
        </>
      ) : (
        <HeaderProfileMenuButton />
      )}
    </div>
  );

  return (
    <header
      className={classnames('header', {
        'header--minimal': authHeader,
      })}
    >
      {!authHeader && canBackout ? (
        <div className="card__actions--between header__contents">
          <div className="header__menu--left">
            <Button onClick={onBackout} button="link" label={backLabel || __('Cancel')} icon={ICONS.ARROW_LEFT} />
          </div>

          {backTitle && <h1 className="header__authTitle">{(isMobile && simpleBackTitle) || backTitle}</h1>}

          {userButtons(false, isMobile)}
        </div>
      ) : (
        <>
          <div className="header__navigation">
            <div className="header__menu--left">
              <SkipNavigationButton />

              {!authHeader && !props.hideSidebarToggle && (
                <span
                  style={{
                    position: 'relative',
                  }}
                >
                  <Button
                    aria-label={sidebarLabel}
                    id="navigation-button"
                    className="header__navigationItem--icon button-rotate"
                    icon={ICONS.MENU}
                    aria-expanded={sidebarOpen}
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                  />
                  {isAbsoluteSideNavHidden && isMobile && <NotificationBubble />}
                </span>
              )}

              <Button
                aria-label={__('Home')}
                className="header__navigationItem--logo"
                onClick={() => {
                  if (pathname === '/' || pathname === '/$/embed/home') {
                    window.scrollTo({
                      top: 0,
                      left: 0,
                      behavior: 'smooth',
                    });
                    doClearClaimSearch();
                  }
                }}
                {...homeButtonNavigationProps}
              >
                <Logo />
              </Button>

              {/* @if process.env.DEV_CHANGELOG */}
              {pathname === '/' && (
                <Button
                  title="Changelog"
                  className="badge--alert"
                  label="Changelog"
                  icon={ICONS.FEEDBACK}
                  onClick={() =>
                    openChangelog({
                      title: __('Changelog'),
                      subtitle: __('Warning: this is a test instance.'),
                      body: (
                        <p
                          style={{
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {process.env.DEV_CHANGELOG}
                        </p>
                      ),
                      onConfirm: (closeModal) => closeModal(),
                      hideCancel: true,
                    })
                  }
                />
              )}
              {/* @endif */}
            </div>

            {!authHeader && !isMobile && (
              <div className="header__center">
                <WunderBar />
                <HeaderMenuButtons authRedirect={authRedirect} />
              </div>
            )}

            {!authHeader && !canBackout
              ? userButtons(hideWallet, false)
              : !isVerifyPage &&
                !hideCancel && (
                  <div className="header__menu--right">
                    <Button
                      title={__('Go Back')}
                      button="alt" // className="button--header-close"
                      icon={ICONS.REMOVE}
                      onClick={() => {
                        if (isYoutubeAuthErrorPage) {
                          navigate(`/$/${PAGES.YOUTUBE_SYNC}?reset_scroll=youtube`);
                          return;
                        }

                        if (!iYTSyncPage && !isPwdResetPage) {
                          clearEmailEntry();
                          clearPasswordEntry();
                        }

                        if (syncError) signOut();

                        if ((isSignInPage && !emailToVerify) || isSignUpPage || isPwdResetPage || iYTSyncPage) {
                          navigate(-1);
                        } else {
                          navigate('/');
                        }
                      }}
                    />
                  </div>
                )}
          </div>
        </>
      )}
    </header>
  );
};

export default Header;
