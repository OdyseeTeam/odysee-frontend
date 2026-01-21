// @flow
import React from 'react';
import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';

function getThemeFromParams(): ?string {
  const urlParams = new URLSearchParams(window.location.search);
  const themeParam = urlParams.get('theme');
  if (themeParam === 'dark' || themeParam === 'light') {
    return themeParam;
  }
  return null;
}

function getBrowserTheme(): string {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
}

const SpinnerPage = () => {
  const paramTheme = getThemeFromParams();
  const theme = paramTheme || getBrowserTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`spinner-page ${isDark ? 'spinner-page--dark' : 'spinner-page--light'}`}>
      <div className="spinner-page__container">
        <div className="spinner-page__ring" />
        <div className="spinner-page__logo">
          <Icon icon={ICONS.ODYSEE_LOGO} />
        </div>
      </div>
    </div>
  );
};

export default SpinnerPage;
