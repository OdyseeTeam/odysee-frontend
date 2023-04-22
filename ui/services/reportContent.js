// @flow
import { COPYRIGHT_ISSUES, OTHER_LEGAL_ISSUES } from 'constants/report_content';

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
  return fetch(`${getCategoryUrl(category)}?${params}`, { method: 'POST' });
}

export type SendContentReportFn = typeof sendContentReport;
