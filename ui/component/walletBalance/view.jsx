// @flow
import React from 'react';
import { useIsMobile } from 'effects/use-screensize';
import * as SETTINGS from 'constants/settings';
import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';
import * as PAGES from 'constants/pages';
import CreditAmount from 'component/common/credit-amount';
import Button from 'component/button';
import HelpLink from 'component/common/help-link';
import Card from 'component/common/card';
import Symbol from 'component/common/symbol';
import LbcSymbol from 'component/common/lbc-symbol';
import I18nMessage from 'component/i18nMessage';
import { LocalStorage } from 'util/storage';
import { formatCredits } from 'util/format-credits';
import { useArStatus } from 'effects/use-ar-status';

type Props = {
  clientSettings: any,
  LBCBalance: number,
  arStatus: any,
  arBalance: number,
  arUsdRate: number,
  wanderAuth: any,
  totalBalance: number,
  claimsBalance: number,
  supportsBalance: number,
  tipsBalance: number,
  hasSynced: boolean,
  fetchingUtxoCounts: boolean,
  consolidatingUtxos: boolean,
  consolidateIsPending: boolean,
  massClaimingTips: boolean,
  massClaimIsPending: boolean,
  utxoCounts: { [string]: number },
  fullArweaveStatus: Array<any>,
  doOpenModal: (string) => void,
  doFetchUtxoCounts: () => void,
  doUtxoConsolidate: () => void,
  doArConnect: () => void,
  doArDisconnect: () => void,
  activeAPIArAccountAddress: string,
  activeAPIArAccount: any,
};

export const WALLET_CONSOLIDATE_UTXOS = 400;
const LARGE_WALLET_BALANCE = 100;

const WalletBalance = (props: Props) => {
  const {
    clientSettings,
    LBCBalance,
    wanderAuth,
    arStatus,
    arBalance,
    arUsdRate,
    claimsBalance,
    totalBalance,
    supportsBalance,
    tipsBalance,
    hasSynced,
    consolidatingUtxos,
    consolidateIsPending,
    massClaimingTips,
    massClaimIsPending,
    utxoCounts,
    doOpenModal,
    doUtxoConsolidate,
    doFetchUtxoCounts,
    doArConnect,
    doArDisconnect,
  } = props;

  const {
    walletType,
    hasArweaveExtension,
    hasArSignin,
    hasArConnection,
    isSigningIn,
    hasConnection,
  } = useArStatus();

  const isMobile = useIsMobile();
  const isWanderApp = navigator.userAgent.includes('WanderMobile');
  const [detailsExpanded, setDetailsExpanded] = React.useState(false);
  const { other: otherCount = 0 } = utxoCounts || {};
  const totalLocked = tipsBalance + claimsBalance + supportsBalance;
  const operationPending = massClaimIsPending || massClaimingTips || consolidateIsPending || consolidatingUtxos;

  React.useEffect(() => {
    if (LBCBalance > LARGE_WALLET_BALANCE && detailsExpanded) {
      doFetchUtxoCounts();
    }
  }, [doFetchUtxoCounts, LBCBalance, detailsExpanded]);

  const handleSignIn = () => {
    const showModal = clientSettings[SETTINGS.CRYPTO_DISCLAIMERS]
    if(showModal) doOpenModal(MODALS.CRYPTO_DISCLAIMERS)
    else window.wanderInstance.open();
  }

  return (
    <div className={'columns'}>
      <div className="column">
        <Card
          title={<Symbol token="lbc" amount={formatCredits(totalBalance, 8, true)} precision={6} isTitle counter />}
          subtitle={
            totalLocked > 0 ? (
              <I18nMessage tokens={{ lbc: <LbcSymbol /> }}>
                Your total %lbc% balance. All of this is yours, but some %lbc% is in use on channels and content right
                now.
              </I18nMessage>
            ) : (
              <span>{__('Your total balance.')}</span>
            )
          }
          background
          actions={
            <>
              <h2 className="section__title--small">
                <I18nMessage tokens={{ lbc_amount: <CreditAmount amount={LBCBalance} precision={4} /> }}>
                  %lbc_amount% immediately spendable
                </I18nMessage>
              </h2>

              <h2 className="section__title--small">
                <I18nMessage
                  tokens={{
                    lbc_amount: <CreditAmount amount={totalLocked} precision={4} />,
                  }}
                >
                  %lbc_amount% boosting content
                </I18nMessage>
                <Button
                  button="link"
                  label={detailsExpanded ? __('View less') : __('View more')}
                  iconRight={detailsExpanded ? ICONS.UP : ICONS.DOWN}
                  onClick={() => setDetailsExpanded(!detailsExpanded)}
                />
              </h2>
              {detailsExpanded && (
                <div className="section__subtitle">
                  <dl>
                    <dt>
                      <span className="dt__text">{__('...earned from others')}</span>
                      <span className="help--dt">({__('Unlock to spend')})</span>
                    </dt>
                    <dd>
                      <span className="dd__text">
                        {Boolean(tipsBalance) && (
                          <Button
                            button="link"
                            className="dd__button"
                            disabled={operationPending}
                            icon={ICONS.UNLOCK}
                            onClick={() => doOpenModal(MODALS.MASS_TIP_UNLOCK)}
                          />
                        )}
                        <CreditAmount amount={tipsBalance} precision={4} />
                      </span>
                    </dd>

                    <dt>
                      <span className="dt__text">{__('...on initial publishes')}</span>
                      <span className="help--dt">({__('Delete or edit past content to spend')})</span>
                    </dt>
                    <dd>
                      <CreditAmount amount={claimsBalance} precision={4} />
                    </dd>

                    <dt>
                      <span className="dt__text">{__('...supporting content')}</span>
                      <span className="help--dt">({__('Delete supports to spend')})</span>
                    </dt>
                    <dd>
                      <CreditAmount amount={supportsBalance} precision={4} />
                    </dd>
                  </dl>
                </div>
              )}

              {/* @if TARGET='app' */}
              {hasSynced ? (
                <p className="section help">
                  {__('A backup of your wallet is synced with lbry.tv.')}
                  <HelpLink href="https://lbry.com/faq/account-sync" />
                </p>
              ) : (
                <p className="help--warning">
                  {__(
                    'Your wallet is not currently synced with lbry.tv. You are in control of backing up your wallet.'
                  )}
                  <HelpLink navigate={`/$/${PAGES.BACKUP}`} />
                </p>
              )}
              {/* @endif */}
              <div className="section__actions">
                <Button
                  button="secondary"
                  label={__('Receive')}
                  icon={ICONS.RECEIVE}
                  navigate={`/$/${PAGES.RECEIVE}`}
                />
                <Button button="secondary" label={__('Send')} icon={ICONS.SEND} navigate={`/$/${PAGES.SEND}`} />
              </div>
              {(otherCount > WALLET_CONSOLIDATE_UTXOS || consolidateIsPending || consolidatingUtxos) && (
                <p className="help">
                  <I18nMessage
                    tokens={{
                      now: (
                        <Button
                          button="link"
                          onClick={() => doUtxoConsolidate()}
                          disabled={operationPending}
                          label={
                            consolidateIsPending || consolidatingUtxos ? __('Consolidating...') : __('Consolidate Now')
                          }
                        />
                      ),
                      help: <HelpLink href="https://help.odysee.tv/category-wallet/" />,
                    }}
                  >
                    Your wallet has a lot of change lying around. Consolidating will speed up your transactions. This
                    could take some time. %now%%help%
                  </I18nMessage>
                </p>
              )}
            </>
          }
        />
      </div>
      {/* ARWEAVE */}
      <div className="column">
        <Card
          title={
            !hasArConnection ? (
              <Symbol token="wallet" amount="0" precision={2} isTitle counter />
            ) : (
              <>
                <Symbol token="usd" amount={(arBalance*arStatus.exchangeRates.ar)} precision={2} isTitle counter />
                <Button button="alt" label={__('Disconnect Wallet')} onClick={() => doArDisconnect()} />
              </>
            )
          }
          subtitle={
            <>
              <div className="wallet-check-row">
                <div>{__(`Wander login${!isMobile ? ' or extension' : ''}`)}</div>
                <div>
                  {!hasConnection && !isSigningIn ? (
                    <img src="https://thumbs.odycdn.com/bd2adbec2979b00b1fcb6794e118d5db.webp" alt="Failed" />
                  ) : isSigningIn ? (
                    <img src="https://thumbs.odycdn.com/fcf0fa003f3537b8e5d6acd1d5a96055.webp" alt="Loading..." />
                  ) : (
                    <img src="https://thumbs.odycdn.com/8ee966185b537b147fb7be4412b6bc68.webp" alt="Success" />
                  )}
                </div>
              </div>

              <div className="wallet-check-row">
                <div>{__('Wander wallet connection')}</div>
                <div>
                  {hasArConnection ? (
                    <img src="https://thumbs.odycdn.com/8ee966185b537b147fb7be4412b6bc68.webp" />
                  ) : (
                    <img src="https://thumbs.odycdn.com/bd2adbec2979b00b1fcb6794e118d5db.webp" />
                  )}
                </div>
              </div>
            </>
          }
          background
          actions={
            <>
              {!hasConnection && !isSigningIn ? (
                <div>
                  <I18nMessage
                    tokens={{
                      textD: (
                        <p>
                          To use AR on Odysee, you need to create and/or sign into Wander – a cryptocurrency wallet compatible with AR.
                        </p>
                      ),
                      textM: (
                        <p>
                          To use AR on Odysee, you need to create and/or sign into Wander – a cryptocurrency wallet compatible with AR.
                        </p>
                      ),
                      login: (
                        <a
                          className="link"
                          onClick={handleSignIn}
                        >
                          Sign in
                        </a>
                      ),
                      extension: (
                        <a
                          className="link"
                          rel="noreferrer"
                          href="https://www.wander.app/download?tab=download-browser"
                          target="_blank"
                        >
                          install browser extension
                        </a>
                      ),
                      app: (
                        <a
                          className="link"
                          rel="noreferrer"
                          href="https://www.wander.app/download?tab=download-mobile"
                          target="_blank"
                        >
                          Wander Wallet app
                        </a>
                      ),
                    }}
                  >
                    {`${isMobile ? '%textM% or get the %app%.' : '%textD%'} %login%${
                      !isMobile && !hasArweaveExtension && window.wanderInstance.authInfo.authType === 'NATIVE_WALLET'
                        ? ' or %extension%.'
                        : ''
                    }`}
                  </I18nMessage>
                </div>
              ) : isSigningIn ? (
                <div>
                  <I18nMessage
                    tokens={{
                      text: <p>Odysee is signing you in to your Wander wallet. Please wait...</p>,
                      status: (
                        <a
                          className="link"
                          onClick={() => {
                            window.wanderInstance.open();
                          }}
                        >
                          Check status
                        </a>
                      ),
                    }}
                  >
                    {`%text% %status%`}
                  </I18nMessage>
                </div>
              ) : !hasArConnection ? (
                <div>
                  <I18nMessage
                    tokens={{
                      text: <p>To use AR on Odysee, the Wander wallet must be connected.</p>,
                      link: (
                        <a
                          className="link"
                          onClick={() => doArConnect()}
                        >
                          Connect now
                        </a>
                      ),
                      login: (
                        <a className="link" onClick={() => window.wanderInstance.open()}>
                          change login
                        </a>
                      ),
                    }}
                  >
                    {`%text% %link%${!isWanderApp ? ' or %login%.' : ''}`}
                  </I18nMessage>
                </div>
              ) : (
                <>
                  <h2 className="section__title--small">
                    <I18nMessage
                      tokens={{
                        ar_amount: <Symbol token="ar" amount={arBalance} precision={6} />,
                      }}
                    >
                      %ar_amount%
                    </I18nMessage>
                  </h2>
                  <h2 className="section__title--small">
                    <img src="https://thumbnails.odycdn.com/optimize/s:40:0/quality:95/plain/https://thumbs.odycdn.com/6392753ffcf0f9318c3bded3b13388e6.webp" />
                    AR Price: ${Number(arStatus.exchangeRates.ar).toFixed(2)} USD
                  </h2>
                  
                </>
              )}

              <div className="section__actions">
                <Button
                  button="secondary"
                  label={__(`Deposit${!isMobile ? ' Funds' : ''}`)}
                  icon={ICONS.BUY}
                  navigate={`/$/${PAGES.ARACCOUNT}?tab=buy`}
                  disabled={!hasArSignin || !hasArConnection}
                />
                <Button
                  button="secondary"
                  label={__(`${!isMobile ? 'Arweave ' : ''}Account`)}
                  icon={ICONS.SETTINGS}
                  navigate={`/$/${PAGES.ARACCOUNT}`}
                  disabled={!hasArSignin || !hasArConnection}
                />
                <Button
                  button="secondary"
                  label={__('Wallet')}
                  icon={ICONS.WANDER}
                  onClick={() => window.wanderInstance.open()}
                  disabled={!hasArConnection || walletType === 'extension'}
                />
              </div>
            </>
          }
        />
      </div>

      {/* ENABLE_STRIPE && <div className="column">{<WalletFiatBalance />}</div> */}
    </div>
  );
};

export default WalletBalance;
