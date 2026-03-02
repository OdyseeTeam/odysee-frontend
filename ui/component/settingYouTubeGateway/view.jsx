// @flow
import * as React from 'react';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import * as SETTINGS from 'constants/settings';
import Button from 'component/button';
import Card from 'component/common/card';
import { FormField } from 'component/common/form';
import SettingsRow from 'component/settingsRow';

const VERCEL_DEPLOY_BASE_URL = 'https://vercel.com/new/clone';
// TODO: Replace with the final public template repository.
const YOUTUBE_GATEWAY_TEMPLATE_REPOSITORY = 'https://github.com/odyseeteam/odysee-youtube-gateway-template';
const VERCEL_CALLBACK_QUERY_KEYS = ['project-id', 'project-name', 'deployment-url', 'team-id', 'team-slug', 'from'];

type Props = {
  gatewayUrl: ?string,
  gatewayToken: ?string,
  setClientSetting: (string, any, ?boolean) => void,
  doToast: ({ message: string, isError?: boolean }) => void,
};

function normalizeGatewayUrl(rawUrl: ?string): ?string {
  if (!rawUrl) return null;

  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  const normalizedSource = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(normalizedSource);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;

    const normalizedPath = parsed.pathname ? parsed.pathname.replace(/\/+$/, '') : '';
    return `${parsed.origin}${normalizedPath}`;
  } catch {
    return null;
  }
}

export default function SettingYouTubeGateway(props: Props) {
  const { gatewayUrl, gatewayToken, setClientSetting, doToast } = props;
  const [draftUrl, setDraftUrl] = React.useState(gatewayUrl || '');
  const [draftToken, setDraftToken] = React.useState(gatewayToken || '');
  const [isTesting, setIsTesting] = React.useState(false);
  const [testMessage, setTestMessage] = React.useState<?string>(null);
  const [detectedProject, setDetectedProject] = React.useState<?string>(null);

  React.useEffect(() => {
    setDraftUrl(gatewayUrl || '');
  }, [gatewayUrl]);

  React.useEffect(() => {
    setDraftToken(gatewayToken || '');
  }, [gatewayToken]);

  const deployUrl = React.useMemo(() => {
    if (typeof window === 'undefined' || !YOUTUBE_GATEWAY_TEMPLATE_REPOSITORY) return null;

    const callbackUrl = `${window.location.origin}/$/${PAGES.SETTINGS}`;
    const query = new URLSearchParams({
      'repository-url': YOUTUBE_GATEWAY_TEMPLATE_REPOSITORY,
      'repository-name': 'odysee-youtube-gateway',
      'project-name': 'odysee-youtube-gateway',
      'demo-title': 'Odysee YouTube Gateway',
      'demo-description': 'Personal YouTube gateway for Odysee',
      'redirect-url': callbackUrl,
      'callback-url': callbackUrl,
    });

    return `${VERCEL_DEPLOY_BASE_URL}?${query.toString()}`;
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const searchParams = new URLSearchParams(window.location.search);
    const deploymentUrlParam = searchParams.get('deployment-url');

    if (!deploymentUrlParam) return;

    const normalizedDeploymentUrl = normalizeGatewayUrl(deploymentUrlParam);
    const projectName = searchParams.get('project-name');

    if (normalizedDeploymentUrl) {
      setDraftUrl(normalizedDeploymentUrl);
      setClientSetting(SETTINGS.YOUTUBE_GATEWAY_URL, normalizedDeploymentUrl, true);
      doToast({
        message: __('Gateway deployed. URL saved automatically.'),
      });
    } else {
      doToast({
        message: __('Gateway deployed, but URL could not be parsed. Paste it manually below.'),
        isError: true,
      });
    }

    if (projectName) {
      setDetectedProject(projectName);
    }

    VERCEL_CALLBACK_QUERY_KEYS.forEach((key) => searchParams.delete(key));

    const newSearch = searchParams.toString();
    const newUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}${window.location.hash || ''}`;
    window.history.replaceState(window.history.state, '', newUrl);
  }, [doToast, setClientSetting]);

  const handleSave = React.useCallback(() => {
    const normalizedUrl = normalizeGatewayUrl(draftUrl);

    if (!normalizedUrl) {
      doToast({ message: __('Please enter a valid gateway URL.'), isError: true });
      return;
    }

    const normalizedToken = draftToken.trim();

    setDraftUrl(normalizedUrl);
    setClientSetting(SETTINGS.YOUTUBE_GATEWAY_URL, normalizedUrl, true);
    setClientSetting(SETTINGS.YOUTUBE_GATEWAY_TOKEN, normalizedToken || null, true);
    setTestMessage(null);
    doToast({ message: __('YouTube gateway settings saved.') });
  }, [doToast, draftToken, draftUrl, setClientSetting]);

  const handleClear = React.useCallback(() => {
    setDraftUrl('');
    setDraftToken('');
    setTestMessage(null);
    setClientSetting(SETTINGS.YOUTUBE_GATEWAY_URL, null, true);
    setClientSetting(SETTINGS.YOUTUBE_GATEWAY_TOKEN, null, true);
    doToast({ message: __('YouTube gateway removed.') });
  }, [doToast, setClientSetting]);

  const handleTest = React.useCallback(async () => {
    const normalizedUrl = normalizeGatewayUrl(draftUrl);

    if (!normalizedUrl) {
      doToast({ message: __('Please enter a valid gateway URL first.'), isError: true });
      return;
    }

    setIsTesting(true);
    setTestMessage(null);

    const token = draftToken.trim();
    const headers = token ? { 'x-odysee-gateway-token': token } : {};
    const probePaths = ['/health', '/api/health'];
    let hasConnected = false;

    try {
      for (const path of probePaths) {
        try {
          const response = await fetch(`${normalizedUrl}${path}`, { method: 'GET', headers });
          if (response.ok) {
            hasConnected = true;
            setTestMessage(__('Gateway reachable (%status%).', { status: response.status }));
            break;
          }
        } catch {
          // try next endpoint
        }
      }
    } finally {
      setIsTesting(false);
    }

    if (!hasConnected) {
      setTestMessage(__('Could not reach this gateway from the browser. Check CORS and endpoint paths.'));
    }
  }, [doToast, draftToken, draftUrl]);

  return (
    <Card
      background
      isBodyList
      title={__('YouTube Gateway (Beta)')}
      subtitle={__('Bring your own gateway for YouTube API calls (desktop + mobile).')}
      body={
        <>
          <SettingsRow
            title={__('Deploy your personal gateway')}
            subtitle={__('One click deploy, then the URL can be auto-filled when you return here.')}
          >
            <Button
              button="primary"
              icon={ICONS.EXTERNAL}
              label={__('Deploy on Vercel')}
              navigate={deployUrl || 'https://vercel.com/new'}
            />
          </SettingsRow>

          <SettingsRow title={__('Gateway URL')} subtitle={__('Example: https://your-gateway.vercel.app')} multirow>
            <FormField
              type="text"
              name="youtube_gateway_url"
              value={draftUrl}
              placeholder="https://your-gateway.vercel.app"
              onChange={(e) => setDraftUrl(e.target.value)}
            />

            {detectedProject && (
              <p className="help">
                {__('Detected Vercel project: %project%', {
                  project: detectedProject,
                })}
              </p>
            )}
          </SettingsRow>

          <SettingsRow
            title={__('Gateway token (optional)')}
            subtitle={__('If your proxy requires a token, store it here.')}
            multirow
          >
            <FormField
              type="text"
              name="youtube_gateway_token"
              value={draftToken}
              placeholder={__('Optional token')}
              onChange={(e) => setDraftToken(e.target.value)}
            />
          </SettingsRow>

          <SettingsRow title={__('Actions')} multirow>
            <div className="section__actions">
              <Button
                button="secondary"
                icon={ICONS.VALIDATED}
                label={__('Save')}
                onClick={handleSave}
                disabled={!draftUrl.trim()}
              />
              <Button
                button="secondary"
                icon={isTesting ? ICONS.REFRESH : ICONS.CHECK}
                label={isTesting ? __('Testing...') : __('Test')}
                onClick={handleTest}
                disabled={isTesting || !draftUrl.trim()}
              />
              <Button button="link" label={__('Clear')} onClick={handleClear} />
            </div>

            {testMessage && <p className="help">{testMessage}</p>}
          </SettingsRow>
        </>
      }
    />
  );
}
