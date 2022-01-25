// @flow
import { FormField } from 'component/common/form';
import { Modal } from 'modal/modal';
import * as txnTypes from 'constants/transaction_types';
import Button from 'component/button';
import Card from 'component/common/card';
import I18nMessage from 'component/i18nMessage';
import LbcSymbol from 'component/common/lbc-symbol';
import React from 'react';

type Props = {
  claim: Claim,
  tx: Txo,
  doAbandonTxo: (txo: Txo, cb?: (string) => void) => void,
  doAbandonClaim: (claim: Claim, cb?: (string) => void) => void,
  doHideModal: () => void,
  cb?: (any) => void,
};

export default function ModalRevokeClaim(props: Props) {
  const { claim, tx, doAbandonTxo, doAbandonClaim, doHideModal, cb } = props;

  const { value_type: valueType, type, normalized_name: name, is_my_input: isSupport } = tx || claim;

  const [channelName, setChannelName] = React.useState('');

  const isBoost = isSupport && type === txnTypes.SUPPORT;
  const isTip = type === txnTypes.SUPPORT;
  const isChannel =
    type === txnTypes.CHANNEL || valueType === txnTypes.CHANNEL || (type === txnTypes.UPDATE && name.startsWith('@'));

  const label = isBoost
    ? __('Confirm Support Removal')
    : isTip
    ? __('Confirm Tip Unlock')
    : isChannel
    ? __('Confirm Channel Removal')
    : __('Confirm Removal');

  return (
    <Modal isOpen contentLabel={label} type="card" onAborted={doHideModal}>
      <Card
        title={label}
        body={
          isBoost ? (
            <>
              <p>{__('Are you sure you want to remove this boost?')}</p>
              <p>
                <I18nMessage tokens={{ lbc: <LbcSymbol /> }}>
                  These Credits are permanently yours and this boost can be removed at any time. Removing this boost
                  will reduce discoverability and return %lbc% to your spendable balance.
                </I18nMessage>
              </p>
            </>
          ) : isTip ? (
            <>
              <p>{__('Are you sure you want to unlock these Credits?')}</p>
              <p>
                <I18nMessage tokens={{ lbc: <LbcSymbol /> }}>
                  These Credits are permanently yours and can be unlocked at any time. Unlocking them allows you to
                  spend them, but reduces discoverability of your content in lookups and search results. It is
                  recommended you leave %lbc% locked until you need or want to spend them.
                </I18nMessage>
              </p>
            </>
          ) : isChannel ? (
            <>
              <p>
                {__(
                  'This will permanently remove your channel. Content published under this channel will be orphaned.'
                )}
              </p>
              <p>{__('Are you sure? Type %name% to confirm that you wish to remove the channel.', { name })}</p>

              <FormField type="text" onChange={(e) => setChannelName(e.target.value)} />
            </>
          ) : (
            <>
              <p>{__('Are you sure you want to remove this?')}</p>
              <p>
                <I18nMessage tokens={{ lbc: <LbcSymbol /> }}>
                  This will prevent others from resolving and accessing the content you published. It will return the
                  %lbc% to your spendable balance.
                </I18nMessage>
              </p>
              <p className="help error__text"> {__('FINAL WARNING: This action is permanent and cannot be undone.')}</p>
            </>
          )
        }
        actions={
          <div className="section__actions">
            <Button
              disabled={isChannel && name !== channelName}
              button="primary"
              label={label}
              onClick={() => (tx ? doAbandonTxo(tx, cb) : doAbandonClaim(claim, cb))}
            />
            <Button button="link" label={__('Cancel')} onClick={doHideModal} />
          </div>
        }
      />
    </Modal>
  );
}
