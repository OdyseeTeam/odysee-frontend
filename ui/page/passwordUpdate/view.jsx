// @flow
import React from 'react';
import Card from 'component/common/card';
import Page from 'component/page';
import SettingAccountPassword from 'component/settingAccountPassword';

export default function PasswordUpdate() {
  return (
    <Page noFooter noSideNavigation settingsPage backout={{ title: __('Password'), backLabel: __('Back') }}>
      <Card background isBodyList body={<SettingAccountPassword />} />
    </Page>
  );
}
