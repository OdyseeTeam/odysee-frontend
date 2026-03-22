import React from 'react';
import { useAppSelector } from 'redux/hooks';
import { selectThemePath } from 'redux/selectors/settings';

const Theme = () => {
  const themePath = useAppSelector(selectThemePath);

  if (!themePath) {
    return null;
  }

  return <link href={themePath} rel="stylesheet" type="text/css" media="screen,print" />;
};

export default Theme;
