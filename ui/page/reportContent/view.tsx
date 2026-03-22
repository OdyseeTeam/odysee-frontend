import React from 'react';
import { useLocation } from 'react-router-dom';
import Page from 'component/page';
import ReportContent from 'component/reportContent';
export default function ReportContentPage(props: any) {
  const location = useLocation();
  return (
    <Page
      noSideNavigation
      className="main--report-content"
      backout={{
        backoutLabel: __('Done'),
        title: __('Report content'),
      }}
      authRedirect={`${location.pathname}${location.search}`} // 'report_content?claimId=xxx'
    >
      <ReportContent />
    </Page>
  );
}
