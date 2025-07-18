// @flow
import 'scss/component/_header.scss';

import { formatCredits } from 'util/format-credits';
import { useIsMobile } from 'effects/use-screensize';
import { withRouter } from 'react-router';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
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

type Props = {
  authenticated: boolean,
  authHeader: boolean,
  authRedirect?: string, // Redirects to '/' by default.
  backout: {
    backLabel?: string,
    backNavDefault?: string,
    title: string,
    simpleTitle: string, // Just use the same value as `title` if `title` is already short (~< 10 chars), unless you have a better idea for title overlfow on mobile
  },
  balance: number,
  emailToVerify?: string,
  hasNavigated: boolean,
  hideBalance: boolean,
  hideCancel: boolean,
  history: {
    goBack: () => void,
    location: { pathname: string, search: string },
    push: (string) => void,
    replace: (string) => void,
  },
  isAbsoluteSideNavHidden: boolean,
  sidebarOpen: boolean,
  syncError: ?string,
  totalBalance?: number,
  user: ?User,
  prefsReady: boolean,
  arweaveAccounts: any,
  doClearClaimSearch: () => void,
  doRemoveFromUnsavedChangesCollectionsForCollectionId: (collectionId: string) => void,
  clearEmailEntry: () => void,
  clearPasswordEntry: () => void,
  openChangelog: ({}) => void,
  setSidebarOpen: (boolean) => void,
  signOut: () => void,
};

const Header = (props: Props) => {
  const {
    authenticated,
    authHeader,
    authRedirect,
    backout,
    balance,
    emailToVerify,
    hasNavigated,
    hideBalance,
    hideCancel,
    history,
    isAbsoluteSideNavHidden,
    sidebarOpen,
    syncError,
    totalBalance,
    user,
    prefsReady,
    arweaveAccounts,
    doClearClaimSearch,
    doRemoveFromUnsavedChangesCollectionsForCollectionId,
    clearEmailEntry,
    clearPasswordEntry,
    openChangelog,
    setSidebarOpen,
    signOut,
  } = props;

  const {
    location: { pathname, search },
    goBack,
    push,
  } = history;

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

  // For pages that allow for "backing out", shows a backout option instead of the Home logo
  const canBackout = Boolean(backout);
  const { backLabel, backNavDefault, title: backTitle, simpleTitle: simpleBackTitle } = backout || {};

  const balanceLoading = totalBalance === undefined;
  const roundedSpendableBalance = formatCredits(balance, 2, true);
  const roundedTotalBalance = formatCredits(totalBalance, 2, true);

  // Sign out if they click the "x" when they are on the password prompt
  const authHeaderAction = syncError && { onClick: signOut };
  const homeButtonNavigationProps = (isVerifyPage && {}) || (authHeader && authHeaderAction) || { navigate: '/' };
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
          push(returnPath);
        } else if (hasNavigated && !backNavDefault) {
          // if not initiated by pop (back button)
          goBack();
        } else {
          push(backNavDefault || `/`);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- @see TODO_NEED_VERIFICATION
    [backNavDefault, goBack, hasNavigated, push, returnPath]
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
                      ? __('Immediately spendable: %spendable_balance%', { spendable_balance: roundedSpendableBalance })
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
    <header className={classnames('header', { 'header--minimal': authHeader })}>
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

              {!authHeader && (
                <span style={{ position: 'relative' }}>
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
                  if (pathname === '/') {
                    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                    doClearClaimSearch();
                  }
                }}
                {...homeButtonNavigationProps}
              >
                <Logo />
              </Button>

              {/* @if process.env.DEV_CHANGELOG */}
              {history.location.pathname === '/' && (
                <Button
                  title="Changelog"
                  className="badge--alert"
                  label="Changelog"
                  icon={ICONS.FEEDBACK}
                  onClick={() =>
                    openChangelog({
                      title: __('Changelog'),
                      subtitle: __('Warning: this is a test instance.'),
                      body: <p style={{ whiteSpace: 'pre-wrap' }}>{process.env.DEV_CHANGELOG}</p>,
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
              ? userButtons(isMobile)
              : !isVerifyPage &&
                !hideCancel && (
                  <div className="header__menu--right">
                    <Button
                      title={__('Go Back')}
                      button="alt"
                      // className="button--header-close"
                      icon={ICONS.REMOVE}
                      onClick={() => {
                        if (!iYTSyncPage && !isPwdResetPage) {
                          clearEmailEntry();
                          clearPasswordEntry();
                        }

                        if (syncError) signOut();

                        if ((isSignInPage && !emailToVerify) || isSignUpPage || isPwdResetPage || iYTSyncPage) {
                          goBack();
                        } else {
                          push('/');
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

export default withRouter(Header);
