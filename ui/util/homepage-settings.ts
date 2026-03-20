export function normalizeHomepageSettings(rawHomepageSettings: any): Record<string, any> {
  if (!rawHomepageSettings) {
    return {};
  }

  if (Array.isArray(rawHomepageSettings)) {
    return {
      sections: rawHomepageSettings,
    };
  }

  if (typeof rawHomepageSettings === 'string') {
    try {
      const parsed = JSON.parse(rawHomepageSettings);

      if (Array.isArray(parsed)) {
        return {
          sections: parsed,
        };
      }

      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    } catch (e) {}

    return {};
  }

  if (typeof rawHomepageSettings === 'object') {
    return rawHomepageSettings;
  }

  return {};
}

function normalizeUploadTemplates(rawTemplates: any): Array<UploadTemplate> {
  if (!rawTemplates) {
    return [];
  }

  let parsedTemplates = rawTemplates;

  if (typeof rawTemplates === 'string') {
    try {
      parsedTemplates = JSON.parse(rawTemplates);
    } catch (e) {
      return [];
    }
  }

  if (!Array.isArray(parsedTemplates)) {
    return [];
  }

  return parsedTemplates
    .map((template, index) => {
      if (!template || typeof template !== 'object') return null;
      const name = typeof template.name === 'string' ? template.name.trim() : '';
      if (!name) return null;
      const createdAt = Number(template.createdAt || 0);
      const lastUsedAt = Number(template.lastUsedAt || 0);
      const isPinned = Boolean(template.isPinned);
      const data = template.data && typeof template.data === 'object' ? template.data : {};
      return {
        id: template.id || `${name.toLowerCase().replace(/\s+/g, '-')}-${createdAt || index}`,
        name,
        createdAt: Number.isFinite(createdAt) ? createdAt : 0,
        lastUsedAt: Number.isFinite(lastUsedAt) && lastUsedAt > 0 ? lastUsedAt : undefined,
        isPinned,
        data,
      };
    })
    .filter(Boolean);
}

export function getUploadTemplatesFromSettings(
  channelSettings: PerChannelSettings | null | undefined
): Array<UploadTemplate> {
  if (!channelSettings) {
    return [];
  }

  // Primary source: top-level creator settings.
  const topLevelTemplates = normalizeUploadTemplates(channelSettings.upload_templates);

  if (topLevelTemplates.length > 0) {
    return topLevelTemplates;
  }

  // Backward-compat fallback for previously-saved data.
  const normalizedHomepageSettings = normalizeHomepageSettings(channelSettings.homepage_settings);
  const fallbackTemplates = normalizeUploadTemplates(normalizedHomepageSettings.upload_templates);

  if (fallbackTemplates.length > 0) {
    return fallbackTemplates;
  }

  return [];
}
