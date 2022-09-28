// @flow
import React from 'react';

import * as MODALS from 'constants/modal_types';
import Button from 'component/button';

import { connect } from 'react-redux';
import { doOpenModal } from 'redux/actions/app';
import { selectHasSavedCard } from 'redux/selectors/stripe';

import { ModalContext } from 'modal/modalRouter/view';

type Props = {
  // -- redux --
  hasSavedCard: boolean,
  doOpenModal: (modalId: string) => void,
};

const withCreditCard = (Component) => {
  const select = (state) => ({
    hasSavedCard: selectHasSavedCard(state),
  });

  const perform = {
    doOpenModal,
  };

  const CreditCardPrompt = (props: Props) => {
    const { hasSavedCard, doOpenModal, ...componentProps } = props;

    const modal = React.useContext(ModalContext)?.modal;

    if (!hasSavedCard) {
      const handleOpenAddCardModal = () =>
        doOpenModal(MODALS.ADD_CARD, {
          ...(modal ? { previousModal: modal.id, previousProps: modal.modalProps } : {}),
        });

      return <Button button="primary" label={__('Add a Credit Card')} onClick={handleOpenAddCardModal} />;
    }

    return <Component {...componentProps} />;
  };

  return connect(select, perform)(CreditCardPrompt);
};

export default withCreditCard;
