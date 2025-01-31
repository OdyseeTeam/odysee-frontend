// @flow
import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';
import * as PAGES from 'constants/pages';
import React from 'react';
import CreditAmount from 'component/common/credit-amount';
import Button from 'component/button';
import HelpLink from 'component/common/help-link';
import Card from 'component/common/card';
import Symbol from '../common/symbol';
import LbcSymbol from 'component/common/lbc-symbol';
import I18nMessage from 'component/i18nMessage';
import { formatNumberWithCommas } from 'util/number';
import WalletFiatBalance from 'component/walletFiatBalance';
import { ENABLE_STRIPE, ENABLE_ARCONNECT } from '../../../config';

type Props = {
  balance: number,
  totalBalance: number,
  claimsBalance: number,
  supportsBalance: number,
  tipsBalance: number,
  doOpenModal: (string) => void,
  hasSynced: boolean,
  doFetchUtxoCounts: () => void,
  doUtxoConsolidate: () => void,
  fetchingUtxoCounts: boolean,
  consolidatingUtxos: boolean,
  consolidateIsPending: boolean,
  massClaimingTips: boolean,
  massClaimIsPending: boolean,
  utxoCounts: { [string]: number },
  arweaveStatus: any,
  arConnectStatus: { status: string, address: string, balance: number },
  doCheckArConnectStatus: () => void,
};

export const WALLET_CONSOLIDATE_UTXOS = 400;
const LARGE_WALLET_BALANCE = 100;

const WalletBalance = (props: Props) => {
  const {
    balance,
    claimsBalance,
    supportsBalance,
    tipsBalance,
    doOpenModal,
    hasSynced,
    doUtxoConsolidate,
    doFetchUtxoCounts,
    consolidatingUtxos,
    consolidateIsPending,
    massClaimingTips,
    massClaimIsPending,
    utxoCounts,
    arweaveStatus,
    arConnectStatus,
    doCheckArConnectStatus,
  } = props;
  const [detailsExpanded, setDetailsExpanded] = React.useState(false);

  const { other: otherCount = 0 } = utxoCounts || {};

  const totalBalance = balance + tipsBalance + supportsBalance + claimsBalance;
  const totalLocked = tipsBalance + claimsBalance + supportsBalance;
  const operationPending = massClaimIsPending || massClaimingTips || consolidateIsPending || consolidatingUtxos;

  // tmp
  React.useEffect(() => {
    console.log('arweaveStatus', arweaveStatus);
    console.log('arConnectStatus', arConnectStatus);
  }, [arweaveStatus, arConnectStatus]);

  React.useEffect(() => {
    doCheckArConnectStatus();
  }, [doCheckArConnectStatus]);

  React.useEffect(() => {
    if (balance > LARGE_WALLET_BALANCE && detailsExpanded) {
      doFetchUtxoCounts();
    }
  }, [doFetchUtxoCounts, balance, detailsExpanded]);

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
                <I18nMessage tokens={{ lbc_amount: <CreditAmount amount={balance} precision={4} /> }}>
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
      <div className="column">
        {ENABLE_ARCONNECT && (
          <>
            <Card
              title={<Symbol token="usdc" amount={arConnectStatus.balance} precision={2} isTitle />}
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
                        usdc_amount: <Symbol token="usdc" amount={arConnectStatus.balance} precision={2} />,
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
                      navigate={`/$/${PAGES.BUY}`}
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
          </>
        )}
      </div>
      {ENABLE_STRIPE && <div className="column">{<WalletFiatBalance />}</div>}
    </div>
  );
};

export default WalletBalance;
