/**
 * Covers both "create" and "edit" actions for a featured-channel.
 */
import React from 'react';
import { v4 as Uuidv4 } from 'uuid';
import Button from 'component/button';
import ChannelFinder from 'component/channelFinder';
import Card from 'component/common/card';
import { FormField } from 'component/common/form';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { doUpdateCreatorSettings } from 'redux/actions/comments';
import { doToast } from 'redux/actions/notifications';
import { selectClaimForClaimId } from 'redux/selectors/claims';
import { selectFeaturedChannelsForChannelId, selectSectionsForChannelId } from 'redux/selectors/comments';

const DEFAULT_SECTION = {
  version: '1.0',
  entries: [],
};

type Props = {
  channelId: string;
  sectionId?: string;
  onSave?: () => void;
  onCancel?: () => void;
};
export default function FeaturedChannelsEdit(props: Props) {
  const { channelId, sectionId, onSave, onCancel } = props;
  const dispatch = useAppDispatch();

  const sections = useAppSelector((state) => selectSectionsForChannelId(state, channelId)) || DEFAULT_SECTION;
  const featuredChannels = useAppSelector((state) => selectFeaturedChannelsForChannelId(state, channelId));
  const channelClaim = useAppSelector((state) => selectClaimForClaimId(state, channelId));
  const isEditing = Boolean(sectionId);
  const fc: FeaturedChannelsSection | null | undefined = React.useMemo(() => {
    return featuredChannels && featuredChannels.find((x) => x.id === sectionId);
  }, [featuredChannels, sectionId]);
  const [name, setName] = React.useState(fc ? fc.value.title : '');
  const [uris, setUris] = React.useState(fc ? fc.value.uris : []);
  const missingData = !sections || (isEditing && !fc) || !channelClaim;

  // **************************************************************************
  // **************************************************************************
  function showFailureToast() {
    dispatch(
      doToast({
        message: __('Failed to update the list.'),
        subMessage: __('Try refreshing the page and edit again. Sorry :('),
        isError: true,
        duration: 'long',
      })
    );
  }

  function handleSave() {
    if (missingData) {
      showFailureToast();
      return;
    }

    // ² - 'missingData' covered the null cases
    const entries = sections.entries.slice();

    if (isEditing) {
      // --- EDIT ---
      // $FlowIgnore²
      const index = fc ? entries.findIndex((x) => x.id === fc.id) : -1;

      if (index > -1) {
        // $FlowIgnore²
        const newFc: FeaturedChannelsSection = { ...fc, value: { ...fc.value, title: name, uris: uris } };
        entries.splice(index, 1, newFc);
      } else {
        showFailureToast();
        return;
      }
    } else {
      // --- CREATE ---
      entries.push({
        id: Uuidv4(),
        value_type: 'featured_channels',
        value: {
          title: name,
          uris: uris,
        },
      });
    }

    const newSections = { ...sections, entries };
    // $FlowIgnore²
    dispatch(
      doUpdateCreatorSettings(channelClaim, {
        channel_sections: newSections,
      })
    );

    if (onSave) {
      onSave();
    }
  }

  function handleCancel() {
    if (onCancel) {
      onCancel();
    }
  }

  function handleSelectedUrisChanged(change: 'remove' | 'add' | 'reorder', params: any) {
    const { uri, to, from } = params;

    switch (change) {
      case 'remove':
        setUris((prev) => prev.filter((p) => p !== uri));
        break;

      case 'add':
        setUris((prev) => prev.concat([uri]));
        break;

      case 'reorder':
        setUris((prev) => {
          const next = prev.slice(); // immutable change

          next.splice(from, 1);
          next.splice(to, 0, prev[from]);
          return next;
        });
        break;

      default:
        console.error('Invalid change: ' + change); // eslint-disable-line no-console

        break;
    }
  }

  // **************************************************************************
  // **************************************************************************
  if (missingData) {
    return (
      <Card
        title={__('Featured channel list not found')}
        subtitle={__('Try refreshing the page and re-initiate the edit.')}
        body={
          <div className="section__actions">
            <Button button="primary" label={__('OK')} onClick={handleCancel} />
          </div>
        }
      />
    );
  }

  return (
    <Card
      body={
        <>
          <FormField
            label={__('Featured channels title')} // placeholder={__('Add list title')}
            type="text"
            name="fc_name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <ChannelFinder
            label={__('Search for channels to add')}
            selectedUris={uris}
            onSelectedUrisChanged={handleSelectedUrisChanged}
          />

          <div className="section__actions">
            <Button label={__('Done')} button="primary" disabled={!name || uris.length === 0} onClick={handleSave} />
            <Button button="link" label={__('Cancel')} onClick={handleCancel} />
          </div>

          <div className="error__text">{!name && <span>{__('A title is required')}</span>}</div>
        </>
      }
    />
  );
}
