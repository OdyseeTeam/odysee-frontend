import * as ICONS from 'constants/icons';
import React from 'react';
import { Modal } from 'modal/modal';
import I18nMessage from 'component/i18nMessage';
import Button from 'component/button';
import LbcSymbol from 'component/common/lbc-symbol';
import Card from 'component/common/card';
import { WALLET_CONSOLIDATE_UTXOS } from 'component/walletBalance/view';
import { useAppDispatch, useAppSelector } from 'redux/hooks';
import { selectIsMassClaimingTips, selectUtxoCounts, selectTipsBalance } from 'redux/selectors/wallet';
import { doHideModal } from 'redux/actions/app';
import { doTipClaimMass } from 'redux/actions/wallet';

export default function ModalSupportsLiquidate() {
  const dispatch = useAppDispatch();
  const massClaimingTips = useAppSelector(selectIsMassClaimingTips);
  const utxoCounts = useAppSelector(selectUtxoCounts);
  const tipsBalance = useAppSelector(selectTipsBalance) || 0;

  const { support: supportCount = 0 } = utxoCounts || {};
  React.useEffect(() => {
    if (!tipsBalance) {
      dispatch(doHideModal());
    }
  }, [tipsBalance, dispatch]);
  return (
    <Modal
      isOpen
      contentLabel={__('Unlock all tips')}
      type="card"
      confirmButtonLabel="done"
      onAborted={() => dispatch(doHideModal())}
    >
      <Card
        icon={ICONS.UNLOCK}
        title={__('Unlock all tips')}
        subtitle={
          <>
            <p>
              <I18nMessage
                tokens={{
                  lbc: <LbcSymbol />,
                }}
              >
                These %lbc% help your content in search rankings. You can unlock them but that's less fun.
              </I18nMessage>
            </p>
            <p>
              <I18nMessage
                tokens={{
                  learn_more: (
                    <Button
                      button="link"
                      label={__('Learn More')}
                      href="https://help.odysee.tv/category-blockchain/category-staking/increase/"
                    />
                  ),
                }}
              >
                It's usually only worth unlocking what you intend to use immediately. %learn_more%
              </I18nMessage>
            </p>
          </>
        }
        actions={
          <>
            <div className="section__actions">
              <Button
                button="primary"
                onClick={() => dispatch(doTipClaimMass())}
                disabled={massClaimingTips}
                label={massClaimingTips ? __('Working...') : __('Unlock All')}
              />
            </div>
            {supportCount > WALLET_CONSOLIDATE_UTXOS && (
              <span className="help">{__('You have a lot of tips. This could take some time.')}</span>
            )}
          </>
        }
      />
    </Modal>
  );
}
