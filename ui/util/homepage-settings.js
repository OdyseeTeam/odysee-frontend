// @flow

export function normalizeHomepageSettings(rawHomepageSettings: any): { [string]: any } {
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

export function getUploadTemplatesFromSettings(channelSettings: ?PerChannelSettings): Array<UploadTemplate> {
  if (!channelSettings) {
    return [];
  }

  // Primary source: top-level creator settings.
  if (Array.isArray(channelSettings.upload_templates)) {
    return channelSettings.upload_templates;
  }

  // Backward-compat fallback for previously-saved data.
  const normalizedHomepageSettings = normalizeHomepageSettings(channelSettings.homepage_settings);

  if (Array.isArray(normalizedHomepageSettings.upload_templates)) {
    return normalizedHomepageSettings.upload_templates;
  }

  return [];
}
