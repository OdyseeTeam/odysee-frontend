// @flow
import * as PAGES from 'constants/pages';
import * as ICONS from 'constants/icons';
import React from 'react';
import Icon from 'component/common/icon';
import Button from 'component/button';
import { useHistory } from 'react-router';

type Props = {};

export default function CalendarHeaderButton(props: Props) {
  // const {} = props;
  const { push } = useHistory();

  function handleMenuClick() {
    push(`/$/${PAGES.CALENDAR}`);
  }

  return (
    <>
      <Button
        onClick={handleMenuClick}
        aria-label={__('Calendar')}
        title={__('Calendar')}
        className="header__navigation-item menu__title header__navigation-item--icon mobile-hidden test"
      >
        <Icon size={18} icon={ICONS.CALENDAR} aria-hidden />
        <div className="schedule-counter">0</div>
      </Button>
    </>
  );
}
