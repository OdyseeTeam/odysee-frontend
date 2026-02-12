// @flow
import React from 'react';
import { Menu, MenuButton, MenuList, MenuItem } from '@reach/menu-button';
import Icon from 'component/common/icon';
import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';
import { FormField } from 'component/common/form';
import { v4 as uuid } from 'uuid';
import { getUploadTemplatesFromSettings } from 'util/homepage-settings';
import './style.scss';

type Props = {
  templates: Array<UploadTemplate>,
  activeChannelClaim: ?ChannelClaim,
  publishFormValues: any,
  channelSettings: ?PerChannelSettings,
  openModal: (string, ?{}) => void,
  updatePublishForm: (any) => void,
  doUpdateCreatorSettings: (ChannelClaim, any) => void,
  doToast: ({ message: string, isError?: boolean }) => void,
};

// Fields to extract from the publish form for template data
const TEMPLATE_FIELDS = [
  'title',
  'description',
  'tags',
  'thumbnail',
  'language',
  'languages',
  'licenseType',
  'licenseUrl',
  'otherLicenseDescription',
  'nsfw',
  'paywall',
  'fee',
  'fiatPurchaseFee',
  'fiatPurchaseEnabled',
  'fiatRentalFee',
  'fiatRentalExpiration',
  'fiatRentalEnabled',
  'visibility',
  'memberRestrictionOn',
  'memberRestrictionTierIds',
];

export default function PublishTemplateButton(props: Props) {
  const {
    templates,
    activeChannelClaim,
    publishFormValues,
    channelSettings,
    openModal,
    updatePublishForm,
    doUpdateCreatorSettings,
    doToast,
  } = props;

  const [showSaveInput, setShowSaveInput] = React.useState(false);
  const [templateName, setTemplateName] = React.useState('');
  const templatesFromSettings = React.useMemo(() => getUploadTemplatesFromSettings(channelSettings), [channelSettings]);
  const mergedTemplates = React.useMemo(() => {
    const seen = new Set();
    const merged = [];

    [...(templates || []), ...templatesFromSettings].forEach((template) => {
      if (!template || !template.id || seen.has(template.id)) {
        return;
      }

      seen.add(template.id);
      merged.push(template);
    });

    return merged;
  }, [templates, templatesFromSettings]);
  const [optimisticTemplates, setOptimisticTemplates] = React.useState<Array<UploadTemplate>>(mergedTemplates);

  React.useEffect(() => {
    setOptimisticTemplates(mergedTemplates);
  }, [mergedTemplates]);

  const sortedTemplates = React.useMemo(
    () => [...optimisticTemplates].sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)),
    [optimisticTemplates]
  );

  function closeSaveInput() {
    setShowSaveInput(false);
    setTemplateName('');
  }

  function extractTemplateData(): UploadTemplateData {
    const data: any = {};
    TEMPLATE_FIELDS.forEach((field) => {
      const value = publishFormValues[field];
      // Keep:
      // - all defined booleans (including 'false')
      // - all defined non-empty values
      if (value !== undefined && (typeof value === 'boolean' || value !== '')) {
        data[field] = value;
      }
    });
    return data;
  }

  function handleSaveTemplate() {
    if (!activeChannelClaim || !templateName.trim()) return;

    const normalizedTemplateName = templateName.trim();
    const existingName = sortedTemplates.find(
      (template) => template.name.toLowerCase() === normalizedTemplateName.toLowerCase()
    );
    if (existingName) {
      doToast({
        message: __('A template named "%name%" already exists.', { name: normalizedTemplateName }),
        isError: true,
      });
      return;
    }

    const templateData = extractTemplateData();
    if (Object.keys(templateData).length === 0) {
      doToast({ message: __('Cannot save an empty template.'), isError: true });
      return;
    }

    const newTemplate: UploadTemplate = {
      id: uuid(),
      name: normalizedTemplateName,
      createdAt: Date.now(),
      data: templateData,
    };

    const updatedTemplates = [...optimisticTemplates, newTemplate];

    setOptimisticTemplates(updatedTemplates);
    doUpdateCreatorSettings(activeChannelClaim, {
      upload_templates: updatedTemplates,
    });
    doToast({ message: __('Template "%name%" saved', { name: newTemplate.name }) });
    closeSaveInput();
  }

  function handleApplyTemplate(template: UploadTemplate) {
    if (template.data) {
      updatePublishForm({ ...template.data });
      doToast({ message: __('Template "%name%" applied', { name: template.name }) });
    }
  }

  function handleManageTemplates() {
    openModal(MODALS.MANAGE_UPLOAD_TEMPLATES);
  }

  if (!activeChannelClaim) return null;

  return (
    <div className="publish-template-wrapper">
      <Menu>
        <MenuButton className="button button--secondary">
          <Icon icon={ICONS.STACK} />
          {__('Prefill')}
          <Icon icon={ICONS.DOWN} />
        </MenuButton>
        <MenuList className="menu__list publish-template-menu__list">
          <MenuItem className="publish-template-menu__item" onSelect={() => openModal(MODALS.COPY_FROM_UPLOAD)}>
            <div className="menu__link">
              <Icon aria-hidden icon={ICONS.COPY} />
              {__('Copy from Previous Upload...')}
            </div>
          </MenuItem>
          <hr className="publish-template-menu__separator" />
          {sortedTemplates.length > 0 && (
            <>
              <div className="publish-template-menu__section-label">{__('Saved Templates')}</div>
              {sortedTemplates.map((template) => (
                <MenuItem
                  key={template.id}
                  className="publish-template-menu__item"
                  onSelect={() => handleApplyTemplate(template)}
                >
                  <div className="menu__link">
                    <Icon aria-hidden icon={ICONS.STACK} />
                    {template.name}
                  </div>
                </MenuItem>
              ))}
              <hr className="publish-template-menu__separator" />
            </>
          )}
          <MenuItem className="publish-template-menu__item" onSelect={() => setShowSaveInput(true)}>
            <div className="menu__link">
              <Icon aria-hidden icon={ICONS.ADD} />
              {__('Save Current as Template')}
            </div>
          </MenuItem>
          {sortedTemplates.length > 0 && (
            <MenuItem className="publish-template-menu__item" onSelect={handleManageTemplates}>
              <div className="menu__link">
                <Icon aria-hidden icon={ICONS.SETTINGS} />
                {__('Manage Templates')}
              </div>
            </MenuItem>
          )}
        </MenuList>
      </Menu>

      {showSaveInput && (
        <div className="publish-template-save">
          <FormField
            type="text"
            name="template_name"
            placeholder={__('Template name...')}
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                handleSaveTemplate();
              }
              if (e.key === 'Escape') {
                e.stopPropagation();
                e.preventDefault();
                closeSaveInput();
              }
            }}
            autoFocus
          />
          <button
            type="button"
            className="publish-template-save__confirm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSaveTemplate();
            }}
            disabled={!templateName.trim()}
            title={__('Save')}
          >
            <Icon icon={ICONS.COMPLETE} />
          </button>
          <button
            type="button"
            className="publish-template-save__cancel"
            onClick={(e) => {
              e.stopPropagation();
              closeSaveInput();
            }}
            title={__('Cancel')}
          >
            <Icon icon={ICONS.REMOVE} />
          </button>
          <span className="publish-template-save__warning">
            {__('Template data is public. Do not include private information.')}
          </span>
        </div>
      )}
    </div>
  );
}
