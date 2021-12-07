// @flow
import React from 'react';

type Props = {
  uri: string,
  cover: ?string,
};

const Wallpaper = (props: Props) => {
  const { cover } = props;

  return (
    cover && (
      <>
        <div className={'background-image'} style={{ backgroundImage: 'url("' + cover + '")' }} />
        <div className={'theme-dark'} />
      </>
    )
  );
};

export default Wallpaper;
