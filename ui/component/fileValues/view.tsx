import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';
import * as PAGES from 'constants/pages';
import React from 'react';
import Button from 'component/button';
import Spinner from 'component/spinner';
import HelpLink from 'component/common/help-link';
import CreditAmount from 'component/common/credit-amount';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import {
  selectClaimForUri,
  makeSelectContentTypeForUri,
  makeSelectMetadataForUri,
  selectClaimIsMine,
} from 'redux/selectors/claims';
import { makeSelectPendingAmountByUri } from 'redux/selectors/wallet';
import { doOpenModal } from 'redux/actions/app';

type Props = {
  uri: string;
};

function FileValues(props: Props) {
  const { uri } = props;

  const dispatch = useAppDispatch();
  const claim = useAppSelector((state) => selectClaimForUri(state, uri));
  const contentType = useAppSelector((state) => makeSelectContentTypeForUri(uri)(state));
  const metadata = useAppSelector((state) => makeSelectMetadataForUri(uri)(state));
  const pendingAmount = useAppSelector((state) => makeSelectPendingAmountByUri(uri)(state));
  const claimIsMine = useAppSelector((state) => selectClaimIsMine(state, claim));

  if (!claim || !metadata) {
    return <span className="empty">{__('Empty claim or metadata info.')}</span>;
  }

  const openModal = (id: string, modalProps: { uri: string }) => dispatch(doOpenModal(id, modalProps));

  const supportsAmount = claim && claim.meta && claim.meta.support_amount && Number(claim.meta.support_amount);
  const purchaseReceipt = claim && claim.purchase_receipt;
  return (
    <table className="table table--condensed table--fixed table--lbc-details">
      <tbody>
        <tr>
          <td>{__('LBRY URL')}</td>
          <td>{claim.canonical_url}</td>
        </tr>
        <tr>
          <td>{__('Claim ID')}</td>
          <td>{claim.claim_id}</td>
        </tr>
        {purchaseReceipt && (
          <tr>
            <td> {__('Purchase Amount')}</td>
            <td>
              <Button
                button="link"
                href={`https://explorer.lbry.com/tx/${purchaseReceipt.txid}`}
                label={<CreditAmount amount={Number(purchaseReceipt.amount)} precision={2} />}
              />
            </td>
          </tr>
        )}
        <tr>
          <td> {__('Original Publish Amount')}</td>
          <td>{claim && claim.amount ? <CreditAmount amount={Number(claim.amount)} precision={2} /> : <p>...</p>}</td>
        </tr>
        <tr>
          <td>
            {__('Supports and Tips')}
            <HelpLink href="https://help.odysee.tv/category-monetization/" />
          </td>
          <td>
            {claimIsMine && !pendingAmount && Boolean(supportsAmount) && (
              <>
                <Button
                  button="link"
                  className="expandable__button"
                  icon={ICONS.UNLOCK}
                  label={<CreditAmount amount={Number(supportsAmount)} precision={2} />}
                  aria-label={__('Unlock tips')}
                  onClick={() => {
                    openModal(MODALS.LIQUIDATE_SUPPORTS, {
                      uri,
                    });
                  }}
                />{' '}
              </>
            )}
            {(!claimIsMine || (claimIsMine && !pendingAmount && supportsAmount === 0)) && (
              <CreditAmount amount={Number(supportsAmount)} precision={2} />
            )}

            {claimIsMine && pendingAmount && <Spinner type={'small'} />}
          </td>
        </tr>
        <tr>
          <td>
            <div>
              {__('Total Staked Amount')}
              <HelpLink href="https://help.odysee.tv/category-blockchain/category-staking/increase/" />
            </div>
          </td>
          <td>
            <CreditAmount amount={Number(claim.meta.effective_amount) || 0} precision={2} />
          </td>
        </tr>
        <tr>
          <td>
            {__('Community Choice?')}
            <HelpLink href="https://help.odysee.tv/category-blockchain/category-staking/naming/" />
          </td>
          <td>
            <Button
              button="link"
              label={claim.meta.is_controlling ? __('Yes') : __('No')}
              navigate={`/$/${PAGES.TOP}?name=${claim.name}`}
            />
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export default FileValues;
