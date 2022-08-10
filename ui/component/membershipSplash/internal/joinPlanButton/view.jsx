// @flow
import React from 'react';

import * as PAGES from 'constants/pages';
import * as MODALS from 'constants/modal_types';

import Button from 'component/button';

type Props = {
  pageLocation: string,
  interval: string,
  plan: string,
  // -- redux --
  hasSavedCard: boolean,
  doOpenModal: (modalId: string) => void,
};

const JoinButton = (props: Props) => {
  const { pageLocation, interval, plan, hasSavedCard, doOpenModal } = props;

  if (hasSavedCard === undefined) return null;

  return (
    <Button
      button="primary"
      label={__('Join')}
      navigate={
        hasSavedCard
          ? `/$/${PAGES.ODYSEE_PREMIUM}?interval=${interval}&plan=${plan}&pageLocation=${pageLocation}&`
          : undefined
      }
      onClick={!hasSavedCard ? doOpenModal(MODALS.ADD_CARD) : undefined} // todo : add save card modal
    />
  );
};

export default JoinButton;
