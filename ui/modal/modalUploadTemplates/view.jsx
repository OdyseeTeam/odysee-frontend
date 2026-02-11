// @flow
import React from 'react';
import { Modal } from 'modal/modal';
import Card from 'component/common/card';
import Button from 'component/button';
import { FormField } from 'component/common/form';
import Icon from 'component/common/icon';
import * as ICONS from 'constants/icons';
import { getUploadTemplatesFromSettings, normalizeHomepageSettings } from 'util/homepage-settings';
import './style.scss';

type Props = {
  templates: Array<UploadTemplate>,
  activeChannelClaim: ?ChannelClaim,
  channelSettings: ?PerChannelSettings,
  doUpdateCreatorSettings: (ChannelClaim, any) => void,
  doToast: ({ message: string, isError?: boolean }) => void,
  doHideModal: () => void,
};

export default function ModalUploadTemplates(props: Props) {
  const {
    templates: originalTemplates,
    activeChannelClaim,
    channelSettings,
    doUpdateCreatorSettings,
    doToast,
    doHideModal,
  } = props;

  const normalizedHomepageSettings = React.useMemo(
    () => normalizeHomepageSettings(channelSettings?.homepage_settings),
    [channelSettings]
  );
  const sourceTemplates = React.useMemo(() => {
    if (originalTemplates && originalTemplates.length > 0) {
      return originalTemplates;
    }

    return getUploadTemplatesFromSettings(channelSettings);
  }, [originalTemplates, channelSettings]);

  const [templates, setTemplates] = React.useState<Array<UploadTemplate>>(sourceTemplates || []);
  const [editingId, setEditingId] = React.useState<?string>(null);
  const [editName, setEditName] = React.useState('');

  React.useEffect(() => {
    setTemplates(sourceTemplates || []);
  }, [sourceTemplates]);

  const sortedTemplates = React.useMemo(
    () =>
      [...templates].sort((a, b) => {
        const timeDiff = Number(b.createdAt || 0) - Number(a.createdAt || 0);
        if (timeDiff !== 0) return timeDiff;
        return a.name.localeCompare(b.name);
      }),
    [templates]
  );

  function handleDelete(templateId: string) {
    const updated = templates.filter((t) => t.id !== templateId);
    setTemplates(updated);
    if (editingId === templateId) {
      setEditingId(null);
      setEditName('');
    }
  }

  function handleStartRename(template: UploadTemplate) {
    setEditingId(template.id);
    setEditName(template.name);
  }

  function handleConfirmRename(templateId: string) {
    if (!editName.trim()) return;
    const normalizedName = editName.trim();
    const duplicateTemplate = templates.find(
      (template) => template.id !== templateId && template.name.toLowerCase() === normalizedName.toLowerCase()
    );

    if (duplicateTemplate) {
      doToast({ message: __('A template named "%name%" already exists.', { name: normalizedName }), isError: true });
      return;
    }

    const updated = templates.map((t) => (t.id === templateId ? { ...t, name: normalizedName } : t));
    setTemplates(updated);
    setEditingId(null);
    setEditName('');
  }

  function handleCancelRename() {
    setEditingId(null);
    setEditName('');
  }

  function handleSave() {
    if (!activeChannelClaim) return;
    const sections = Array.isArray(normalizedHomepageSettings.sections) ? normalizedHomepageSettings.sections : [];
    doUpdateCreatorSettings(activeChannelClaim, {
      homepage_settings: {
        ...normalizedHomepageSettings,
        sections,
        upload_templates: templates,
      },
    });
    doToast({ message: __('Upload templates updated') });
    doHideModal();
  }

  const hasChanges = React.useMemo(() => {
    const orig = sourceTemplates || [];
    if (templates.length !== orig.length) return true;
    return templates.some((t, i) => t.id !== orig[i].id || t.name !== orig[i].name);
  }, [templates, sourceTemplates]);

  function getCreatedAtLabel(template: UploadTemplate) {
    const timestamp = Number(template.createdAt || 0);
    if (!timestamp) return __('Date unknown');
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? __('Date unknown') : date.toLocaleDateString();
  }

  return (
    <Modal isOpen type="custom" width="wide" onAborted={doHideModal}>
      <Card
        title={__('Manage Upload Templates')}
        subtitle={__(
          'Rename or delete your saved upload templates. Note: template data is public and visible to others.'
        )}
        body={
          <div className="upload-templates-manage">
            {templates.length === 0 ? (
              <div className="main--empty">{__('No templates saved yet.')}</div>
            ) : (
              <div className="upload-templates-manage__list">
                {sortedTemplates.map((template) => (
                  <div key={template.id} className="upload-templates-manage__item">
                    {editingId === template.id ? (
                      <div className="upload-templates-manage__edit-row">
                        <FormField
                          type="text"
                          name={`rename_${template.id}`}
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleConfirmRename(template.id);
                            if (e.key === 'Escape') handleCancelRename();
                          }}
                          autoFocus
                        />
                        <button
                          type="button"
                          className="upload-templates-manage__action-btn"
                          onClick={() => handleConfirmRename(template.id)}
                          disabled={!editName.trim()}
                          title={__('Confirm')}
                        >
                          <Icon icon={ICONS.COMPLETE} />
                        </button>
                        <button
                          type="button"
                          className="upload-templates-manage__action-btn"
                          onClick={handleCancelRename}
                          title={__('Cancel')}
                        >
                          <Icon icon={ICONS.REMOVE} />
                        </button>
                      </div>
                    ) : (
                      <div className="upload-templates-manage__display-row">
                        <div className="upload-templates-manage__info">
                          <Icon icon={ICONS.STACK} />
                          <span className="upload-templates-manage__name">{template.name}</span>
                          <span className="upload-templates-manage__date">{getCreatedAtLabel(template)}</span>
                        </div>
                        <div className="upload-templates-manage__actions">
                          <button
                            type="button"
                            className="upload-templates-manage__action-btn"
                            onClick={() => handleStartRename(template)}
                            title={__('Rename')}
                          >
                            <Icon icon={ICONS.EDIT} />
                          </button>
                          <button
                            type="button"
                            className="upload-templates-manage__action-btn upload-templates-manage__action-btn--delete"
                            onClick={() => handleDelete(template.id)}
                            title={__('Delete')}
                          >
                            <Icon icon={ICONS.DELETE} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        }
        actions={
          <div className="section__actions">
            <Button
              button="primary"
              label={__('Save Changes')}
              onClick={handleSave}
              disabled={!hasChanges || !activeChannelClaim}
            />
            <Button button="link" label={__('Cancel')} onClick={doHideModal} />
          </div>
        }
      />
    </Modal>
  );
}
