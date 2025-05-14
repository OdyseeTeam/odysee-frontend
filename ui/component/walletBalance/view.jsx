// @flow
import React from 'react';
import { ENABLE_STRIPE, ENABLE_ARCONNECT, ENABLE_STABLECOIN } from 'config';
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
// import WalletFiatBalance from 'component/walletFiatBalance';
import { formatNumberWithCommas } from 'util/number';
import Spinner from 'component/spinner';

type Props = {
  experimentalUi: boolean,
  LBCBalance: number,
  // USDCBalance: number,
  arStatus: any,
  arBalance: number,
  arUsdRate: number,
  wanderAuth: string,
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
  accountStatus: any,
  fullArweaveStatus: Array<any>,
  doOpenModal: (string) => void,
  doFetchUtxoCounts: () => void,
  doUtxoConsolidate: () => void,
  doArConnect: () => void,
  activeAPIArAccountAddress: string,
  activeAPIArAccount: any,
};

export const WALLET_CONSOLIDATE_UTXOS = 400;
const LARGE_WALLET_BALANCE = 100;

const WalletBalance = (props: Props) => {
  const {
    experimentalUi,
    LBCBalance,
    // USDCBalance,
    arStatus,
    arBalance,
    arUsdRate,
    claimsBalance,
    supportsBalance,
    tipsBalance,
    hasSynced,
    consolidatingUtxos,
    consolidateIsPending,
    massClaimingTips,
    massClaimIsPending,
    utxoCounts,
    wanderAuth,
    accountStatus,
    fullArweaveStatus,
    doOpenModal,
    doUtxoConsolidate,
    doFetchUtxoCounts,
    doArConnect,
  } = props;

  const [detailsExpanded, setDetailsExpanded] = React.useState(false);

  const { other: otherCount = 0 } = utxoCounts || {};
  const showStablecoin = ENABLE_STABLECOIN && experimentalUi;
  const totalBalance = LBCBalance + tipsBalance + supportsBalance + claimsBalance;
  const totalLocked = tipsBalance + claimsBalance + supportsBalance;
  const operationPending = massClaimIsPending || massClaimingTips || consolidateIsPending || consolidatingUtxos;

  // const hasArSignin = Boolean(window.wanderInstance.authInfo);
  const hasArSignin = wanderAuth === 'authenticated';
  const hasArConnection = Boolean(arStatus.address);

  React.useEffect(() => {
    if (LBCBalance > LARGE_WALLET_BALANCE && detailsExpanded) {
      doFetchUtxoCounts();
    }
  }, [doFetchUtxoCounts, LBCBalance, detailsExpanded]);

  return (
    <div className={'columns'}>
      <div className="column">
        <Card
          title={<Symbol token="lbc" amount={formatNumberWithCommas(totalBalance) || 0} isTitle />}
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
      {showStablecoin && (
        <div className="column">
          <Card
            title={<Symbol token="usdc" amount={USDCBalance} precision={2} isTitle />}
            subtitle={
              totalLocked > 0 ? (
                <I18nMessage tokens={{ usdc: <Symbol token="usdc" /> }}>Your total %usdc%USDC balance.</I18nMessage>
              ) : (
                <span>{__('Your total balance.')}</span>
              )
            }
            background
            actions={
              <>
                <h2 className="section__title--small">
                  <I18nMessage
                    tokens={{
                      usdc_amount: <Symbol token="usdc" amount={USDCBalance} precision={2} />,
                    }}
                  >
                    %usdc_amount%
                  </I18nMessage>
                </h2>
                <div className="section__actions">
                  <Button
                    button="secondary"
                    label={__('Deposit Funds')}
                    icon={ICONS.BUY}
                    navigate={`/$/${PAGES.PAYMENTACCOUNT}?tab=buy`}
                  />
                  <Button
                    button="secondary"
                    label={__('Payment Account')}
                    icon={ICONS.SETTINGS}
                    navigate={`/$/${PAGES.PAYMENTACCOUNT}`}
                  />
                </div>
              </>
            }
          />
        </div>
      )}
      {/* ARWEAVE */}
      <div className="column">
        <Card
          title={<Symbol token="ar" amount={arBalance} precision={2} isTitle />}
          subtitle={
            <>
              <div className="wallet-check-row">
                <div>{__('Wander wallet login')}</div>
                <div>
                  {!wanderAuth || wanderAuth === 'not-authenticated' ? (
                    <img src="https://thumbs.odycdn.com/bd2adbec2979b00b1fcb6794e118d5db.webp" />
                  ) : wanderAuth === 'loading' || wanderAuth === 'onboarding' ? (
                    <img src="https://thumbs.odycdn.com/fcf0fa003f3537b8e5d6acd1d5a96055.webp" alt="Loading..." />
                  ) : (
                    <img src="https://thumbs.odycdn.com/8ee966185b537b147fb7be4412b6bc68.webp" />
                  )}
                </div>
              </div>

              <div className="wallet-check-row">
                <div>{__('Wander wallet connection')}</div>
                <div>
                  {wanderAuth === 'authenticated' && hasArConnection ? (
                    <img src="https://thumbs.odycdn.com/8ee966185b537b147fb7be4412b6bc68.webp" />
                  ) : (
                    <img src="https://thumbs.odycdn.com/bd2adbec2979b00b1fcb6794e118d5db.webp" />
                  )}
                </div>
              </div>
              {/* <I18nMessage tokens={{ ar: <Symbol token="ar" /> }}>Your total %ar%AR balance.</I18nMessage> */}
            </>
          }
          background
          actions={
            <>
              {!wanderAuth || wanderAuth === 'not-authenticated' ? (
                <I18nMessage
                  tokens={{
                    link: (
                      <a
                        className="link"
                        onClick={() => {
                          window.wanderInstance.open();
                        }}
                      >
                        Sign in.
                      </a>
                    ),
                  }}
                >
                  To use AR on Odysee, you have to sign into the Wander wallet. %link%
                </I18nMessage>
              ) : wanderAuth === 'loading' ? (
                __('Odysee is signing you in to your Wander wallet. Please wait...')
              ) : !hasArConnection ? (
                <I18nMessage
                  tokens={{
                    link: (
                      <a className="link" onClick={() => doArConnect()}>
                        Connect now.
                      </a>
                    ),
                  }}
                >
                  To use AR on Odysee, the Wander wallet must be connected. %link%
                </I18nMessage>
              ) : (
                <>
                  <h2 className="section__title--small">
                    <I18nMessage
                      tokens={{
                        ar_amount: <Symbol token="ar" amount={arBalance} precision={2} />,
                      }}
                    >
                      %ar_amount%
                    </I18nMessage>
                  </h2>
                  <h2 className="section__title--small">
                    <I18nMessage
                      tokens={{
                        usd: <Symbol token="usd" amount={arBalance * arUsdRate} precision={2} />,
                      }}
                    >
                      %usd%
                    </I18nMessage>
                  </h2>
                </>
              )}

              <div className="section__actions">
                <Button
                  button="secondary"
                  label={__('Deposit Funds')}
                  icon={ICONS.BUY}
                  navigate={`/$/${PAGES.ARACCOUNT}?tab=buy`}
                  disabled={!hasArSignin || !hasArConnection}
                />
                <Button
                  button="secondary"
                  label={__('Arweave Account')}
                  icon={ICONS.SETTINGS}
                  navigate={`/$/${PAGES.ARACCOUNT}`}
                  disabled={!hasArSignin || !hasArConnection}
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
