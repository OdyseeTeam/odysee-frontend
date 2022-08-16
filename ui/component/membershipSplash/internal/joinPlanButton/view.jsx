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

  return (
    <Button
      button="primary"
      label={__('Join')}
      navigate={
        hasSavedCard
          ? `/$/${PAGES.ODYSEE_MEMBERSHIP}?interval=${interval}&plan=${plan}&pageLocation=${pageLocation}&`
          : undefined
      }
      onClick={!hasSavedCard ? () => doOpenModal(MODALS.ADD_CARD) : undefined}
    />
  );
};

export default JoinButton;
