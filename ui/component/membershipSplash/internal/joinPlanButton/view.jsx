// @flow
import React from 'react';

import { useHistory } from 'react-router';
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

  const { push } = useHistory();

  return (
    <Button
      button="primary"
      label={__('Join')}
      navigate={
        hasSavedCard
          ? `/$/${PAGES.ODYSEE_PREMIUM}?interval=${interval}&plan=${plan}&pageLocation=${pageLocation}&`
          : undefined
      }
      onClick={!hasSavedCard ? () => push('/$/settings/card') : undefined} // todo : add save card modal
    />
  );
};

export default JoinButton;
