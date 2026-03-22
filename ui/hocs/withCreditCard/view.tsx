import React from 'react';
import * as MODALS from 'constants/modal_types';
import Button from 'component/button';
import Spinner from 'component/spinner';
import { ModalContext } from 'contexts/modal';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectHasSavedCard } from 'redux/selectors/stripe';
import { selectUserVerifiedEmail } from 'redux/selectors/user';
import { doOpenModal } from 'redux/actions/app';
import { doGetCustomerStatus } from 'redux/actions/stripe';

type Props = {
  modalState: any;
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
    const { modalState, ...componentProps } = props;
    const dispatch = useAppDispatch();
    const hasSavedCard = useAppSelector(selectHasSavedCard);
    const isAuthenticated = useAppSelector(selectUserVerifiedEmail);
    const fetchPending = isAuthenticated && hasSavedCard === undefined;
    const modal = React.useContext(ModalContext)?.modal;
    React.useEffect(() => {
      if (fetchPending) {
        dispatch(doGetCustomerStatus());
      }
    }, [dispatch, fetchPending]);

    if (!hasSavedCard) {
      const handleOpenAddCardModal = () =>
        dispatch(
          doOpenModal(
            MODALS.ADD_CARD,
            modal
              ? {
                  previousModal: modal.id,
                  previousProps: { ...modal.modalProps, ...modalState },
                }
              : {}
          )
        );

      return (
        <Button
          disabled={fetchPending}
          requiresAuth
          button="primary"
          label={fetchPending ? <Spinner type="small" /> : __('Confirm')}
          onClick={handleOpenAddCardModal}
        />
      );
    }

    return <Component {...componentProps} />;
  };

  CreditCardPrompt.displayName = `withCreditCard(${Component.displayName || Component.name || 'Component'})`;
  return CreditCardPrompt;
};

export default withCreditCard;
