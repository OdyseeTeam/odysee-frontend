import React from 'react';
import classnames from 'classnames';
import analytics from 'analytics';
import ClaimInsufficientCredits from 'component/claimInsufficientCredits';
import FilePrice from 'component/filePrice';
import { Modal } from 'modal/modal';
import Card from 'component/common/card';
import I18nMessage from 'component/i18nMessage';
import Button from 'component/button';
import { isURIEqual } from 'util/lbryURI';
import { useAppDispatch, useAppSelector } from 'redux/hooks';
import { selectInsufficientCreditsForUri, selectPlayingUri } from 'redux/selectors/content';
import { doHideModal, doAnaltyicsPurchaseEvent } from 'redux/actions/app';
import { makeSelectMetadataForUri } from 'redux/selectors/claims';
import { doPlayUri, doSetPlayingUri } from 'redux/actions/content';
// This number is tied to transitions in scss/purchase.scss
const ANIMATION_LENGTH = 2500;
type Props = {
  uri: string;
  cancelPurchase: () => void;
  cancelCb?: () => void;
};

function ModalAffirmPurchase(props: Props) {
  const { uri, cancelCb } = props;
  const dispatch = useAppDispatch();
  const isInsufficientCredits = useAppSelector((state) => selectInsufficientCreditsForUri(state, uri));
  const metadata = useAppSelector((state) => makeSelectMetadataForUri(uri)(state));
  const playingUri = useAppSelector(selectPlayingUri);
  const closeModal = () => dispatch(doHideModal());
  const [success, setSuccess] = React.useState(false);
  const [purchasing, setPurchasing] = React.useState(false);

  const modalTitle = __('Confirm Purchase');

  const title = metadata?.title;
  const renderedTitle = title ? `"${title}"` : uri;

  function onAffirmPurchase() {
    setPurchasing(true);
    dispatch(
      doPlayUri(uri, true, undefined, (fileInfo: GetResponse) => {
        setPurchasing(false);
        setSuccess(true);
        dispatch(doAnaltyicsPurchaseEvent(fileInfo));

        if (playingUri.uri !== uri) {
          dispatch(doSetPlayingUri({ ...playingUri, uri }));
        }
      })
    );
  }

  function handleCancelPurchase() {
    if (playingUri.uri && isURIEqual(uri, playingUri.uri) && !playingUri.collection.collectionId) {
      dispatch(doSetPlayingUri({ ...playingUri, uri: null }));
    }

    if (cancelCb) cancelCb();
    closeModal();
  }

  React.useEffect(() => {
    let timeout;

    if (success) {
      timeout = setTimeout(() => {
        closeModal();
        setSuccess(false);
      }, ANIMATION_LENGTH);
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    }; // eslint-disable-next-line react-hooks/exhaustive-deps -- @see TODO_NEED_VERIFICATION
  }, [success, uri]);
  React.useEffect(() => {
    if (!metadata) {
      analytics.log(new Error('ModalAffirmPurchase: null claim'), {
        fingerprint: ['ModalAffirmPurchase-null-claim'],
        tags: {
          uri,
          callbackExists: cancelCb ? 'yes' : 'no',
        },
      });
    } // eslint-disable-next-line react-hooks/exhaustive-deps -- on mount
  }, []);

  if (isInsufficientCredits) {
    return (
      <Modal type="card" isOpen onAborted={handleCancelPurchase}>
        <Card title={__('Insufficient credits')} subtitle={<ClaimInsufficientCredits uri={uri} />} />
      </Modal>
    );
  }

  return (
    <Modal type="card" isOpen contentLabel={modalTitle} onAborted={handleCancelPurchase}>
      <Card
        title={modalTitle}
        subtitle={
          <>
            <div
              className={classnames('purchase-stuff', {
                'purchase-stuff--purchased': success,
              })}
            >
              <div>
                {/* Keep this message rendered but hidden so the width doesn't change */}
                <I18nMessage
                  tokens={{
                    claim_title: <strong>{renderedTitle}</strong>,
                  }}
                >
                  Are you sure you want to purchase %claim_title%?
                </I18nMessage>
              </div>
              <div>
                <FilePrice uri={uri} showFullPrice type="modal" />
              </div>
            </div>
            {success && (
              <div className="purchase-stuff__text--purchased">
                {__('Purchased!')}
                <div className="purchase_stuff__subtext--purchased">
                  {__('This content will now be in your Library.')}
                </div>
              </div>
            )}
          </>
        }
        actions={
          <div
            className="section__actions"
            style={
              success
                ? {
                    visibility: 'hidden',
                  }
                : undefined
            }
          >
            <Button
              button="primary"
              disabled={purchasing}
              label={purchasing ? __('Purchasing...') : __('Purchase')}
              onClick={onAffirmPurchase}
            />
            <Button button="link" label={__('Cancel')} onClick={handleCancelPurchase} />
          </div>
        }
      />
    </Modal>
  );
}

export default ModalAffirmPurchase;
