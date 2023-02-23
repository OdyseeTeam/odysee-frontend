// @flow
import React from 'react';

import * as MODALS from 'constants/modal_types';
import Button from 'component/button';
import Spinner from 'component/spinner';

import { ModalContext } from 'contexts/modal';

type Props = {
  modalState: any,
  // -- redux --
  hasSavedCard: ?boolean,
  isAuthenticated: ?boolean,
  doOpenModal: (modalId: string, modalProps: {}) => void,
  doGetCustomerStatus: () => void,
};

/**
 * HigherOrderComponent to condition a button to become a "add card" prompt every time it is needed for a purchase,
 * and also prompts back to the previous modal in case it came from one.
 *
 * @param Component: FunctionalComponentParam
 * @returns {FunctionalComponent}
 */
const withCreditCard = (Component: FunctionalComponentParam) => {
  const CreditCardPrompt = (props: Props) => {
    // eslint-disable-next-line react/prop-types
    const { hasSavedCard, isAuthenticated, doOpenModal, doGetCustomerStatus, modalState, ...componentProps } = props;

    const fetchPending = isAuthenticated && hasSavedCard === undefined;
    const modal = React.useContext(ModalContext)?.modal;

    React.useEffect(() => {
      if (fetchPending) {
        doGetCustomerStatus();
      }
    }, [doGetCustomerStatus, fetchPending]);

    if (!hasSavedCard) {
      const handleOpenAddCardModal = () =>
        doOpenModal(MODALS.ADD_CARD, {
          ...(modal ? { previousModal: modal.id, previousProps: { ...modal.modalProps, ...modalState } } : {}),
        });

      return (
        <Button
          disabled={fetchPending}
          requiresAuth
          button="primary"
          label={fetchPending ? <Spinner type="small" /> : __('Add a Credit Card')}
          onClick={handleOpenAddCardModal}
        />
      );
    }

    return <Component {...componentProps} />;
  };

  return CreditCardPrompt;
};

export default withCreditCard;
