import { COPYRIGHT_ISSUES, OTHER_LEGAL_ISSUES } from 'constants/report_content';
import { ODYSEE_HYPERBEAM_NODE_API } from 'config';
import { HYPERBEAM_DEVICE, hyperbeamDeviceUrl } from 'util/hyperbeamDevices';

function getCategoryUrl(category: string) {
  switch (category) {
    case COPYRIGHT_ISSUES:
      return 'https://reports.odysee.tv/copyright_issue/new';

    case OTHER_LEGAL_ISSUES:
      return 'https://reports.odysee.tv/other_legal_issue/new';

    default:
      return 'https://reports.odysee.tv/common/new';
  }
}

export async function sendContentReport(category: string, params: string) {
  const node = String(ODYSEE_HYPERBEAM_NODE_API || '').replace(/\/+$/, '');
  if (node) {
    const url = hyperbeamDeviceUrl(HYPERBEAM_DEVICE.productEvents, 'report_content', {
      params64: base64Url(JSON.stringify({ category: hyperbeamNodeCategory(category), params })),
    });
    return fetch(url, { method: 'GET', headers: { accept: 'application/json' } });
  }

  return fetch(`${getCategoryUrl(category)}?${params}`, {
    method: 'POST',
  });
}
export type SendContentReportFn = typeof sendContentReport;

function hyperbeamNodeCategory(category: string) {
  switch (category) {
    case COPYRIGHT_ISSUES:
      return 'copyright';

    case OTHER_LEGAL_ISSUES:
      return 'other_legal';

    default:
      return 'common';
  }
}

function base64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
