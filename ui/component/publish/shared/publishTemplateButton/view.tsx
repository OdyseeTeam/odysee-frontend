import React from 'react';
import classnames from 'classnames';
import { Menu, MenuButton, MenuList, MenuItem } from '@reach/menu-button';
import Icon from 'component/common/icon';
import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';
import { FormField } from 'component/common/form';
import { v4 as uuid } from 'uuid';
import { getUploadTemplatesFromSettings } from 'util/homepage-settings';
import { cloneDeep } from 'util/clone';
import './style.scss';
type TemplateEntry = UploadTemplate & {
  channelId: string;
  channelName: string;
};
type Props = {
  defaultChannelId: string | null | undefined;
  myChannelClaims: Array<ChannelClaim>;
  settingsByChannelId: Record<string, PerChannelSettings | null | undefined>;
  activeChannelClaim: ChannelClaim | null | undefined;
  publishFormValues: any;
  openModal: (arg0: string, arg1: {} | null | undefined) => void;
  fetchCreatorSettings: (arg0: string) => Promise<any> | any;
  updatePublishForm: (arg0: any) => void;
  doUpdateCreatorSettings: (arg0: ChannelClaim, arg1: any) => void;
  doToast: (arg0: { message: string; actionText?: string; action?: () => void; isError?: boolean }) => void;
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
const MAX_VISIBLE_TEMPLATES = 3;
const TEMPLATE_SEARCH_THRESHOLD = 6;
const DEFAULT_LICENSE_TYPE = 'None';
const DEFAULT_OTHER_LICENSE_DESCRIPTION = 'All rights reserved';
const DEFAULT_PAYWALL = 'free';
const DEFAULT_FEE = {
  amount: 1,
  currency: 'LBC',
};
const DEFAULT_FIAT_FEE = {
  amount: 1,
  currency: 'USD',
};
const DEFAULT_RENTAL_DURATION = {
  value: 1,
  unit: 'weeks',
};

function getTemplateSortTimestamp(template: { createdAt: number; lastUsedAt?: number }): number {
  return Number(template.lastUsedAt || template.createdAt || 0);
}

function getTemplateKey(channelId: string, templateId: string): string {
  return `${channelId}:${templateId}`;
}

function getTemplateSearchText(template: TemplateEntry): string {
  const data = template.data || {};
  const tags = Array.isArray(data.tags)
    ? data.tags
        .map((tag) => (tag && typeof tag === 'object' ? tag.name : tag))
        .filter(Boolean)
        .join(' ')
    : '';
  return `${template.name || ''} ${template.channelName || ''} ${data.title || ''} ${data.description || ''} ${tags}`
    .toLowerCase()
    .trim();
}

function normalizeTemplateValue(value: any): any {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeTemplateValue(item));
  }

  if (value && typeof value === 'object') {
    const normalized = {};
    Object.keys(value)
      .toSorted()
      .forEach((key) => {
        normalized[key] = normalizeTemplateValue(value[key]);
      });
    return normalized;
  }

  return value;
}

function areTemplateDataEqual(a: UploadTemplateData, b: UploadTemplateData): boolean {
  return JSON.stringify(normalizeTemplateValue(a || {})) === JSON.stringify(normalizeTemplateValue(b || {}));
}

function extractTemplateDataFromPublishForm(publishFormValues: any): UploadTemplateData {
  const data: any = {};
  TEMPLATE_FIELDS.forEach((field) => {
    const value = publishFormValues[field];
    const isEmptyArray = Array.isArray(value) && value.length === 0;
    const isEmptyObject =
      value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0;

    // Keep:
    // - all defined booleans (including 'false')
    // - all defined non-empty values
    if (value !== undefined && (typeof value === 'boolean' || (value !== '' && !isEmptyArray && !isEmptyObject))) {
      data[field] = cloneDeep(value);
    }
  });
  return data;
}

function getDefaultTemplateDataForComparison(publishFormValues: any): UploadTemplateData {
  const defaultLanguage = publishFormValues?.language || '';
  const defaultLanguages = Array.isArray(publishFormValues?.languages)
    ? publishFormValues.languages
    : defaultLanguage
      ? [defaultLanguage]
      : [];
  return {
    title: '',
    description: '',
    tags: [],
    thumbnail: '',
    language: defaultLanguage,
    languages: defaultLanguages,
    licenseType: DEFAULT_LICENSE_TYPE,
    licenseUrl: '',
    otherLicenseDescription: DEFAULT_OTHER_LICENSE_DESCRIPTION,
    nsfw: false,
    paywall: DEFAULT_PAYWALL,
    fee: DEFAULT_FEE,
    fiatPurchaseFee: DEFAULT_FIAT_FEE,
    fiatPurchaseEnabled: false,
    fiatRentalFee: DEFAULT_FIAT_FEE,
    fiatRentalExpiration: DEFAULT_RENTAL_DURATION,
    fiatRentalEnabled: false,
    visibility: 'public',
    memberRestrictionOn: false,
    memberRestrictionTierIds: [],
  };
}

export default function PublishTemplateButton(props: Props) {
  const {
    defaultChannelId,
    myChannelClaims,
    settingsByChannelId,
    activeChannelClaim,
    publishFormValues,
    openModal,
    fetchCreatorSettings,
    updatePublishForm,
    doUpdateCreatorSettings,
    doToast,
  } = props;
  const [showSaveInput, setShowSaveInput] = React.useState(false);
  const [templateName, setTemplateName] = React.useState('');
  const [templateInputName, setTemplateInputName] = React.useState(`template_name_${uuid()}`);
  const [showAllTemplates, setShowAllTemplates] = React.useState(false);
  const [templateSearchQuery, setTemplateSearchQuery] = React.useState('');
  const [selectedTemplateKey, setSelectedTemplateKey] = React.useState<string | null | undefined>(null);
  const [selectedTemplateBaselineData, setSelectedTemplateBaselineData] = React.useState<
    UploadTemplateData | null | undefined
  >(null);
  const [requestedSettingsByChannelId, setRequestedSettingsByChannelId] = React.useState<Record<string, boolean>>({});
  const [optimisticTemplatesByChannelId, setOptimisticTemplatesByChannelId] = React.useState<
    Record<string, Array<UploadTemplate>>
  >({});
  const previousSettingsByChannelIdRef = React.useRef<Record<string, PerChannelSettings | null | undefined>>(
    settingsByChannelId || {}
  );
  const orderedChannelClaims = React.useMemo((): Array<ChannelClaim> => {
    const seenById = {};
    const channels = [];
    (myChannelClaims || []).forEach((channelClaim) => {
      if (!channelClaim || !channelClaim.claim_id || seenById[channelClaim.claim_id]) {
        return;
      }

      seenById[channelClaim.claim_id] = true;
      channels.push(channelClaim);
    });
    channels.sort((a, b) => {
      const aIsDefault = a.claim_id === defaultChannelId;
      const bIsDefault = b.claim_id === defaultChannelId;
      if (aIsDefault && !bIsDefault) return -1;
      if (bIsDefault && !aIsDefault) return 1;
      return (a.name || '').localeCompare(b.name || '');
    });
    return channels;
  }, [myChannelClaims, defaultChannelId]);
  const getTemplatesForChannelId = React.useCallback(
    (channelId: string | null | undefined): Array<UploadTemplate> => {
      if (!channelId) return [];
      const optimisticTemplates = optimisticTemplatesByChannelId[channelId];

      if (optimisticTemplates) {
        return optimisticTemplates;
      }

      const channelSettings = settingsByChannelId && settingsByChannelId[channelId];
      return getUploadTemplatesFromSettings(channelSettings);
    },
    [optimisticTemplatesByChannelId, settingsByChannelId]
  );
  const ensureChannelSettingsLoaded = React.useCallback(
    (channelId: string | null | undefined) => {
      if (!channelId) return;
      if (settingsByChannelId && settingsByChannelId[channelId]) return;
      if (requestedSettingsByChannelId[channelId]) return;
      setRequestedSettingsByChannelId((prev) => ({ ...prev, [channelId]: true }));
      const maybePromise = fetchCreatorSettings(channelId);

      if (maybePromise && typeof maybePromise.catch === 'function') {
        maybePromise.catch(() => {});
      }
    },
    [fetchCreatorSettings, requestedSettingsByChannelId, settingsByChannelId]
  );
  React.useEffect(() => {
    orderedChannelClaims.forEach((channelClaim) => {
      ensureChannelSettingsLoaded(channelClaim.claim_id);
    });
  }, [orderedChannelClaims, ensureChannelSettingsLoaded]);
  React.useEffect(() => {
    const optimisticChannelIds = Object.keys(optimisticTemplatesByChannelId);
    const currentSettingsByChannelId = settingsByChannelId || {};
    const previousSettingsByChannelId = previousSettingsByChannelIdRef.current || {};

    if (optimisticChannelIds.length === 0) {
      previousSettingsByChannelIdRef.current = currentSettingsByChannelId;
      return;
    }

    setOptimisticTemplatesByChannelId((previousOptimisticTemplates) => {
      const nextOptimisticTemplates = { ...previousOptimisticTemplates };
      let removedAny = false;
      optimisticChannelIds.forEach((channelId) => {
        const currentSettings = currentSettingsByChannelId[channelId];
        const previousSettings = previousSettingsByChannelId[channelId];
        const becameAvailable = !previousSettings && Boolean(currentSettings);
        const changed = Boolean(currentSettings) && currentSettings !== previousSettings;

        if (becameAvailable || changed) {
          delete nextOptimisticTemplates[channelId];
          removedAny = true;
        }
      });
      return removedAny ? nextOptimisticTemplates : previousOptimisticTemplates;
    });
    previousSettingsByChannelIdRef.current = currentSettingsByChannelId;
  }, [settingsByChannelId, optimisticTemplatesByChannelId]);
  const allTemplates = React.useMemo((): Array<TemplateEntry> => {
    const entries = [];
    orderedChannelClaims.forEach((channelClaim) => {
      const channelTemplates = getTemplatesForChannelId(channelClaim.claim_id);
      channelTemplates.forEach((template) => {
        entries.push({
          ...template,
          channelId: channelClaim.claim_id,
          channelName: channelClaim.name || channelClaim.claim_id,
        });
      });
    });
    return entries;
  }, [orderedChannelClaims, getTemplatesForChannelId]);
  const sortedTemplates = React.useMemo(
    () =>
      [...allTemplates].toSorted((a, b) => {
        const pinnedDiff = Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned));
        if (pinnedDiff !== 0) return pinnedDiff;
        const byLastUsed = getTemplateSortTimestamp(b) - getTemplateSortTimestamp(a);
        if (byLastUsed !== 0) return byLastUsed;
        const byCreated = Number(b.createdAt || 0) - Number(a.createdAt || 0);
        if (byCreated !== 0) return byCreated;
        return (a.name || '').localeCompare(b.name || '');
      }),
    [allTemplates]
  );
  const normalizedTemplateSearch = templateSearchQuery.trim().toLowerCase();
  const filteredTemplates = React.useMemo(
    () =>
      normalizedTemplateSearch
        ? sortedTemplates.filter((template) => getTemplateSearchText(template).includes(normalizedTemplateSearch))
        : sortedTemplates,
    [sortedTemplates, normalizedTemplateSearch]
  );
  const pinnedTemplates = React.useMemo(
    () => filteredTemplates.filter((template) => Boolean(template.isPinned)),
    [filteredTemplates]
  );
  const recentTemplates = React.useMemo(
    () => filteredTemplates.filter((template) => !template.isPinned),
    [filteredTemplates]
  );
  const shouldShowTemplateSearch = sortedTemplates.length > TEMPLATE_SEARCH_THRESHOLD;
  const showAllRecentTemplates = showAllTemplates || Boolean(normalizedTemplateSearch);
  const visibleRecentTemplates = React.useMemo(
    () => (showAllRecentTemplates ? recentTemplates : recentTemplates.slice(0, MAX_VISIBLE_TEMPLATES)),
    [showAllRecentTemplates, recentTemplates]
  );
  const hiddenTemplateCount = Math.max(0, recentTemplates.length - visibleRecentTemplates.length);
  const selectedTemplate = React.useMemo(
    () => sortedTemplates.find((template) => getTemplateKey(template.channelId, template.id) === selectedTemplateKey),
    [sortedTemplates, selectedTemplateKey]
  );
  const saveTargetChannelId =
    publishFormValues.channelId || defaultChannelId || (activeChannelClaim && activeChannelClaim.claim_id);
  const saveTargetChannelClaim =
    orderedChannelClaims.find((channelClaim) => channelClaim.claim_id === saveTargetChannelId) || activeChannelClaim;

  const saveTargetChannelName = (saveTargetChannelClaim && saveTargetChannelClaim.name) || __('Current channel');

  const existingTemplateByNameForSave = React.useMemo(() => {
    if (!saveTargetChannelClaim || !templateName.trim()) return null;
    const normalizedTemplateName = templateName.trim().toLowerCase();
    const saveTargetTemplates = getTemplatesForChannelId(saveTargetChannelClaim.claim_id);
    return saveTargetTemplates.find((template) => template.name.toLowerCase() === normalizedTemplateName) || null;
  }, [templateName, saveTargetChannelClaim, getTemplatesForChannelId]);
  const currentTemplateData = React.useMemo(
    () => extractTemplateDataFromPublishForm(publishFormValues),
    [publishFormValues]
  );
  const hasPublishFormTemplateChanges = React.useMemo(() => {
    const defaultTemplateData = extractTemplateDataFromPublishForm(
      getDefaultTemplateDataForComparison(publishFormValues)
    );
    return !areTemplateDataEqual(currentTemplateData, defaultTemplateData);
  }, [publishFormValues, currentTemplateData]);
  const canUpdateSelectedTemplate = React.useMemo(() => {
    if (!selectedTemplate || !selectedTemplateBaselineData || Object.keys(currentTemplateData).length === 0) {
      return false;
    }

    return !areTemplateDataEqual(selectedTemplateBaselineData, currentTemplateData);
  }, [selectedTemplate, selectedTemplateBaselineData, currentTemplateData]);
  React.useEffect(() => {
    if (!selectedTemplateKey) return;
    const selectedTemplateStillExists = sortedTemplates.some(
      (template) => getTemplateKey(template.channelId, template.id) === selectedTemplateKey
    );

    if (!selectedTemplateStillExists) {
      setSelectedTemplateKey(null);
      setSelectedTemplateBaselineData(null);
    }
  }, [selectedTemplateKey, sortedTemplates]);

  function closeSaveInput() {
    setShowSaveInput(false);
    setTemplateName('');
  }

  function openSaveInput() {
    // Use a fresh name each open to reduce browser autocomplete matching.
    setTemplateInputName(`template_name_${uuid()}`);
    setShowSaveInput(true);
  }

  function persistTemplatesForChannel(
    channelClaim: ChannelClaim | null | undefined,
    templatesToSave: Array<UploadTemplate>
  ) {
    if (!channelClaim || !channelClaim.claim_id) return;
    const channelId = channelClaim.claim_id;
    setOptimisticTemplatesByChannelId((prev) => ({ ...prev, [channelId]: templatesToSave }));
    doUpdateCreatorSettings(channelClaim, {
      upload_templates: templatesToSave,
    });
  }

  function handleSaveTemplate() {
    if (!saveTargetChannelClaim || !templateName.trim()) return;
    const normalizedTemplateName = templateName.trim();
    const templateData = extractTemplateDataFromPublishForm(publishFormValues);

    if (Object.keys(templateData).length === 0) {
      doToast({
        message: __('Cannot save an empty template.'),
        isError: true,
      });
      return;
    }

    const now = Date.now();
    const saveTargetTemplates = getTemplatesForChannelId(saveTargetChannelClaim.claim_id);

    if (existingTemplateByNameForSave) {
      const updatedTemplates = saveTargetTemplates.map((template) =>
        template.id === existingTemplateByNameForSave.id
          ? { ...template, name: normalizedTemplateName, data: templateData, lastUsedAt: now }
          : template
      );
      persistTemplatesForChannel(saveTargetChannelClaim, updatedTemplates);
      doToast({
        message: __('Template "%name%" updated', {
          name: normalizedTemplateName,
        }),
      });
      closeSaveInput();
      return;
    }

    const newTemplate: UploadTemplate = {
      id: uuid(),
      name: normalizedTemplateName,
      createdAt: now,
      isPinned: false,
      data: templateData,
    };
    const updatedTemplates = [...saveTargetTemplates, newTemplate];
    persistTemplatesForChannel(saveTargetChannelClaim, updatedTemplates);
    doToast({
      message: __('Template "%name%" saved', {
        name: newTemplate.name,
      }),
    });
    closeSaveInput();
  }

  function handleApplyTemplate(template: TemplateEntry) {
    if (!template.data) return;
    const undoData = {};
    Object.keys(template.data).forEach((fieldKey) => {
      undoData[fieldKey] = cloneDeep(publishFormValues[fieldKey]);
    });
    const currentDataBeforeApply = extractTemplateDataFromPublishForm(publishFormValues);
    updatePublishForm({ ...template.data });
    setSelectedTemplateKey(getTemplateKey(template.channelId, template.id));
    setSelectedTemplateBaselineData({ ...currentDataBeforeApply, ...template.data });
    const ownerChannelClaim = orderedChannelClaims.find((channelClaim) => channelClaim.claim_id === template.channelId);
    const ownerChannelTemplates = getTemplatesForChannelId(template.channelId);

    if (ownerChannelClaim) {
      const now = Date.now();
      const updatedTemplates = ownerChannelTemplates.map((existingTemplate) =>
        existingTemplate.id === template.id ? { ...existingTemplate, lastUsedAt: now } : existingTemplate
      );
      persistTemplatesForChannel(ownerChannelClaim, updatedTemplates);
    }

    doToast({
      message: __('Template "%name%" applied', {
        name: template.name,
      }),
      actionText: __('Undo'),
      action: () => updatePublishForm(undoData),
    });
  }

  function handleToggleTemplatePin(template: TemplateEntry) {
    const ownerChannelClaim = orderedChannelClaims.find((channelClaim) => channelClaim.claim_id === template.channelId);

    if (!ownerChannelClaim) {
      doToast({
        message: __('Unable to find template owner channel.'),
        isError: true,
      });
      return;
    }

    const ownerChannelTemplates = getTemplatesForChannelId(template.channelId);
    const updatedTemplates = ownerChannelTemplates.map((existingTemplate) =>
      existingTemplate.id === template.id
        ? { ...existingTemplate, isPinned: !existingTemplate.isPinned }
        : existingTemplate
    );
    persistTemplatesForChannel(ownerChannelClaim, updatedTemplates);
    doToast({
      message: template.isPinned
        ? __('Template "%name%" unpinned', {
            name: template.name,
          })
        : __('Template "%name%" pinned', {
            name: template.name,
          }),
    });
  }

  function handleUpdateSelectedTemplate() {
    if (!selectedTemplate || !canUpdateSelectedTemplate) return;
    openModal(MODALS.CONFIRM, {
      title: __('Update template "%name%"?', {
        name: selectedTemplate.name,
      }),
      subtitle: __('Replace this template with the current publish form values.'),
      labelOk: __('Update Template'),
      onConfirm: (closeModal) => {
        const ownerChannelClaim = orderedChannelClaims.find(
          (channelClaim) => channelClaim.claim_id === selectedTemplate.channelId
        );

        if (!ownerChannelClaim) {
          doToast({
            message: __('Unable to find template owner channel.'),
            isError: true,
          });
          closeModal();
          return;
        }

        const templateData = extractTemplateDataFromPublishForm(publishFormValues);

        if (Object.keys(templateData).length === 0) {
          doToast({
            message: __('Cannot update with an empty publish form.'),
            isError: true,
          });
          closeModal();
          return;
        }

        const now = Date.now();
        const ownerChannelTemplates = getTemplatesForChannelId(selectedTemplate.channelId);
        const updatedTemplates = ownerChannelTemplates.map((template) =>
          template.id === selectedTemplate.id ? { ...template, data: templateData, lastUsedAt: now } : template
        );
        persistTemplatesForChannel(ownerChannelClaim, updatedTemplates);
        setSelectedTemplateBaselineData(templateData);
        doToast({
          message: __('Template "%name%" updated', {
            name: selectedTemplate.name,
          }),
        });
        closeModal();
      },
    });
  }

  function handleManageTemplates() {
    openModal(MODALS.MANAGE_UPLOAD_TEMPLATES);
  }

  function renderTemplateMenuItem(template: TemplateEntry) {
    return (
      <MenuItem
        key={getTemplateKey(template.channelId, template.id)}
        className="publish-template-menu__item"
        onSelect={() => handleApplyTemplate(template)}
      >
        <div className="menu__link publish-template-menu__template-link">
          <Icon aria-hidden icon={template.isPinned ? ICONS.PIN : ICONS.STACK} />
          <span className="publish-template-menu__template-name">{template.name}</span>
          <span className="publish-template-menu__template-meta">{template.channelName}</span>
        </div>
      </MenuItem>
    );
  }

  if (!activeChannelClaim) return null;
  return (
    <div className="publish-template-wrapper">
      <Menu>
        <MenuButton className="button publish-template-menu-button">
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

          {shouldShowTemplateSearch && (
            <div
              className="publish-template-menu__search"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <Icon icon={ICONS.SEARCH} />
              <input
                type="text"
                name="upload_template_menu_search"
                value={templateSearchQuery}
                placeholder={__('Search templates...')}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                onChange={(e) => setTemplateSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
          )}

          {filteredTemplates.length > 0 ? (
            <>
              {pinnedTemplates.length > 0 && <>{pinnedTemplates.map((template) => renderTemplateMenuItem(template))}</>}

              {recentTemplates.length > 0 && (
                <>{visibleRecentTemplates.map((template) => renderTemplateMenuItem(template))}</>
              )}

              {!showAllRecentTemplates && hiddenTemplateCount > 0 && !normalizedTemplateSearch && (
                <MenuItem className="publish-template-menu__item" onSelect={() => setShowAllTemplates(true)}>
                  <div className="menu__link">
                    <Icon aria-hidden icon={ICONS.DOWN} />
                    {__('Show %count% more recent...', {
                      count: hiddenTemplateCount,
                    })}
                  </div>
                </MenuItem>
              )}

              {showAllTemplates && !normalizedTemplateSearch && recentTemplates.length > MAX_VISIBLE_TEMPLATES && (
                <MenuItem className="publish-template-menu__item" onSelect={() => setShowAllTemplates(false)}>
                  <div className="menu__link">
                    <Icon aria-hidden icon={ICONS.UP} />
                    {__('Show fewer')}
                  </div>
                </MenuItem>
              )}
            </>
          ) : (
            <div className="publish-template-menu__empty">
              {normalizedTemplateSearch
                ? __('No templates match your search.')
                : __('No templates found across your channels.')}
            </div>
          )}

          <hr className="publish-template-menu__separator" />

          <MenuItem
            className={classnames('publish-template-menu__item', {
              'publish-template-menu__item--disabled': !hasPublishFormTemplateChanges,
            })}
            onSelect={() => hasPublishFormTemplateChanges && openSaveInput()}
            disabled={!hasPublishFormTemplateChanges}
          >
            <div className="menu__link">
              <Icon aria-hidden icon={ICONS.ADD} />
              {__('Save Current as Template')}
            </div>
          </MenuItem>

          {canUpdateSelectedTemplate && selectedTemplate && (
            <MenuItem className="publish-template-menu__item" onSelect={handleUpdateSelectedTemplate}>
              <div className="menu__link">
                <Icon aria-hidden icon={ICONS.REFRESH} />
                {__('Update Selected Template')}
              </div>
            </MenuItem>
          )}

          {selectedTemplate && (
            <MenuItem
              className="publish-template-menu__item"
              onSelect={() => handleToggleTemplatePin(selectedTemplate)}
            >
              <div className="menu__link">
                <Icon aria-hidden icon={ICONS.PIN} />
                {selectedTemplate.isPinned ? __('Unpin Selected Template') : __('Pin Selected Template')}
              </div>
            </MenuItem>
          )}

          <MenuItem className="publish-template-menu__item" onSelect={handleManageTemplates}>
            <div className="menu__link">
              <Icon aria-hidden icon={ICONS.SETTINGS} />
              {__('Manage Templates')}
            </div>
          </MenuItem>
        </MenuList>
      </Menu>

      {showSaveInput && (
        <div className="publish-template-save">
          <div className="publish-template-save__input-row">
            <FormField
              type="search"
              name={templateInputName}
              placeholder={__('Template name...')}
              value={templateName}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-autocomplete="none"
              data-lpignore="true"
              data-1p-ignore="true"
              data-bwignore="true"
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
          </div>
          <div className="publish-template-save__action-row">
            <button
              type="button"
              className="publish-template-save__confirm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSaveTemplate();
              }}
              disabled={!templateName.trim()}
            >
              {__('Save')}
            </button>
            <button
              type="button"
              className="publish-template-save__cancel"
              onClick={(e) => {
                e.stopPropagation();
                closeSaveInput();
              }}
            >
              {__('Cancel')}
            </button>
          </div>
          <span className="publish-template-save__target">
            {__('Saving to %channel%', {
              channel: saveTargetChannelName,
            })}
          </span>
          {existingTemplateByNameForSave && (
            <span className="publish-template-save__overwrite-hint">
              {__('Template exists. Saving will update it.')}
            </span>
          )}
          <span className="publish-template-save__warning">
            {__('Template data is public. Do not include private information.')}
          </span>
        </div>
      )}
    </div>
  );
}
