// @flow
import React from 'react';
import { v4 as uuid } from 'uuid';
import { Modal } from 'modal/modal';
import Card from 'component/common/card';
import Button from 'component/button';
import { FormField } from 'component/common/form';
import Icon from 'component/common/icon';
import * as ICONS from 'constants/icons';
import { getUploadTemplatesFromSettings } from 'util/homepage-settings';
import { cloneDeep } from 'util/clone';
import './style.scss';

type TemplateEntry = UploadTemplate & {
  channelId: string,
  channelName: string,
};

type Props = {
  defaultChannelId: ?string,
  myChannelClaims: Array<ChannelClaim>,
  settingsByChannelId: { [string]: ?PerChannelSettings },
  fetchCreatorSettings: (string) => Promise<any> | any,
  updatePublishForm: (any) => void,
  doUpdateCreatorSettings: (ChannelClaim, any) => void,
  doToast: ({ message: string, isError?: boolean }) => void,
  doHideModal: () => void,
};
const TEMPLATE_SEARCH_THRESHOLD = 6;

function makeDuplicateTemplateName(name: string, existingTemplates: Array<UploadTemplate>): string {
  const baseName = (name || __('Template')).trim();
  const existingNames = new Set(existingTemplates.map((template) => template.name.toLowerCase()));
  const copyLabel = __('Copy');

  let candidate = `${baseName} (${copyLabel})`;
  let suffix = 2;
  while (existingNames.has(candidate.toLowerCase())) {
    candidate = `${baseName} (${copyLabel} ${suffix})`;
    suffix += 1;
  }

  return candidate;
}

function getTemplateSortTimestamp(template: { createdAt: number, lastUsedAt?: number }): number {
  return Number(template.lastUsedAt || template.createdAt || 0);
}

function getTemplateFingerprint(template: UploadTemplate): string {
  return `${template.id}|${template.name}|${Number(template.createdAt || 0)}|${Number(template.lastUsedAt || 0)}|${
    template.isPinned ? 1 : 0
  }|${JSON.stringify(template.data || {})}`;
}

function areTemplateArraysEqual(a: Array<UploadTemplate>, b: Array<UploadTemplate>): boolean {
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    if (getTemplateFingerprint(a[i]) !== getTemplateFingerprint(b[i])) {
      return false;
    }
  }

  return true;
}

function getTemplateKey(channelId: string, templateId: string): string {
  return `${channelId}:${templateId}`;
}

function getDateLabel(timestamp: ?number): string {
  const time = Number(timestamp || 0);
  if (!time) return __('Unknown');

  const date = new Date(time);
  return Number.isNaN(date.getTime()) ? __('Unknown') : date.toLocaleDateString();
}

function truncatePreviewValue(value: string, maxLength: number = 40): string {
  if (!value) return '';
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 3)}...`;
}

function formatPrice(price: any): string {
  if (!price || typeof price !== 'object') return '';
  if (price.amount && price.currency) {
    return `${price.amount} ${price.currency}`;
  }
  return '';
}

function getNormalizedPaywall(paywall: any): string {
  return typeof paywall === 'string' ? paywall.trim().toLowerCase() : '';
}

function hasEnabledPriceDetails(templateData: UploadTemplateData): boolean {
  const data = templateData || {};
  const normalizedPaywall = getNormalizedPaywall(data.paywall);

  const hasSdkPrice = Number(data?.fee?.amount || 0) > 0;
  const hasFiatPurchase = Boolean(data.fiatPurchaseEnabled && Number(data?.fiatPurchaseFee?.amount || 0) > 0);
  const hasFiatRental = Boolean(data.fiatRentalEnabled && Number(data?.fiatRentalFee?.amount || 0) > 0);

  if (normalizedPaywall === 'sdk') return hasSdkPrice;
  if (normalizedPaywall === 'fiat') return hasFiatPurchase || hasFiatRental;

  // Backward-compatibility for older templates that may not have saved `paywall`.
  if (!normalizedPaywall) {
    return hasSdkPrice || hasFiatPurchase || hasFiatRental;
  }

  return false;
}

function getTagsLabel(tags: any): string {
  if (!Array.isArray(tags) || tags.length === 0) return '';
  return tags
    .map((tag) => {
      if (typeof tag === 'string') return tag;
      if (tag && typeof tag === 'object' && typeof tag.name === 'string') return tag.name;
      return '';
    })
    .filter(Boolean)
    .join(', ');
}

function getTemplatePreviewFields(templateData: UploadTemplateData): Array<{ label: string, value: string }> {
  const data = templateData || {};
  const fields = [];

  if (data.title) fields.push({ label: __('Title'), value: String(data.title) });
  if (data.description) fields.push({ label: __('Description'), value: String(data.description) });

  const tagsLabel = getTagsLabel(data.tags);
  if (tagsLabel) fields.push({ label: __('Tags'), value: tagsLabel });

  if (data.language) {
    fields.push({ label: __('Language'), value: String(data.language) });
  } else {
    const languages = data.languages;
    if (languages && Array.isArray(languages) && languages.length > 0) {
      fields.push({ label: __('Languages'), value: languages.join(', ') });
    }
  }

  if (data.visibility) fields.push({ label: __('Visibility'), value: String(data.visibility) });
  if (data.nsfw === true) fields.push({ label: __('Mature'), value: __('Yes') });
  if (data.licenseType) fields.push({ label: __('License'), value: String(data.licenseType) });

  const normalizedPaywall = getNormalizedPaywall(data.paywall);
  const shouldShowPriceDetails = hasEnabledPriceDetails(data);
  if (shouldShowPriceDetails) {
    const feeLabel = formatPrice(data.fee);
    if (feeLabel && (normalizedPaywall === 'sdk' || !normalizedPaywall)) {
      fields.push({ label: __('Price'), value: feeLabel });
    }

    if (normalizedPaywall && normalizedPaywall !== 'free') {
      fields.push({ label: __('Paywall'), value: String(data.paywall) });
    }
  }

  if (typeof data.memberRestrictionOn === 'boolean') {
    fields.push({ label: __('Members'), value: data.memberRestrictionOn ? __('Restricted') : __('Off') });
  }

  if (data.thumbnail) fields.push({ label: __('Thumbnail'), value: __('Set') });

  return fields;
}

function getTemplateSearchText(template: TemplateEntry): string {
  const previewFieldValues = getTemplatePreviewFields(template.data || {})
    .map((field) => field.value)
    .join(' ');

  return `${template.name || ''} ${template.channelName || ''} ${previewFieldValues}`.toLowerCase();
}

export default function ModalUploadTemplates(props: Props) {
  const {
    defaultChannelId,
    myChannelClaims,
    settingsByChannelId,
    fetchCreatorSettings,
    updatePublishForm,
    doUpdateCreatorSettings,
    doToast,
    doHideModal,
  } = props;

  const [requestedSettingsByChannelId, setRequestedSettingsByChannelId] = React.useState<{ [string]: boolean }>({});
  const [editingTemplateKey, setEditingTemplateKey] = React.useState<?string>(null);
  const [editName, setEditName] = React.useState('');
  const [editInputName, setEditInputName] = React.useState(`rename_template_${uuid()}`);
  const [expandedPreviewByTemplateKey, setExpandedPreviewByTemplateKey] = React.useState<{ [string]: boolean }>({});
  const [searchQuery, setSearchQuery] = React.useState('');
  const [hasLocalEdits, setHasLocalEdits] = React.useState(false);

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

  const channelClaimById = React.useMemo(() => {
    const map = {};
    orderedChannelClaims.forEach((channelClaim) => {
      map[channelClaim.claim_id] = channelClaim;
    });
    return map;
  }, [orderedChannelClaims]);

  const sourceTemplatesByChannelId = React.useMemo(() => {
    const nextTemplatesByChannelId = {};

    orderedChannelClaims.forEach((channelClaim) => {
      const channelId = channelClaim.claim_id;
      nextTemplatesByChannelId[channelId] = getUploadTemplatesFromSettings(
        settingsByChannelId && settingsByChannelId[channelId]
      );
    });

    return nextTemplatesByChannelId;
  }, [orderedChannelClaims, settingsByChannelId]);

  const [templatesByChannelId, setTemplatesByChannelId] = React.useState<{ [string]: Array<UploadTemplate> }>(
    sourceTemplatesByChannelId
  );

  const ensureChannelSettingsLoaded = React.useCallback(
    (channelId: ?string) => {
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
    if (!hasLocalEdits) {
      setTemplatesByChannelId(sourceTemplatesByChannelId);
    }
  }, [sourceTemplatesByChannelId, hasLocalEdits]);

  const allTemplateEntries = React.useMemo((): Array<TemplateEntry> => {
    const entries = [];

    orderedChannelClaims.forEach((channelClaim) => {
      const channelTemplates = templatesByChannelId[channelClaim.claim_id] || [];
      channelTemplates.forEach((template) => {
        entries.push({
          ...template,
          channelId: channelClaim.claim_id,
          channelName: channelClaim.name || channelClaim.claim_id,
        });
      });
    });

    return entries;
  }, [orderedChannelClaims, templatesByChannelId]);

  const sortedTemplates = React.useMemo(
    () =>
      [...allTemplateEntries].sort((a, b) => {
        const pinnedDiff = Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned));
        if (pinnedDiff !== 0) return pinnedDiff;

        const byLastUsed = getTemplateSortTimestamp(b) - getTemplateSortTimestamp(a);
        if (byLastUsed !== 0) return byLastUsed;

        const byCreated = Number(b.createdAt || 0) - Number(a.createdAt || 0);
        if (byCreated !== 0) return byCreated;

        return (a.name || '').localeCompare(b.name || '');
      }),
    [allTemplateEntries]
  );

  const changedChannelIds = React.useMemo(
    () =>
      orderedChannelClaims
        .map((channelClaim) => channelClaim.claim_id)
        .filter((channelId) => {
          const currentTemplates = templatesByChannelId[channelId] || [];
          const sourceTemplates = sourceTemplatesByChannelId[channelId] || [];
          return !areTemplateArraysEqual(currentTemplates, sourceTemplates);
        }),
    [orderedChannelClaims, sourceTemplatesByChannelId, templatesByChannelId]
  );

  const hasChanges = changedChannelIds.length > 0;
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const shouldShowSearch = sortedTemplates.length > TEMPLATE_SEARCH_THRESHOLD;
  const filteredTemplates = React.useMemo(
    () =>
      normalizedSearchQuery
        ? sortedTemplates.filter((template) => getTemplateSearchText(template).includes(normalizedSearchQuery))
        : sortedTemplates,
    [sortedTemplates, normalizedSearchQuery]
  );

  React.useEffect(() => {
    const templateKeys = new Set(sortedTemplates.map((template) => getTemplateKey(template.channelId, template.id)));
    setExpandedPreviewByTemplateKey((prev) => {
      const next = {};
      Object.keys(prev).forEach((templateKey) => {
        if (templateKeys.has(templateKey) && prev[templateKey]) {
          next[templateKey] = true;
        }
      });
      return next;
    });
  }, [sortedTemplates]);

  function markEdited() {
    if (!hasLocalEdits) {
      setHasLocalEdits(true);
    }
  }

  function updateTemplatesForChannel(channelId: string, updater: (Array<UploadTemplate>) => Array<UploadTemplate>) {
    markEdited();
    setTemplatesByChannelId((prevTemplatesByChannelId) => {
      const existingTemplates = prevTemplatesByChannelId[channelId] || [];
      const updatedTemplates = updater(existingTemplates);

      if (updatedTemplates === existingTemplates) {
        return prevTemplatesByChannelId;
      }

      return {
        ...prevTemplatesByChannelId,
        [channelId]: updatedTemplates,
      };
    });
  }

  function closeEditor() {
    setEditingTemplateKey(null);
    setEditName('');
  }

  function togglePreview(templateKey: string) {
    setExpandedPreviewByTemplateKey((prev) => ({
      ...prev,
      [templateKey]: !prev[templateKey],
    }));
  }

  function handleStartRename(template: TemplateEntry) {
    setEditInputName(`rename_template_${uuid()}`);
    setEditingTemplateKey(getTemplateKey(template.channelId, template.id));
    setEditName(template.name);
  }

  function handleDelete(template: TemplateEntry) {
    updateTemplatesForChannel(template.channelId, (channelTemplates) =>
      channelTemplates.filter((existingTemplate) => existingTemplate.id !== template.id)
    );

    if (editingTemplateKey === getTemplateKey(template.channelId, template.id)) {
      closeEditor();
    }
  }

  function handleTogglePin(template: TemplateEntry) {
    updateTemplatesForChannel(template.channelId, (channelTemplates) =>
      channelTemplates.map((existingTemplate) =>
        existingTemplate.id === template.id
          ? {
              ...existingTemplate,
              isPinned: !existingTemplate.isPinned,
            }
          : existingTemplate
      )
    );

    doToast({
      message: template.isPinned
        ? __('Template "%name%" unpinned', { name: template.name })
        : __('Template "%name%" pinned', { name: template.name }),
    });
  }

  function handleDuplicate(template: TemplateEntry) {
    const channelTemplates = templatesByChannelId[template.channelId] || [];
    const createdName = makeDuplicateTemplateName(template.name, channelTemplates);
    const duplicateTemplate: UploadTemplate = {
      ...template,
      id: uuid(),
      name: createdName,
      createdAt: Date.now(),
      lastUsedAt: undefined,
      isPinned: false,
      data: cloneDeep(template.data || {}),
    };

    updateTemplatesForChannel(template.channelId, (existingTemplates) => [duplicateTemplate, ...existingTemplates]);
    doToast({ message: __('Template "%name%" duplicated', { name: createdName }) });
  }

  function handleConfirmRename(template: TemplateEntry) {
    const normalizedName = editName.trim();
    if (!normalizedName) return;

    const duplicateTemplate = (templatesByChannelId[template.channelId] || []).find(
      (existingTemplate) =>
        existingTemplate.id !== template.id && existingTemplate.name.toLowerCase() === normalizedName.toLowerCase()
    );

    if (duplicateTemplate) {
      doToast({
        message: __('A template named "%name%" already exists in this channel.', { name: normalizedName }),
        isError: true,
      });
      return;
    }

    updateTemplatesForChannel(template.channelId, (channelTemplates) =>
      channelTemplates.map((existingTemplate) =>
        existingTemplate.id === template.id
          ? {
              ...existingTemplate,
              name: normalizedName,
            }
          : existingTemplate
      )
    );

    closeEditor();
  }

  function handlePrefillNow(template: TemplateEntry) {
    if (!template.data || Object.keys(template.data).length === 0) {
      doToast({ message: __('This template has no prefill data.'), isError: true });
      return;
    }

    updatePublishForm({ ...template.data });

    doToast({ message: __('Template "%name%" prefilled', { name: template.name }) });
  }

  function handleSave() {
    if (!hasChanges) {
      doHideModal();
      return;
    }

    let savedChannelCount = 0;
    changedChannelIds.forEach((channelId) => {
      const channelClaim = channelClaimById[channelId];
      if (!channelClaim) return;

      savedChannelCount += 1;
      doUpdateCreatorSettings(channelClaim, {
        upload_templates: templatesByChannelId[channelId] || [],
      });
    });

    if (savedChannelCount === 0) {
      doToast({ message: __('Unable to save template changes.'), isError: true });
      return;
    }

    if (savedChannelCount === 1) {
      doToast({ message: __('Upload templates updated') });
    } else {
      doToast({ message: __('Upload templates updated for %count% channels', { count: savedChannelCount }) });
    }

    doHideModal();
  }

  return (
    <Modal isOpen type="custom" width="wide" onAborted={doHideModal}>
      <Card
        title={__('Manage Upload Templates')}
        subtitle={__('Preview what each template fills, prefill instantly, or rename and delete templates.')}
        body={
          <div className="upload-templates-manage">
            {shouldShowSearch && (
              <div className="upload-templates-manage__search">
                <FormField
                  type="text"
                  name="upload_template_search"
                  value={searchQuery}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  placeholder={__('Search templates...')}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {normalizedSearchQuery && (
                  <div className="upload-templates-manage__search-count">
                    {__('%count% results', { count: filteredTemplates.length })}
                  </div>
                )}
              </div>
            )}

            {sortedTemplates.length === 0 ? (
              <div className="main--empty">{__('No templates saved yet.')}</div>
            ) : filteredTemplates.length === 0 ? (
              <div className="main--empty">{__('No templates match your search.')}</div>
            ) : (
              <div className="upload-templates-manage__list">
                {filteredTemplates.map((template) => {
                  const templateKey = getTemplateKey(template.channelId, template.id);
                  const isEditing = editingTemplateKey === templateKey;
                  const isPreviewExpanded = Boolean(expandedPreviewByTemplateKey[templateKey]);
                  const previewFields = getTemplatePreviewFields(template.data || {});
                  const visiblePreviewFields = previewFields.slice(0, 5);
                  const hiddenPreviewFieldCount = Math.max(0, previewFields.length - visiblePreviewFields.length);

                  return (
                    <div key={templateKey} className="upload-templates-manage__item">
                      {isEditing ? (
                        <div className="upload-templates-manage__edit-row">
                          <FormField
                            type="text"
                            name={editInputName}
                            value={editName}
                            autoComplete="new-password"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck={false}
                            aria-autocomplete="none"
                            data-lpignore="true"
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                e.stopPropagation();
                                handleConfirmRename(template);
                              }

                              if (e.key === 'Escape') {
                                e.preventDefault();
                                e.stopPropagation();
                                closeEditor();
                              }
                            }}
                            autoFocus
                          />
                          <button
                            type="button"
                            className="upload-templates-manage__action-btn"
                            onClick={() => handleConfirmRename(template)}
                            disabled={!editName.trim()}
                            title={__('Save name')}
                          >
                            <Icon icon={ICONS.COMPLETE} />
                          </button>
                          <button
                            type="button"
                            className="upload-templates-manage__action-btn"
                            onClick={closeEditor}
                            title={__('Cancel')}
                          >
                            <Icon icon={ICONS.REMOVE} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="upload-templates-manage__display-row">
                            <div className="upload-templates-manage__info">
                              <Icon icon={ICONS.STACK} />
                              <div className="upload-templates-manage__text">
                                <div className="upload-templates-manage__name-row">
                                  <span className="upload-templates-manage__name">{template.name}</span>
                                  {template.isPinned && (
                                    <span className="upload-templates-manage__pinned">
                                      <Icon icon={ICONS.PIN} />
                                      {__('Pinned')}
                                    </span>
                                  )}
                                </div>
                                <div className="upload-templates-manage__meta">
                                  <span>{template.channelName}</span>
                                  <span>{__('Created %date%', { date: getDateLabel(template.createdAt) })}</span>
                                  <span>
                                    {template.lastUsedAt
                                      ? __('Last used %date%', { date: getDateLabel(template.lastUsedAt) })
                                      : __('Never used')}
                                  </span>
                                </div>
                                {!isPreviewExpanded && (
                                  <div className="upload-templates-manage__preview-summary">
                                    {previewFields.length > 0
                                      ? __('%count% fields ready to prefill', { count: previewFields.length })
                                      : __('No fields set in this template.')}
                                  </div>
                                )}
                                {isPreviewExpanded && visiblePreviewFields.length > 0 ? (
                                  <div className="upload-templates-manage__preview">
                                    {visiblePreviewFields.map((previewField) => (
                                      <span
                                        key={`${templateKey}:${previewField.label}`}
                                        className="upload-templates-manage__preview-item"
                                        title={`${previewField.label}: ${previewField.value}`}
                                      >
                                        <span className="upload-templates-manage__preview-label">
                                          {previewField.label}:{' '}
                                        </span>
                                        <span className="upload-templates-manage__preview-value">
                                          {truncatePreviewValue(previewField.value)}
                                        </span>
                                      </span>
                                    ))}
                                    {hiddenPreviewFieldCount > 0 && (
                                      <span className="upload-templates-manage__preview-more">
                                        {__('+%count% more', { count: hiddenPreviewFieldCount })}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  isPreviewExpanded && (
                                    <div className="upload-templates-manage__preview-empty">
                                      {__('No fields set in this template.')}
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="upload-templates-manage__actions">
                            <button
                              type="button"
                              className="upload-templates-manage__text-btn"
                              onClick={() => togglePreview(templateKey)}
                            >
                              <Icon icon={isPreviewExpanded ? ICONS.UP : ICONS.DOWN} />
                              {isPreviewExpanded
                                ? __('Hide fields')
                                : __('View fields (%count%)', { count: previewFields.length })}
                            </button>
                            <button
                              type="button"
                              className="upload-templates-manage__text-btn upload-templates-manage__text-btn--prefill"
                              onClick={() => handlePrefillNow(template)}
                            >
                              <Icon icon={ICONS.COPY} />
                              {__('Prefill now')}
                            </button>
                            <button
                              type="button"
                              className="upload-templates-manage__text-btn"
                              onClick={() => handleTogglePin(template)}
                            >
                              <Icon icon={ICONS.PIN} />
                              {template.isPinned ? __('Unpin') : __('Pin')}
                            </button>
                            <button
                              type="button"
                              className="upload-templates-manage__text-btn"
                              onClick={() => handleDuplicate(template)}
                            >
                              <Icon icon={ICONS.COPY_LINK} />
                              {__('Duplicate')}
                            </button>
                            <button
                              type="button"
                              className="upload-templates-manage__text-btn"
                              onClick={() => handleStartRename(template)}
                            >
                              <Icon icon={ICONS.EDIT} />
                              {__('Edit name')}
                            </button>
                            <button
                              type="button"
                              className="upload-templates-manage__text-btn upload-templates-manage__text-btn--delete"
                              onClick={() => handleDelete(template)}
                            >
                              <Icon icon={ICONS.DELETE} />
                              {__('Delete')}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        }
        actions={
          <div className="section__actions">
            <Button button="primary" label={__('Save Changes')} onClick={handleSave} disabled={!hasChanges} />
            <Button button="link" label={__('Cancel')} onClick={doHideModal} />
          </div>
        }
      />
    </Modal>
  );
}
