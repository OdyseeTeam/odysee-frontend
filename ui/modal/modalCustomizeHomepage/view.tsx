import React from 'react';
import './style.scss';
import Button from 'component/button';
import Card from 'component/common/card';
import { FormField } from 'component/common/form';
import HomepageSort from 'component/homepageSort';
import * as MODALS from 'constants/modal_types';
import * as SETTINGS from 'constants/settings';
import { Modal } from 'modal/modal';
import { useAppDispatch, useAppSelector } from 'redux/hooks';
import { selectClientSetting } from 'redux/selectors/settings';
import { doSetClientSetting } from 'redux/actions/settings';
import { doToast } from 'redux/actions/notifications';
import { doOpenModal, doHideModal } from 'redux/actions/app';
type HomepageOrder = {
  active: Array<string> | null | undefined;
  hidden: Array<string> | null | undefined;
};

export default function ModalCustomizeHomepage() {
  const dispatch = useAppDispatch();
  const homepageOrder: HomepageOrder = useAppSelector((state) => selectClientSetting(state, SETTINGS.HOMEPAGE_ORDER));
  const alsoApplyToSidebar: boolean = useAppSelector((state) =>
    selectClientSetting(state, SETTINGS.HOMEPAGE_ORDER_APPLY_TO_SIDEBAR)
  );

  const [applyToSidebar, setApplyToSidebar] = React.useState(alsoApplyToSidebar);
  const order = React.useRef();

  function handleNewOrder(newOrder: HomepageOrder) {
    order.current = newOrder;
  }

  function handleSave() {
    // Non-English homepages created their own categories, so that made things
    // complicated. Store every new key encountered, and just not show them
    // in the GUI depending on the selected homepage language.
    // Be sure not to erase any saved keys.
    if (order.current) {
      const orderToSave: HomepageOrder = order.current;

      if (orderToSave.active && orderToSave.hidden) {
        if (homepageOrder.active) {
          homepageOrder.active.forEach((x) => {
            if (!orderToSave.active.includes(x) && !orderToSave.hidden.includes(x)) {
              orderToSave.active.push(x);
            }
          });
        }

        if (homepageOrder.hidden) {
          homepageOrder.hidden.forEach((x) => {
            if (!orderToSave.active.includes(x) && !orderToSave.hidden.includes(x)) {
              orderToSave.hidden.push(x);
            }
          });
        }

        dispatch(doSetClientSetting(SETTINGS.HOMEPAGE_ORDER, orderToSave, true));
      } else {
        console.error('Homepage: invalid orderToSave', orderToSave); // eslint-disable-line no-console
      }
    }

    dispatch(doSetClientSetting(SETTINGS.HOMEPAGE_ORDER_APPLY_TO_SIDEBAR, applyToSidebar, true));
    dispatch(doHideModal());
  }

  function handleReset() {
    dispatch(
      doOpenModal(MODALS.CONFIRM, {
        title: __('Reset homepage to defaults?'),
        subtitle: __('This action is permanent and cannot be undone'),
        onConfirm: (closeModal) => {
          dispatch(
            doSetClientSetting(
              SETTINGS.HOMEPAGE_ORDER,
              {
                active: null,
                hidden: null,
              },
              true
            )
          );
          dispatch(
            doToast({
              message: __('Homepage restored to default.'),
            })
          );
          closeModal();
        },
      })
    );
  }

  return (
    <Modal className="modal-customize-homepage" isOpen type="custom" width="wide-fixed" onAborted={undefined}>
      <Card
        title={__('Customize Homepage')}
        body={
          <>
            <HomepageSort onUpdate={handleNewOrder} />
            <Button button="link" label={__('Reset')} onClick={handleReset} />
            <FormField
              type="checkbox"
              name="apply_to_sidebar"
              label={__('Also apply to sidebar')}
              checked={applyToSidebar}
              onChange={() => setApplyToSidebar((prev) => !prev)}
            />
          </>
        }
        actions={
          <div className="modal-customize-homepage__actions section__actions">
            <Button button="primary" label={__('Save')} onClick={handleSave} />
            <Button button="link" label={__('Cancel')} onClick={() => dispatch(doHideModal())} />
          </div>
        }
      />
    </Modal>
  );
}
