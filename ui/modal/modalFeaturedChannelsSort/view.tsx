// MODALS.FEATURED_CHANNELS_SORT
import React from 'react';
import './style.scss';
import Button from 'component/button';
import SortableList from 'component/channelFinder/sortableList'; // 1

import Card from 'component/common/card';
import { Modal } from 'modal/modal';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectClaimForClaimId } from 'redux/selectors/claims';
import { selectSectionsForChannelId } from 'redux/selectors/comments';
import { doUpdateCreatorSettings } from 'redux/actions/comments';
import { doHideModal } from 'redux/actions/app';

// 1TODO: we are not supposed to grab "internal" components. SortableList is
// meant to be general purpose eventually.
type Props = {
  channelId: string;
};

export default function ModalFeaturedChannelsSort(props: Props) {
  const { channelId } = props;
  const dispatch = useAppDispatch();
  const sections = useAppSelector((state) => selectSectionsForChannelId(state, channelId));
  const channelClaim = useAppSelector((state) => selectClaimForClaimId(state, channelId));

  const entries = sections ? sections.entries : [];
  const [sectionIds, setSectionIds] = React.useState(entries.map((x) => x.id));

  function handleDragEnd(result) {
    const { source, destination } = result;

    if (source && destination) {
      setSectionIds((prev) => {
        const next = prev.slice();
        next.splice(source.index, 1);
        next.splice(destination.index, 0, prev[source.index]);
        return next;
      });
    }
  }

  function handleSave() {
    if (channelClaim && sections && sections.entries.length === sectionIds.length) {
      const entries = [];

      for (let i = 0; i < sectionIds.length; ++i) {
        const entry = sections.entries.find((x) => x.id === sectionIds[i]);

        if (!entry) {
          // There should never be a mismatch, so do nothing to avoid corrupting data.
          console.error('Failed to save sorting order (data mismatch)'); // eslint-disable-line no-console

          return;
        }

        entries.push(entry);
      }

      const newSections = { ...sections, entries };
      dispatch(
        doUpdateCreatorSettings(channelClaim, {
          channel_sections: newSections,
        })
      );
      dispatch(doHideModal());
    }
  }

  function handleCancel() {
    dispatch(doHideModal());
  }

  function getEntry(id: string) {
    const entry = entries.find((x) => x.id === id);
    return entry?.value?.title || id;
  }

  function isFcType(id: string) {
    const entry = entries.find((x) => x.id === id);
    return entry ? entry.value_type === 'featured_channels' : false;
  }

  return (
    <Modal isOpen type="custom" className="modalFCSort" onAborted={() => dispatch(doHideModal())}>
      <Card
        title={__('Sort Featured Channels')}
        body={
          <SortableList
            list={sectionIds}
            onGetElemAtIndex={(id, index) => (
              <div key={id} className="modalFCSort__item">
                {getEntry(id)}
              </div>
            )}
            onIsHiddenAtIndex={(id, index) => !isFcType(id)}
            onDragEnd={handleDragEnd}
          />
        }
        actions={
          <div className="section__actions">
            <Button button="primary" label={__('Save')} onClick={handleSave} />
            <Button button="link" label={__('Cancel')} onClick={handleCancel} />
          </div>
        }
      />
    </Modal>
  );
}
