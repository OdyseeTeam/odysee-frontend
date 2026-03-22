import * as MODALS from 'constants/modal_types';
import * as ICONS from 'constants/icons';
import * as DAEMON_SETTINGS from 'constants/daemon_settings';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Lbry from 'lbry';
import Button from 'component/button';
import ModalWalletUnlock from 'modal/modalWalletUnlock';
import ModalIncompatibleDaemon from 'modal/modalIncompatibleDaemon';
import ModalUpgrade from 'modal/modalUpgrade';
import ModalDownloading from 'modal/modalDownloading';
import Card from 'component/common/card';
import I18nMessage from 'component/i18nMessage';
import 'css-doodle';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectDaemonVersionMatched, selectModal, selectSplashAnimationEnabled } from 'redux/selectors/app';
import { doCheckDaemonVersion, doOpenModal, doHideModal, doToggleSplashAnimation } from 'redux/actions/app';
import { doClearDaemonSetting } from 'redux/actions/settings';
import { doToast } from 'redux/actions/notifications';

const FORTY_FIVE_SECONDS = 45 * 1000;
const UPDATE_INTERVAL = 1000; // 1 second
const MAX_WALLET_WAIT = 20; // 20 seconds for wallet to be started, but servers to be unavailable
const MAX_SYNC_WAIT = 45; // 45 seconds to sync wallet, show message if taking long

type Props = {
  onReadyToLaunch: () => void;
};

export default function SplashScreen({ onReadyToLaunch }: Props) {
  const dispatch = useAppDispatch();

  const modal = useAppSelector((state) => selectModal(state));
  const daemonVersionMatched = useAppSelector((state) => selectDaemonVersionMatched(state));
  const animationHidden = useAppSelector((state) => selectSplashAnimationEnabled(state));

  const [details, setDetails] = useState<string | React.ReactNode>(__('Starting...'));
  const [error, setError] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [launchedModal, setLaunchedModal] = useState(false);
  const [launchWithIncompatibleDaemon, setLaunchWithIncompatibleDaemon] = useState(
    !process.env.NODE_ENV === 'production'
  );
  const [waitingForWallet, setWaitingForWallet] = useState(0);
  const [waitingForSync, setWaitingForSync] = useState(0);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Use refs to access latest state in async callbacks without adding them as deps
  const isRunningRef = useRef(isRunning);
  const launchedModalRef = useRef(launchedModal);
  const waitingForWalletRef = useRef(waitingForWallet);
  const waitingForSyncRef = useRef(waitingForSync);
  const launchWithIncompatibleDaemonRef = useRef(launchWithIncompatibleDaemon);
  const daemonVersionMatchedRef = useRef(daemonVersionMatched);
  const modalRef = useRef(modal);

  isRunningRef.current = isRunning;
  launchedModalRef.current = launchedModal;
  waitingForWalletRef.current = waitingForWallet;
  waitingForSyncRef.current = waitingForSync;
  launchWithIncompatibleDaemonRef.current = launchWithIncompatibleDaemon;
  daemonVersionMatchedRef.current = daemonVersionMatched;
  modalRef.current = modal;

  const checkDaemonVersion = useCallback(() => dispatch(doCheckDaemonVersion()), [dispatch]);
  const notifyUnlockWallet = useCallback(
    (shouldTryWithBlankPassword?: boolean | null) =>
      dispatch(doOpenModal(MODALS.WALLET_UNLOCK, { shouldTryWithBlankPassword })),
    [dispatch]
  );
  const hideModal = useCallback(() => dispatch(doHideModal()), [dispatch]);
  const toggleSplashAnimation = useCallback(() => dispatch(doToggleSplashAnimation()), [dispatch]);
  const clearWalletServers = useCallback(
    () => dispatch(doClearDaemonSetting(DAEMON_SETTINGS.LBRYUM_SERVERS)),
    [dispatch]
  );
  const doShowSnackBar = useCallback((message: string) => dispatch(doToast({ isError: true, message })), [dispatch]);

  const adjustErrorTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setError(true);
    }, FORTY_FIVE_SECONDS);
  }, []);

  const continueAppLaunch = useCallback(() => {
    if (daemonVersionMatchedRef.current) {
      onReadyToLaunch();
    } else if (launchWithIncompatibleDaemonRef.current && isRunningRef.current) {
      onReadyToLaunch();
    }
  }, [onReadyToLaunch]);

  const updateStatusCallback = useCallback(
    (status: StatusResponse, walletStatus: WalletStatusResponse, waitingForUnlock: boolean = false) => {
      const { wallet, startup_status: startupStatus } = status;

      if (startupStatus && wallet && wallet.available_servers < 1) {
        setWaitingForWallet((prev) => prev + UPDATE_INTERVAL / 1000);
      } else if (status.is_running && !waitingForUnlock) {
        Lbry.resolve({ urls: 'lbry://one' }).then(() => {
          setIsRunning(true);
          // We need continueAppLaunch to run after isRunning is set,
          // but since setState is async we rely on effect below.
        });
        return;
      } else if (wallet && !status.is_running && walletStatus.is_syncing) {
        setWaitingForSync((prev) => prev + UPDATE_INTERVAL / 1000);

        if (waitingForSyncRef.current < MAX_SYNC_WAIT) {
          setDetails(__('Updating wallet data...'));
        } else {
          setDetails(
            <React.Fragment>
              <div>{__('Large account history')}</div>
              <div>{__('Please wait...')}</div>
            </React.Fragment>
          );
        }
      } else if (wallet && !status.is_running && startupStatus.database) {
        setDetails(__('Almost ready...'));
      }

      setTimeout(() => {
        updateStatus();
      }, UPDATE_INTERVAL);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- updateStatus is defined below and uses refs
    []
  );

  const updateStatus = useCallback(() => {
    Lbry.status().then((status) => {
      const sdkStatus = status;
      const { wallet } = status;
      Lbry.wallet_status().then((walletStatus) => {
        if (sdkStatus.is_running && wallet && wallet.available_servers) {
          if (walletStatus.is_locked) {
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }

            updateStatusCallback(sdkStatus, walletStatus, true);

            if (!launchedModalRef.current && !modalRef.current) {
              setLaunchedModal(true);
              notifyUnlockWallet();
            }
          } else {
            updateStatusCallback(sdkStatus, walletStatus);
          }
        } else if (!sdkStatus.is_running && walletStatus.is_syncing) {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          updateStatusCallback(sdkStatus, walletStatus);
        } else if (waitingForWalletRef.current > MAX_WALLET_WAIT && !launchedModalRef.current && !modalRef.current) {
          clearWalletServers();
          doShowSnackBar(
            __(
              'The wallet server took a bit too long. Resetting defaults just in case. Shutdown (Cmd/Ctrl+Q) LBRY and restart if this continues.'
            )
          );
          setWaitingForWallet(0);
          updateStatusCallback(sdkStatus, walletStatus);
        } else {
          updateStatusCallback(sdkStatus, walletStatus);
        }
      });
    });
  }, [updateStatusCallback, notifyUnlockWallet, clearWalletServers, doShowSnackBar]);

  // continueAppLaunch when isRunning changes to true
  useEffect(() => {
    if (isRunning) {
      continueAppLaunch();
    }
  }, [isRunning, continueAppLaunch]);

  // continueAppLaunch when launchWithIncompatibleDaemon changes
  useEffect(() => {
    if (launchWithIncompatibleDaemon && isRunningRef.current) {
      continueAppLaunch();
    }
  }, [launchWithIncompatibleDaemon, continueAppLaunch]);

  // adjustErrorTimeout on every render (mirrors componentDidMount + componentDidUpdate)
  useEffect(() => {
    adjustErrorTimeout();
  });

  // componentDidMount: connect and start status loop
  useEffect(() => {
    Lbry.connect()
      .then(checkDaemonVersion)
      .then(() => {
        updateStatus();
      })
      .catch(() => {
        setDetails(
          __(
            'Try closing all LBRY processes and starting again. If this still happens, your anti-virus software or firewall may be preventing LBRY from connecting. Contact hello@lbry.com if you think this is a software bug.'
          )
        );
      });

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run on mount
  }, []);

  const runWithIncompatibleDaemon = useCallback(() => {
    hideModal();
    setLaunchWithIncompatibleDaemon(true);
  }, [hideModal]);

  const renderModals = () => {
    const modalId = modal && modal.id;
    if (!modalId) return null;

    switch (modalId) {
      case MODALS.INCOMPATIBLE_DAEMON:
        return <ModalIncompatibleDaemon onContinueAnyway={runWithIncompatibleDaemon} />;
      case MODALS.WALLET_UNLOCK:
        return <ModalWalletUnlock />;
      case MODALS.UPGRADE:
        return <ModalUpgrade />;
      case MODALS.DOWNLOADING:
        return <ModalDownloading />;
      default:
        return null;
    }
  };

  return (
    <div className="splash">
      <h1 className="splash__title">LBRY</h1>
      <div className="splash__details">{details}</div>

      {!animationHidden && !error && (
        <css-doodle class="doodle">
          {`
            --color: @p(var(--color-primary), var(--color-secondary), var(--color-focus), var(--color-nothing));
            :doodle {
              @grid: 30x1 / 18vmin;
              --deg: @p(-180deg, 180deg);
            }
            :container {
              perspective: 30vmin;
            }

            @place-cell: center;
            @size: 100%;

            box-shadow: @m2(0 0 50px var(--color));
            will-change: transform, opacity;
            animation: scale-up 12s linear infinite;
            animation-delay: calc(-12s / @size() * @i());

            @keyframes scale-up {
              0%, 95.01%, 100% {
                transform: translateZ(0) rotate(0);
                opacity: 0;
              }
              10% {
                opacity: 1;
              }
              95% {
                transform:
                  translateZ(35vmin) rotateZ(@var(--deg));
              }
            }
          )
          `}
        </css-doodle>
      )}
      {!error && (
        <Button
          className="splash__animation-toggle"
          label={!animationHidden ? __('I feel woosy! Stop spinning!') : __('Spin Spin Sugar')}
          onClick={() => toggleSplashAnimation()}
        />
      )}
      {error && (
        <Card
          title={__('Error starting up')}
          subtitle={
            <React.Fragment>
              <p>
                {__(
                  'You can try refreshing to fix it. If you still have issues, your anti-virus software or firewall may be preventing startup.'
                )}
              </p>
              <p>
                <I18nMessage
                  tokens={{
                    help_link: (
                      <Button
                        button="link"
                        href="https://lbry.com/faq/startup-troubleshooting"
                        label={__('this link')}
                      />
                    ),
                  }}
                >
                  Reach out to hello@lbry.com for help, or check out %help_link%.
                </I18nMessage>
              </p>
            </React.Fragment>
          }
          actions={
            <Button
              button="primary"
              icon={ICONS.REFRESH}
              label={__('Refresh')}
              onClick={() => window.location.reload()}
            />
          }
        />
      )}
      {/* Temp hack: don't show any modals on splash screen daemon is running;
           daemon doesn't let you quit during startup, so the "Quit" buttons
         in the modals won't work. */}
      {renderModals()}
    </div>
  );
}
