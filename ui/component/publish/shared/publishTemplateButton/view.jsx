// @flow
import React from 'react';
import { Menu, MenuButton, MenuList, MenuItem } from '@reach/menu-button';
import Icon from 'component/common/icon';
import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';
import { FormField } from 'component/common/form';
import { v4 as uuid } from 'uuid';
import './style.scss';

type Props = {
  templates: Array<UploadTemplate>,
  activeChannelClaim: ?ChannelClaim,
  publishFormValues: any,
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
    openModal,
    updatePublishForm,
    doUpdateCreatorSettings,
    doToast,
  } = props;

  const [showSaveInput, setShowSaveInput] = React.useState(false);
  const [templateName, setTemplateName] = React.useState('');
  const sortedTemplates = React.useMemo(
    () => [...(templates || [])].sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)),
    [templates]
  );

  function closeSaveInput() {
    setShowSaveInput(false);
    setTemplateName('');
  }

  function extractTemplateData(): UploadTemplateData {
    const data: any = {};
    TEMPLATE_FIELDS.forEach((field) => {
      if (publishFormValues[field] !== undefined && publishFormValues[field] !== '') {
        data[field] = publishFormValues[field];
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

    const updatedTemplates = [...(templates || []), newTemplate];

    doUpdateCreatorSettings(activeChannelClaim, { upload_templates: updatedTemplates });
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
          {__('Templates')}
          <Icon icon={ICONS.DOWN} />
        </MenuButton>
        <MenuList className="publish-template-menu__list">
          {sortedTemplates.length > 0 && (
            <>
              <div className="publish-template-menu__section-label">{__('Apply Template')}</div>
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
              if (e.key === 'Enter') handleSaveTemplate();
              if (e.key === 'Escape') closeSaveInput();
            }}
            autoFocus
          />
          <button
            type="button"
            className="publish-template-save__confirm"
            onClick={handleSaveTemplate}
            disabled={!templateName.trim()}
            title={__('Save')}
          >
            <Icon icon={ICONS.COMPLETE} />
          </button>
          <button type="button" className="publish-template-save__cancel" onClick={closeSaveInput} title={__('Cancel')}>
            <Icon icon={ICONS.REMOVE} />
          </button>
        </div>
      )}
    </div>
  );
}
