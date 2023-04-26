// @flow
import React from 'react';
import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';

type Props = {
  label: string,
};

const PageLabel = (props: Props) => {
  const { label } = props;

  return (
    <h1 className="page__title">
      <Icon icon={ICONS.PLAYLIST} size={10} />
      <label>{label}</label>
    </h1>
  );
};

export default PageLabel;
